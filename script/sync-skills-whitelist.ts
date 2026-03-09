#!/usr/bin/env bun

import { createHash } from "node:crypto"
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { basename, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

type SourceName = "anthropic" | "openai-curated" | "openai-system" | "microsoft" | "skills-main"
type Decision = "allow" | "review" | "deny"

interface SourceSpec {
  name: SourceName
  basePath: string
  rootLicensePath?: string
  maxDepth?: number
}

interface SkillRecord {
  source: SourceName
  skillName: string
  description: string | null
  outputName: string
  relativePath: string
  skillFile: string
  licensePath: string | null
  decision: Decision
  reason: string
  skillSha256: string
}

interface Manifest {
  schema: "labforge-skill-sync/v1"
  generatedAt: string
  workspaceRoot: string
  allowCount: number
  reviewCount: number
  denyCount: number
  records: SkillRecord[]
}

const RESTRICTED_ANTHROPIC_SKILLS = new Set(["docx", "pdf", "pptx", "xlsx"])

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true).catch(() => false)
}

async function findSkillDirs(basePath: string, maxDepth = 1): Promise<string[]> {
  const found = new Set<string>()
  const queue: Array<{ dir: string; depth: number }> = [{ dir: basePath, depth: 0 }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const skillPath = join(current.dir, "SKILL.md")
    if (await exists(skillPath)) {
      found.add(current.dir)
    }

    if (current.depth >= maxDepth) continue

    const entries = await readdir(current.dir, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      queue.push({ dir: join(current.dir, entry.name), depth: current.depth + 1 })
    }
  }

  return Array.from(found)
}

async function parseFrontmatter(path: string): Promise<{ name: string | null; description: string | null }> {
  const raw = await readFile(path, "utf8").catch(() => "")
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return { name: null, description: null }

  const body = match[1] ?? ""
  const name = body.match(/^name:\s*(.+)$/m)?.[1]?.trim()?.replace(/^['"]|['"]$/g, "") ?? null
  const description = body
    .match(/^description:\s*(.+)$/m)?.[1]
    ?.trim()
    ?.replace(/^['"]|['"]$/g, "") ?? null

  return { name, description }
}

async function resolveLicensePath(skillDir: string, rootLicensePath?: string): Promise<string | null> {
  const localCandidates = ["LICENSE.txt", "LICENSE", "license.txt", "license"]
  for (const candidate of localCandidates) {
    const path = join(skillDir, candidate)
    if (await exists(path)) return path
  }

  if (rootLicensePath && (await exists(rootLicensePath))) {
    return rootLicensePath
  }

  return null
}

async function sha256(path: string): Promise<string> {
  const content = await readFile(path)
  return createHash("sha256").update(content).digest("hex")
}

function classifyByLicenseText(input: string | null): Decision {
  if (!input) return "review"
  const content = input.toLowerCase()

  if (
    content.includes("all rights reserved") ||
    content.includes("not open source") ||
    content.includes("do not copy") ||
    content.includes("may not copy") ||
    content.includes("may not distribute") ||
    content.includes("no derivative")
  ) {
    return "deny"
  }

  if (content.includes("apache license") || content.includes("mit license")) {
    return "allow"
  }

  return "review"
}

async function decideSkill(options: {
  source: SourceName
  skillName: string
  licensePath: string | null
}): Promise<{ decision: Decision; reason: string }> {
  if (options.source === "anthropic" && RESTRICTED_ANTHROPIC_SKILLS.has(options.skillName)) {
    return {
      decision: "deny",
      reason: "anthropic restricted document skill",
    }
  }

  if (!options.licensePath) {
    return {
      decision: "review",
      reason: "license file missing",
    }
  }

  const licenseText = await readFile(options.licensePath, "utf8").catch(() => "")
  const byText = classifyByLicenseText(licenseText)

  if (byText === "allow") {
    return { decision: "allow", reason: "license text matches allowlist (MIT/Apache)" }
  }

  if (byText === "deny") {
    return { decision: "deny", reason: "restrictive license text detected" }
  }

  return { decision: "review", reason: "license requires manual review" }
}

async function collectFromSource(source: SourceSpec, workspaceRoot: string): Promise<SkillRecord[]> {
  if (!(await exists(source.basePath))) {
    console.warn(`[skip] missing source: ${source.name} -> ${source.basePath}`)
    return []
  }

  const skillDirs = await findSkillDirs(source.basePath, source.maxDepth ?? 1)
  const records: SkillRecord[] = []

  for (const skillDir of skillDirs) {
    const skillFile = join(skillDir, "SKILL.md")
    if (!(await exists(skillFile))) continue

    const frontmatter = await parseFrontmatter(skillFile)
    const skillName = frontmatter.name ?? basename(skillDir)
    const licensePath = await resolveLicensePath(skillDir, source.rootLicensePath)
    const { decision, reason } = await decideSkill({
      source: source.name,
      skillName,
      licensePath,
    })

    records.push({
      source: source.name,
      skillName,
      description: frontmatter.description,
      outputName: "",
      relativePath: relative(workspaceRoot, skillDir),
      skillFile: relative(workspaceRoot, skillFile),
      licensePath: licensePath ? relative(workspaceRoot, licensePath) : null,
      decision,
      reason,
      skillSha256: await sha256(skillFile),
    })
  }

  return records
}

function toSafeSegment(input: string): string {
  const normalized = input
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")

  return normalized.length > 0 ? normalized : "skill"
}

function assignOutputNames(records: SkillRecord[]): SkillRecord[] {
  const used = new Set<string>()
  return records.map((record) => {
    const base = toSafeSegment(record.skillName).slice(0, 96)
    let candidate = base

    if (used.has(`${record.source}/${candidate}`)) {
      candidate = `${base}-${record.skillSha256.slice(0, 8)}`
    }

    used.add(`${record.source}/${candidate}`)
    return {
      ...record,
      outputName: candidate,
    }
  })
}

async function writeOutputs(options: {
  records: SkillRecord[]
  workspaceRoot: string
  dryRun: boolean
}): Promise<void> {
  const whitelistDir = join(options.workspaceRoot, "external", "skills-whitelist")
  const quarantineDir = join(options.workspaceRoot, "external", "skills-quarantine")
  const manifestPath = join(options.workspaceRoot, "external", "skills-manifest.json")

  if (!options.dryRun) {
    await rm(whitelistDir, { recursive: true, force: true })
    await rm(quarantineDir, { recursive: true, force: true })
    await mkdir(whitelistDir, { recursive: true })
    await mkdir(quarantineDir, { recursive: true })
  }

  const normalizedRecords = assignOutputNames(options.records)

  for (const record of normalizedRecords) {
    if (record.decision === "deny") continue
    const sourcePath = join(options.workspaceRoot, record.relativePath)
    const targetBase = record.decision === "allow" ? whitelistDir : quarantineDir
    const targetDir = join(targetBase, record.source, record.outputName)

    if (!options.dryRun) {
      await mkdir(join(targetBase, record.source), { recursive: true })
      await cp(sourcePath, targetDir, { recursive: true })
    }
  }

  const manifest: Manifest = {
    schema: "labforge-skill-sync/v1",
    generatedAt: new Date().toISOString(),
    workspaceRoot: options.workspaceRoot,
    allowCount: options.records.filter((record) => record.decision === "allow").length,
    reviewCount: options.records.filter((record) => record.decision === "review").length,
    denyCount: options.records.filter((record) => record.decision === "deny").length,
    records: normalizedRecords,
  }

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8")

  console.log(`[sync] allow=${manifest.allowCount}, review=${manifest.reviewCount}, deny=${manifest.denyCount}`)
  console.log(`[sync] manifest: ${manifestPath}`)
}

function getSources(workspaceRoot: string): SourceSpec[] {
  const optionalSkillsMain = process.env.SKILLS_MAIN_DIR
  const sources: SourceSpec[] = [
    {
      name: "anthropic",
      basePath: join(workspaceRoot, "external", "anthropics-skills", "skills"),
      maxDepth: 1,
    },
    {
      name: "openai-curated",
      basePath: join(workspaceRoot, "external", "openai-skills", "skills", ".curated"),
      maxDepth: 1,
    },
    {
      name: "openai-system",
      basePath: join(workspaceRoot, "external", "openai-skills", "skills", ".system"),
      maxDepth: 1,
    },
    {
      name: "microsoft",
      basePath: join(workspaceRoot, "external", "microsoft-skills", ".github", "skills"),
      rootLicensePath: join(workspaceRoot, "external", "microsoft-skills", "LICENSE"),
      maxDepth: 1,
    },
  ]

  if (optionalSkillsMain) {
    sources.push({
      name: "skills-main",
      basePath: resolve(optionalSkillsMain),
      maxDepth: 3,
    })
  }

  return sources
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
  const sources = getSources(workspaceRoot)

  console.log(`[sync] workspace: ${workspaceRoot}`)
  console.log(`[sync] dry-run: ${dryRun}`)

  const allRecords: SkillRecord[] = []
  for (const source of sources) {
    const records = await collectFromSource(source, workspaceRoot)
    console.log(`[sync] source=${source.name} skills=${records.length}`)
    allRecords.push(...records)
  }

  await writeOutputs({
    records: allRecords,
    workspaceRoot,
    dryRun,
  })
}

main().catch((error) => {
  console.error("sync-skills-whitelist failed")
  console.error(error)
  process.exitCode = 1
})
