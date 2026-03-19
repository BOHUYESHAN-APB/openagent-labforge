#!/usr/bin/env bun

import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { parseFrontmatter } from "../src/shared/frontmatter"

type BundleName = "full" | "paper"
type SkillOrigin = "builtin" | "external"

interface CatalogEntry {
  name: string
  description: string
  slug: string
  category: string
  subcategory: string
  origin: SkillOrigin
  source: string
  license?: string
  bundleTargets: BundleName[]
  path: string
}

interface SkillsCatalog {
  schema: "labforge-skills-catalog/v1"
  generatedAt: string
  bundles: Record<BundleName, { skillCount: number; categories: string[] }>
  entries: CatalogEntry[]
}

interface ManifestRecord {
  source: string
  skillName: string
  description: string | null
  decision: "allow" | "review" | "deny"
  relativePath: string
  skillFile: string
  licensePath: string | null
}

interface BuiltinSpec {
  name: string
  description: string
  source: string
  category: string
  subcategory: string
  bundleTargets: BundleName[]
}

const BUILTIN_SPECS: BuiltinSpec[] = [
  {
    name: "playwright",
    description: "Browser automation via Playwright MCP for verification, scraping, screenshots, and site interaction.",
    source: "builtin:playwright",
    category: "engineering",
    subcategory: "browser-automation",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "agent-browser",
    description: "Persistent browser automation using agent-browser CLI.",
    source: "builtin:agent-browser",
    category: "engineering",
    subcategory: "browser-automation",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "frontend-ui-ux",
    description: "High-design frontend UI and UX implementation skill.",
    source: "builtin:frontend-ui-ux",
    category: "engineering",
    subcategory: "frontend-ui",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "git-master",
    description: "Advanced git workflow skill for commit splitting, history search, and rebase operations.",
    source: "builtin:git-master",
    category: "engineering",
    subcategory: "version-control",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "dev-browser",
    description: "Scriptable browser automation with persistent page state for navigation, scraping, and testing.",
    source: "builtin:dev-browser",
    category: "engineering",
    subcategory: "browser-automation",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "docx-workbench",
    description: "Create, edit, and review DOCX documents with reproducible formatting.",
    source: "builtin:docx-workbench",
    category: "research",
    subcategory: "document-authoring",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "pdf-toolkit",
    description: "Create, extract, and transform PDFs with reproducible layout.",
    source: "builtin:pdf-toolkit",
    category: "research",
    subcategory: "document-authoring",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "pptx-studio",
    description: "Generate and edit PPTX decks with structured layouts.",
    source: "builtin:pptx-studio",
    category: "research",
    subcategory: "presentation-authoring",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "xlsx-analyst",
    description: "Analyze and format XLSX files with reproducible calculations.",
    source: "builtin:xlsx-analyst",
    category: "data-analysis",
    subcategory: "tabular-analysis",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "web-research",
    description: "Structured web research and source triage with citations.",
    source: "builtin:web-research",
    category: "research",
    subcategory: "literature-and-web-search",
    bundleTargets: ["full", "paper"],
  },
  {
    name: "data-analysis",
    description: "Statistical analysis workflow with reproducible outputs.",
    source: "builtin:data-analysis",
    category: "data-analysis",
    subcategory: "statistics",
    bundleTargets: ["full", "paper"],
  },
]

const EXTERNAL_MAPPING: Record<string, { category: string; subcategory: string; bundles: BundleName[] }> = {
  "anthropic/internal-comms": { category: "productivity", subcategory: "communication", bundles: ["full", "paper"] },
  "anthropic/mcp-builder": { category: "engineering", subcategory: "mcp-and-tooling", bundles: ["full", "paper"] },
  "anthropic/skill-creator": { category: "engineering", subcategory: "skill-authoring", bundles: ["full", "paper"] },
  "anthropic/webapp-testing": { category: "engineering", subcategory: "browser-testing", bundles: ["full", "paper"] },
  "anthropic/frontend-design": { category: "engineering", subcategory: "frontend-ui", bundles: ["full", "paper"] },
  "openai-curated/openai-docs": { category: "research", subcategory: "api-documentation", bundles: ["full", "paper"] },
  "openai-curated/jupyter-notebook": { category: "data-analysis", subcategory: "notebooks", bundles: ["full", "paper"] },
  "openai-curated/pdf": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "openai-curated/doc": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "openai-curated/spreadsheet": { category: "data-analysis", subcategory: "tabular-analysis", bundles: ["full", "paper"] },
  "openai-curated/transcribe": { category: "research", subcategory: "media-transcription", bundles: ["full", "paper"] },
  "openai-curated/slides": { category: "research", subcategory: "presentation-authoring", bundles: ["full", "paper"] },
  "openai-curated/playwright": { category: "engineering", subcategory: "browser-automation", bundles: ["full", "paper"] },
  "openai-curated/playwright-interactive": { category: "engineering", subcategory: "browser-automation", bundles: ["full", "paper"] },
  "openai-curated/screenshot": { category: "engineering", subcategory: "browser-testing", bundles: ["full", "paper"] },
  "openai-curated/security-best-practices": { category: "engineering", subcategory: "security", bundles: ["full", "paper"] },
  "openai-curated/security-threat-model": { category: "engineering", subcategory: "security", bundles: ["full", "paper"] },
  "openai-curated/security-ownership-map": { category: "engineering", subcategory: "security", bundles: ["full", "paper"] },
  "openai-curated/gh-fix-ci": { category: "engineering", subcategory: "ci-and-delivery", bundles: ["full", "paper"] },
  "openai-curated/gh-address-comments": { category: "engineering", subcategory: "code-review", bundles: ["full", "paper"] },
  "openai-curated/sentry": { category: "engineering", subcategory: "observability", bundles: ["full", "paper"] },
  "openai-curated/linear": { category: "productivity", subcategory: "issue-tracking", bundles: ["full", "paper"] },
  "openai-curated/vercel-deploy": { category: "engineering", subcategory: "deployment", bundles: ["full", "paper"] },
  "openai-curated/netlify-deploy": { category: "engineering", subcategory: "deployment", bundles: ["full", "paper"] },
  "openai-curated/render-deploy": { category: "engineering", subcategory: "deployment", bundles: ["full", "paper"] },
  "openai-curated/cloudflare-deploy": { category: "engineering", subcategory: "deployment", bundles: ["full", "paper"] },
  "openai-curated/chatgpt-apps": { category: "engineering", subcategory: "app-integration", bundles: ["full", "paper"] },
  "openai-system/skill-installer": { category: "engineering", subcategory: "skill-authoring", bundles: ["full", "paper"] },
  "openai-system/skill-creator": { category: "engineering", subcategory: "skill-authoring", bundles: ["full", "paper"] },
  "openai-system/openai-docs": { category: "research", subcategory: "api-documentation", bundles: ["full", "paper"] },
  "microsoft/github-issue-creator": { category: "productivity", subcategory: "issue-tracking", bundles: ["full", "paper"] },
  "microsoft/fastapi-router-py": { category: "engineering", subcategory: "backend-api", bundles: ["full", "paper"] },
  "microsoft/pydantic-models-py": { category: "engineering", subcategory: "backend-api", bundles: ["full", "paper"] },
  "microsoft/skill-creator": { category: "engineering", subcategory: "skill-authoring", bundles: ["full", "paper"] },
  "microsoft/mcp-builder": { category: "engineering", subcategory: "mcp-and-tooling", bundles: ["full"] },
  "skills-main/virtualbox": { category: "engineering", subcategory: "virtualization", bundles: ["full"] },
  "skills-main/youtube-search": { category: "research", subcategory: "media-search", bundles: ["full"] },
  "skills-main/voiceclaw": { category: "productivity", subcategory: "voice-and-accessibility", bundles: ["full"] },
  "auto-claude/analyze-results": { category: "data-analysis", subcategory: "statistics", bundles: ["full", "paper"] },
  "auto-claude/arxiv": { category: "research", subcategory: "literature-and-web-search", bundles: ["full", "paper"] },
  "auto-claude/dse-loop": { category: "data-analysis", subcategory: "optimization", bundles: ["full", "paper"] },
  "auto-claude/feishu-notify": { category: "productivity", subcategory: "communication", bundles: ["full", "paper"] },
  "auto-claude/idea-creator": { category: "research", subcategory: "research-ideation", bundles: ["full", "paper"] },
  "auto-claude/idea-discovery": { category: "research", subcategory: "research-ideation", bundles: ["full", "paper"] },
  "auto-claude/idea-discovery-robot": { category: "research", subcategory: "research-ideation", bundles: ["full", "paper"] },
  "auto-claude/monitor-experiment": { category: "data-analysis", subcategory: "experiment-monitoring", bundles: ["full", "paper"] },
  "auto-claude/novelty-check": { category: "research", subcategory: "literature-and-web-search", bundles: ["full", "paper"] },
  "auto-claude/paper-compile": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "auto-claude/paper-figure": { category: "data-analysis", subcategory: "visualization", bundles: ["full", "paper"] },
  "auto-claude/paper-plan": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "auto-claude/paper-write": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "auto-claude/paper-writing": { category: "research", subcategory: "document-authoring", bundles: ["full", "paper"] },
  "auto-claude/pixel-art": { category: "productivity", subcategory: "visual-design", bundles: ["full", "paper"] },
  "auto-claude/proof-writer": { category: "research", subcategory: "theory-writing", bundles: ["full", "paper"] },
  "auto-claude/research-lit": { category: "research", subcategory: "literature-and-web-search", bundles: ["full", "paper"] },
  "auto-claude/research-pipeline": { category: "research", subcategory: "research-ideation", bundles: ["full", "paper"] },
  "auto-claude/run-experiment": { category: "data-analysis", subcategory: "experiment-ops", bundles: ["full", "paper"] },
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true).catch(() => false)
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function normalizeDescription(input: string | null | undefined): string {
  return (input ?? "").replace(/\s+/g, " ").trim()
}

function buildUniqueSkillName(baseName: string, source: string): string {
  if (source === "builtin") return baseName
  return `${source}/${baseName}`
}

function buildIndexMarkdown(bundle: BundleName, entries: CatalogEntry[]): string {
  const grouped = new Map<string, CatalogEntry[]>()

  for (const entry of entries.filter((item) => item.bundleTargets.includes(bundle))) {
    const key = `${entry.category}/${entry.subcategory}`
    const current = grouped.get(key) ?? []
    current.push(entry)
    grouped.set(key, current)
  }

  const lines: string[] = [
    `# Labforge Skills Index (${bundle})`,
    "",
    "This file is generated. Skills are grouped by function for low-token preview before reading full instructions.",
    "",
  ]

  for (const key of Array.from(grouped.keys()).sort()) {
    const [category, subcategory] = key.split("/")
    lines.push(`## ${category} / ${subcategory}`)
    lines.push("")
    for (const entry of grouped.get(key) ?? []) {
      lines.push(`- \`${entry.name}\` [${entry.slug}] — ${entry.description} _(source: ${entry.source})_`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

async function materializeEntry(entry: CatalogEntry, targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true }).catch(() => undefined)
  await mkdir(targetDir, { recursive: true })

  if (entry.origin === "external") {
    await cp(entry.path, targetDir, { recursive: true })
    const externalSkillPath = join(targetDir, "SKILL.md")
    const externalSkillContent = await readFile(externalSkillPath, "utf8")
    const parsed = parseFrontmatter<Record<string, unknown>>(externalSkillContent)
    const body = parsed.body.replace(/^\n+/, "")
    const data = {
      ...parsed.data,
      name: entry.name,
      metadata: {
        ...(typeof parsed.data.metadata === "object" && parsed.data.metadata ? parsed.data.metadata as Record<string, unknown> : {}),
        category: `${entry.category}/${entry.subcategory}`,
      },
    }
    const frontmatterLines = ["---"]
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue
      if (value && typeof value === "object" && !Array.isArray(value)) {
        frontmatterLines.push(`${key}:`)
        for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
          frontmatterLines.push(`  ${childKey}: ${JSON.stringify(childValue)}`)
        }
        continue
      }
      frontmatterLines.push(`${key}: ${JSON.stringify(value)}`)
    }
    frontmatterLines.push("---", "")
    await writeFile(externalSkillPath, `${frontmatterLines.join("\n")}${body}`, "utf8")
    return
  }

  const skillBody = [`# ${entry.name}`, "", entry.description || "Curated builtin skill.", ""].join("\n")
  const frontmatter = [
    "---",
    `name: ${JSON.stringify(entry.name)}`,
    `description: ${JSON.stringify(entry.description)}`,
    "metadata:",
    `  category: ${JSON.stringify(`${entry.category}/${entry.subcategory}`)}`,
    "---",
    "",
  ].join("\n")

  await writeFile(join(targetDir, "SKILL.md"), `${frontmatter}${skillBody}`, "utf8")
}

async function loadManifestEntries(workspaceRoot: string): Promise<CatalogEntry[]> {
  const manifestPath = join(workspaceRoot, "external", "skills-manifest.json")
  const raw = await readFile(manifestPath, "utf8")
  const manifest = JSON.parse(raw) as { records: ManifestRecord[] }
  const entries: CatalogEntry[] = []

  for (const record of manifest.records) {
    if (record.decision !== "allow") continue
    const mapping = EXTERNAL_MAPPING[`${record.source}/${record.skillName}`]
    if (!mapping) continue

    entries.push({
      name: buildUniqueSkillName(record.skillName, record.source),
      description: normalizeDescription(record.description),
      slug: `${record.source}__${record.skillName}`,
      category: mapping.category,
      subcategory: mapping.subcategory,
      origin: "external",
      source: record.source,
      license: record.licensePath ?? undefined,
      bundleTargets: mapping.bundles,
      path: join(workspaceRoot, record.relativePath),
    })
  }

  return entries
}

async function buildBuiltinEntries(workspaceRoot: string): Promise<CatalogEntry[]> {
  const builtinBase = join(workspaceRoot, "src", "features", "builtin-skills", "skills")
  const entries: CatalogEntry[] = []

  for (const spec of BUILTIN_SPECS) {
    let candidatePath = join(builtinBase, `${spec.name}.ts`)
    if (!(await exists(candidatePath)) && spec.name === "docx-workbench") candidatePath = join(builtinBase, "docx.ts")
    if (!(await exists(candidatePath)) && spec.name === "pdf-toolkit") candidatePath = join(builtinBase, "pdf.ts")
    if (!(await exists(candidatePath)) && spec.name === "pptx-studio") candidatePath = join(builtinBase, "pptx.ts")
    if (!(await exists(candidatePath)) && spec.name === "xlsx-analyst") candidatePath = join(builtinBase, "xlsx.ts")
    if (!(await exists(candidatePath)) && spec.name === "web-research") candidatePath = join(builtinBase, "web-research.ts")
    if (!(await exists(candidatePath)) && spec.name === "data-analysis") candidatePath = join(builtinBase, "data-analysis.ts")
    if (!(await exists(candidatePath)) && spec.name === "frontend-ui-ux") candidatePath = join(builtinBase, "frontend-ui-ux.ts")
    if (!(await exists(candidatePath)) && spec.name === "dev-browser") candidatePath = join(builtinBase, "dev-browser.ts")
    if (!(await exists(candidatePath)) && spec.name === "git-master") candidatePath = join(builtinBase, "git-master.ts")
    if (!(await exists(candidatePath)) && spec.name === "playwright") candidatePath = join(builtinBase, "playwright.ts")
    if (!(await exists(candidatePath)) && spec.name === "agent-browser") candidatePath = join(builtinBase, "playwright.ts")

    entries.push({
      name: buildUniqueSkillName(spec.name, "builtin"),
      description: spec.description,
      slug: `${spec.source.replace(/[:/]/g, "__")}__${spec.name}`,
      category: spec.category,
      subcategory: spec.subcategory,
      origin: "builtin",
      source: spec.source,
      bundleTargets: spec.bundleTargets,
      path: candidatePath,
    })
  }

  return entries
}

async function materializeBundle(workspaceRoot: string, bundle: BundleName, entries: CatalogEntry[]): Promise<void> {
  const bundleRoot = join(workspaceRoot, "generated", "skills-bundles", bundle)
  const skillsRoot = join(bundleRoot, "skills")
  await rm(bundleRoot, { recursive: true, force: true })
  await mkdir(skillsRoot, { recursive: true })

  for (const entry of entries.filter((item) => item.bundleTargets.includes(bundle))) {
    const target = join(skillsRoot, entry.category, entry.subcategory, entry.slug)
    await materializeEntry(entry, target)
  }

  await writeFile(join(bundleRoot, "INDEX.md"), buildIndexMarkdown(bundle, entries), "utf8")
}

async function main() {
  const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
  const builtinEntries = await buildBuiltinEntries(workspaceRoot)
  const externalEntries = await loadManifestEntries(workspaceRoot)
  const entries = [...builtinEntries, ...externalEntries]

  const catalog: SkillsCatalog = {
    schema: "labforge-skills-catalog/v1",
    generatedAt: new Date().toISOString(),
    bundles: {
      full: {
        skillCount: entries.filter((entry) => entry.bundleTargets.includes("full")).length,
        categories: unique(entries.filter((entry) => entry.bundleTargets.includes("full")).map((entry) => entry.category)).sort(),
      },
      paper: {
        skillCount: entries.filter((entry) => entry.bundleTargets.includes("paper")).length,
        categories: unique(entries.filter((entry) => entry.bundleTargets.includes("paper")).map((entry) => entry.category)).sort(),
      },
    },
    entries: entries.sort((a, b) => a.category.localeCompare(b.category) || a.subcategory.localeCompare(b.subcategory) || a.name.localeCompare(b.name)),
  }

  const generatedRoot = join(workspaceRoot, "generated", "skills-bundles")
  await mkdir(generatedRoot, { recursive: true })
  await writeFile(join(generatedRoot, "catalog.json"), JSON.stringify(catalog, null, 2), "utf8")

  await materializeBundle(workspaceRoot, "full", entries)
  await materializeBundle(workspaceRoot, "paper", entries)

  console.log(`[skills-catalog] full=${catalog.bundles.full.skillCount} paper=${catalog.bundles.paper.skillCount}`)
  console.log(`[skills-catalog] output=${generatedRoot}`)
}

main().catch((error) => {
  console.error("build-skills-catalog failed")
  console.error(error)
  process.exitCode = 1
})
