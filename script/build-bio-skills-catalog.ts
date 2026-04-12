#!/usr/bin/env bun

import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { parseFrontmatter } from "../src/shared/frontmatter"

interface BioLeafEntry {
  skillName: string
  description: string
  categoryName: string
  source: "gptomics" | "labforge-builtin"
  sourcePath?: string
  builtinTarget?: string
}

interface BioCategoryEntry {
  categoryName: string
  summary: string
  leaves: BioLeafEntry[]
}

interface BuiltinWrapperSpec {
  skillName: string
  description: string
}

const BIO_BUNDLE_NAME = "bio"
const BIO_ROOT_SKILL_NAME = "bioinformatics"
const BIO_ROOT_DESCRIPTION =
  "Root directory for the full bioinformatics skill catalog. Use this first to choose the correct bio category before loading detailed leaf skills."

const BUILTIN_BIO_WRAPPERS: BuiltinWrapperSpec[] = [
  { skillName: "bio-tools", description: "Opinionated Labforge bio toolchain and environment guidance." },
  { skillName: "bio-methods", description: "Method design, study framing, and statistical planning for bio workflows." },
  { skillName: "bio-pipeline", description: "Execution-stage pipeline guidance for multi-step bioinformatics tasks." },
  { skillName: "paper-evidence", description: "Paper evidence extraction and synthesis for scientific tasks." },
  { skillName: "wet-lab-design", description: "Wet-lab validation design and follow-up experiment planning." },
  { skillName: "bio-visualization", description: "Publication-ready bio figure and plot guidance." },
  { skillName: "blast-search", description: "Homology and BLAST-driven sequence search guidance." },
  { skillName: "functional-annotation", description: "Functional annotation, domain, and pathway interpretation guidance." },
  { skillName: "differential-expression", description: "Differential expression analysis guidance." },
  { skillName: "scrna-preprocessing", description: "Single-cell preprocessing, QC, and clustering guidance." },
  { skillName: "cell-annotation", description: "Cell type annotation and marker review guidance." },
  { skillName: "atac-seq", description: "ATAC-seq execution guidance." },
  { skillName: "chip-seq", description: "ChIP-seq execution guidance." },
  { skillName: "metagenomics", description: "Metagenomics execution guidance." },
  { skillName: "proteomics", description: "Proteomics execution guidance." },
  { skillName: "pubmed-search", description: "PubMed literature search guidance." },
  { skillName: "geo-query", description: "GEO dataset retrieval and reuse guidance." },
  { skillName: "sequence-analysis", description: "Sequence parsing and analysis guidance." },
  { skillName: "structural-biology", description: "Protein and structure analysis guidance." },
  { skillName: "vector-design", description: "Vector and construct design guidance." },
  { skillName: "experimental-design", description: "Experimental design and power analysis guidance." },
  { skillName: "read-qc", description: "FASTQ quality control and preprocessing guidance." },
  { skillName: "read-alignment", description: "Read alignment and mapping guidance." },
  { skillName: "rna-quantification", description: "RNA quantification guidance." },
  { skillName: "pathway-analysis", description: "Pathway enrichment and GSEA guidance." },
  { skillName: "variant-calling", description: "Variant calling workflow guidance." },
  { skillName: "genome-annotation", description: "Genome annotation workflow guidance." },
  { skillName: "workflow-management", description: "Reusable workflow and pipeline framework guidance." },
  { skillName: "reporting", description: "Reproducible scientific reporting guidance." },
  { skillName: "genome-intervals", description: "Genome interval and annotation-file operations guidance." },
]

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true).catch(() => false)
}

function toTitleCase(input: string): string {
  return input
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function buildFrontmatter(args: {
  name: string
  description: string
  category: string
  discoveryHidden: boolean
  tier: "root" | "category" | "leaf"
  source: string
  targetBuiltin?: string
}): string {
  const lines = [
    "---",
    `name: ${JSON.stringify(args.name)}`,
    `description: ${JSON.stringify(args.description)}`,
    "metadata:",
    `  category: ${JSON.stringify(args.category)}`,
    `  discovery_hidden: ${JSON.stringify(String(args.discoveryHidden))}`,
    `  catalog_tier: ${JSON.stringify(args.tier)}`,
    `  upstream_source: ${JSON.stringify(args.source)}`,
    ...(args.targetBuiltin
      ? [`  routes_to_builtin: ${JSON.stringify(args.targetBuiltin)}`]
      : []),
    "---",
    "",
  ]

  return lines.join("\n")
}

function buildRootSkillBody(categories: BioCategoryEntry[]): string {
  const lines = [
    "# Bioinformatics Skills Directory",
    "",
    "Use this root directory first when a bioinformatics request is broad, spans multiple assay types, or when you are not yet sure which specialized category should be loaded.",
    "",
    "## Routing workflow",
    "",
    "1. Match the task to one category guide below.",
    "2. Invoke that category guide via the `skill` tool.",
    "3. From the category guide, choose one or more detailed leaf skills.",
    "4. Load leaf skills only after the category is clear.",
    "",
    "## Category Guides",
    "",
  ]

  for (const category of categories) {
    lines.push(
      `- \`research/bioinformatics/${category.categoryName}\` — ${category.summary} (${category.leaves.length} leaf skills)`,
    )
  }

  lines.push("")
  lines.push("## Notes")
  lines.push("")
  lines.push("- `labforge-core` contains the plugin's existing opinionated bio skills as category-routed wrappers.")
  lines.push("- All detailed leaf skills are intentionally hidden from the global discovery list to keep prompt weight low.")
  lines.push("- Once you know the right leaf skill name, call it directly with the `skill` tool.")

  return lines.join("\n")
}

function buildCategorySkillBody(category: BioCategoryEntry): string {
  const lines = [
    `# ${toTitleCase(category.categoryName)} Category Guide`,
    "",
    category.summary,
    "",
    "Use this category guide only to choose the correct detailed leaf skill(s).",
    "",
    "## Available Leaf Skills",
    "",
  ]

  for (const leaf of category.leaves) {
    lines.push(
      `- \`research/bioinformatics/${category.categoryName}/${leaf.skillName}\` — ${leaf.description}`,
    )
  }

  lines.push("")
  lines.push("## Routing Rule")
  lines.push("")
  lines.push("- Choose the narrowest matching leaf skill.")
  lines.push("- If execution spans study design and implementation, combine one planning-oriented leaf with one execution-oriented leaf.")
  lines.push("- If you choose a `labforge-core` wrapper leaf, immediately invoke the underlying built-in skill it points to.")

  return lines.join("\n")
}

function buildBuiltinWrapperBody(entry: BioLeafEntry): string {
  return [
    `# Labforge Wrapper: ${entry.skillName}`,
    "",
    entry.description,
    "",
    "This is a category-routed wrapper for an existing OpenAgent Labforge built-in bio skill.",
    "",
    `After reviewing this wrapper, immediately invoke \`skill(name="${entry.builtinTarget}")\` to load the full built-in guidance.`,
    "",
    "Use this wrapper only when you entered through the bioinformatics category directory and need the exact built-in target.",
  ].join("\n")
}

async function readCategorySummary(categoryDir: string, fallbackCategoryName: string): Promise<string> {
  const readmePath = join(categoryDir, "README.md")
  if (!(await exists(readmePath))) {
    return `Category guide for ${toTitleCase(fallbackCategoryName)} skills.`
  }

  const content = await readFile(readmePath, "utf8")
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))

  return lines[0] ?? `Category guide for ${toTitleCase(fallbackCategoryName)} skills.`
}

async function collectGptomicsCategories(sourceRoot: string): Promise<BioCategoryEntry[]> {
  const entries = await readdir(sourceRoot, { withFileTypes: true }).catch(() => [])
  const categories: BioCategoryEntry[] = []
  const standaloneLeaves: BioLeafEntry[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const entryPath = join(sourceRoot, entry.name)
    const directSkillPath = join(entryPath, "SKILL.md")
    const categoryReadmePath = join(entryPath, "README.md")

    if (await exists(directSkillPath)) {
      const raw = await readFile(directSkillPath, "utf8")
      const parsed = parseFrontmatter<Record<string, unknown>>(raw)
      standaloneLeaves.push({
        skillName: entry.name,
        description:
          (typeof parsed.data.description === "string" && parsed.data.description.trim()) ||
          `Utility skill from GPTomics/bioSkills: ${toTitleCase(entry.name)}.`,
        categoryName: "utilities",
        source: "gptomics",
        sourcePath: entryPath,
      })
      continue
    }

    if (!(await exists(categoryReadmePath))) {
      continue
    }

    const summary = await readCategorySummary(entryPath, entry.name)
    const childEntries = await readdir(entryPath, { withFileTypes: true }).catch(() => [])
    const leaves: BioLeafEntry[] = []

    for (const child of childEntries) {
      if (!child.isDirectory()) continue
      const childPath = join(entryPath, child.name)
      const skillPath = join(childPath, "SKILL.md")
      if (!(await exists(skillPath))) continue

      const raw = await readFile(skillPath, "utf8")
      const parsed = parseFrontmatter<Record<string, unknown>>(raw)
      const description =
        (typeof parsed.data.description === "string" && parsed.data.description.trim()) ||
        `Detailed ${toTitleCase(entry.name)} skill: ${toTitleCase(child.name)}.`

      leaves.push({
        skillName: child.name,
        description,
        categoryName: entry.name,
        source: "gptomics",
        sourcePath: childPath,
      })
    }

    if (leaves.length > 0) {
      categories.push({
        categoryName: entry.name,
        summary,
        leaves: leaves.sort((a, b) => a.skillName.localeCompare(b.skillName)),
      })
    }
  }

  if (standaloneLeaves.length > 0) {
    categories.push({
      categoryName: "utilities",
      summary: "Utility and installer-adjacent skills from GPTomics/bioSkills.",
      leaves: standaloneLeaves.sort((a, b) => a.skillName.localeCompare(b.skillName)),
    })
  }

  return categories.sort((a, b) => a.categoryName.localeCompare(b.categoryName))
}

function buildBuiltinCategory(): BioCategoryEntry {
  return {
    categoryName: "labforge-core",
    summary:
      "OpenAgent Labforge's existing opinionated bio skills, exposed here as wrappers so they participate in the same category-first routing flow.",
    leaves: BUILTIN_BIO_WRAPPERS.map((spec) => ({
      skillName: spec.skillName,
      description: spec.description,
      categoryName: "labforge-core",
      source: "labforge-builtin",
      builtinTarget: spec.skillName,
    })).sort((a, b) => a.skillName.localeCompare(b.skillName)),
  }
}

async function writeSkillFile(args: {
  targetDir: string
  name: string
  description: string
  category: string
  discoveryHidden: boolean
  tier: "root" | "category" | "leaf"
  source: string
  body: string
  targetBuiltin?: string
  asNamedMarkdownFile?: boolean
}): Promise<void> {
  await mkdir(args.targetDir, { recursive: true })
  const content =
    buildFrontmatter({
      name: args.name,
      description: args.description,
      category: args.category,
      discoveryHidden: args.discoveryHidden,
      tier: args.tier,
      source: args.source,
      targetBuiltin: args.targetBuiltin,
    }) + args.body
  const outputPath = args.asNamedMarkdownFile
    ? join(args.targetDir, `${args.name}.md`)
    : join(args.targetDir, "SKILL.md")
  await writeFile(outputPath, content, "utf8")
}

async function rewriteCopiedSkillMetadata(args: {
  skillDir: string
  name: string
  category: string
  description: string
}): Promise<void> {
  const skillPath = join(args.skillDir, "SKILL.md")
  const raw = await readFile(skillPath, "utf8")
  const parsed = parseFrontmatter<Record<string, unknown>>(raw)
  const frontmatter = buildFrontmatter({
    name: args.name,
    description: args.description,
    category: args.category,
    discoveryHidden: true,
    tier: "leaf",
    source: "GPTomics/bioSkills",
  })
  const body = parsed.body.replace(/^\n+/, "")
  await writeFile(skillPath, `${frontmatter}${body}`, "utf8")
}

async function materializeBioBundle(workspaceRoot: string): Promise<void> {
  const sourceRoot = join(workspaceRoot, "Future", "bioSkills-main")
  const outputRoot = join(workspaceRoot, "generated", "skills-bundles", BIO_BUNDLE_NAME)
  const researchRoot = join(outputRoot, "skills", "research")
  const categoryRoot = join(researchRoot, BIO_ROOT_SKILL_NAME)

  if (!(await exists(sourceRoot)) && (await exists(outputRoot))) {
    console.warn("[bio-skills-catalog] bioSkills source missing; keeping existing generated bio bundle unchanged")
    return
  }

  const categories = (await exists(sourceRoot))
    ? await collectGptomicsCategories(sourceRoot)
    : []
  categories.push(buildBuiltinCategory())

  await rm(outputRoot, { recursive: true, force: true })
  await mkdir(categoryRoot, { recursive: true })

  await writeSkillFile({
    targetDir: researchRoot,
    name: BIO_ROOT_SKILL_NAME,
    description: BIO_ROOT_DESCRIPTION,
    category: "research/bioinformatics",
    discoveryHidden: false,
    tier: "root",
    source: "OpenAgent Labforge",
    body: buildRootSkillBody(categories),
    asNamedMarkdownFile: true,
  })

  for (const category of categories) {
    const categoryDir = join(categoryRoot, category.categoryName)

    await writeSkillFile({
      targetDir: categoryRoot,
      name: category.categoryName,
      description: category.summary,
      category: "research/bioinformatics",
      discoveryHidden: true,
      tier: "category",
      source: category.categoryName === "labforge-core" ? "OpenAgent Labforge" : "GPTomics/bioSkills",
      body: buildCategorySkillBody(category),
      asNamedMarkdownFile: true,
    })

    for (const leaf of category.leaves) {
      const leafDir = join(categoryDir, leaf.skillName)

      if (leaf.source === "gptomics" && leaf.sourcePath) {
        await cp(leaf.sourcePath, leafDir, { recursive: true })
        await rewriteCopiedSkillMetadata({
          skillDir: leafDir,
          name: leaf.skillName,
          category: `research/bioinformatics/${category.categoryName}`,
          description: leaf.description,
        })
        continue
      }

      await writeSkillFile({
        targetDir: leafDir,
        name: leaf.skillName,
        description: leaf.description,
        category: `research/bioinformatics/${category.categoryName}`,
        discoveryHidden: true,
        tier: "leaf",
        source: "OpenAgent Labforge",
        targetBuiltin: leaf.builtinTarget,
        body: buildBuiltinWrapperBody(leaf),
      })
    }
  }

  const indexLines = [
    `# Bio Skills Bundle (${BIO_BUNDLE_NAME})`,
    "",
    `Categories: ${categories.length}`,
    `Leaf skills: ${categories.reduce((sum, category) => sum + category.leaves.length, 0)}`,
    "",
    ...categories.map(
      (category) =>
        `- \`research/bioinformatics/${category.categoryName}\` — ${category.leaves.length} leaf skills`,
    ),
    "",
  ]

  await writeFile(join(outputRoot, "INDEX.md"), indexLines.join("\n"), "utf8")
}

async function main(): Promise<void> {
  const workspaceRoot = resolve(fileURLToPath(new URL("..", import.meta.url)))
  await materializeBioBundle(workspaceRoot)
  console.log("[bio-skills-catalog] generated bio bundle at generated/skills-bundles/bio")
}

main().catch((error) => {
  console.error("build-bio-skills-catalog failed")
  console.error(error)
  process.exitCode = 1
})
