#!/usr/bin/env bun
/**
 * Regenerate bio skills bundle from the new bioSkills repository
 * This will replace the old hidden skills with visible ones
 */

import { join } from "path"
import { readdir, readFile, writeFile, mkdir, rm } from "fs/promises"
import { existsSync } from "fs"

const SCRIPT_DIR = process.cwd()
const PROJECT_ROOT = join(SCRIPT_DIR, "..")
const SOURCE_DIR = join(PROJECT_ROOT, "Future", "clone", "bioSkills")
const TARGET_DIR = join(PROJECT_ROOT, "generated", "skills-bundles", "bio-new", "skills")
const INDEX_FILE = join(PROJECT_ROOT, "generated", "skills-bundles", "bio-new", "INDEX.md")

interface SkillInfo {
  name: string
  category: string
  path: string
}

async function findAllSkills(dir: string, category: string = ""): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = []

  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue
      }

      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        // Check if this directory contains a SKILL.md
        const skillPath = join(fullPath, "SKILL.md")
        if (existsSync(skillPath)) {
          const relativePath = fullPath.replace(SOURCE_DIR, "").replace(/^[\\\/]/, "")
          skills.push({
            name: entry.name,
            category: category || entry.name,
            path: relativePath,
          })
        }

        // Recursively search subdirectories
        const subCategory = category ? `${category}/${entry.name}` : entry.name
        const subSkills = await findAllSkills(fullPath, subCategory)
        skills.push(...subSkills)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return skills
}

async function copySkill(skillInfo: SkillInfo): Promise<void> {
  const sourcePath = join(SOURCE_DIR, skillInfo.path)
  const targetPath = join(TARGET_DIR, skillInfo.category, skillInfo.name)

  // Create target directory
  await mkdir(targetPath, { recursive: true })

  // Copy SKILL.md and set name to match directory name
  let skillMd = await readFile(join(sourcePath, "SKILL.md"), "utf-8")

  // Replace the name field with the directory name (skillInfo.name)
  // This ensures the skill name always matches the filesystem structure
  skillMd = skillMd.replace(/^name: .+$/m, `name: ${skillInfo.name}`)

  await writeFile(join(targetPath, "SKILL.md"), skillMd)

  // Copy examples if they exist
  const examplesDir = join(sourcePath, "examples")
  if (existsSync(examplesDir)) {
    const examplesTarget = join(targetPath, "examples")
    await mkdir(examplesTarget, { recursive: true })

    const examples = await readdir(examplesDir)
    for (const example of examples) {
      const content = await readFile(join(examplesDir, example), "utf-8")
      await writeFile(join(examplesTarget, example), content)
    }
  }

  // Copy usage-guide.md if it exists
  const usageGuide = join(sourcePath, "usage-guide.md")
  if (existsSync(usageGuide)) {
    const content = await readFile(usageGuide, "utf-8")
    await writeFile(join(targetPath, "usage-guide.md"), content)
  }
}

async function generateIndex(skills: SkillInfo[]): Promise<void> {
  const categories = new Map<string, SkillInfo[]>()

  // Group by category
  for (const skill of skills) {
    const category = skill.category.split("/")[0]
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category)!.push(skill)
  }

  // Generate index
  const lines: string[] = [
    "# Bio Skills Bundle (bio-new)",
    "",
    `Categories: ${categories.size}`,
    `Total skills: ${skills.length}`,
    "",
  ]

  // Sort categories
  const sortedCategories = Array.from(categories.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  for (const [category, categorySkills] of sortedCategories) {
    lines.push(`## ${category} (${categorySkills.length} skills)`)
    lines.push("")

    for (const skill of categorySkills.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`- \`${skill.name}\` — ${skill.path}`)
    }

    lines.push("")
  }

  await writeFile(INDEX_FILE, lines.join("\n"))
}

async function main() {
  console.log("🔍 Scanning bioSkills repository...")
  const skills = await findAllSkills(SOURCE_DIR)

  console.log(`✓ Found ${skills.length} skills in ${new Set(skills.map(s => s.category.split("/")[0])).size} categories`)

  // Clean target directory
  if (existsSync(TARGET_DIR)) {
    console.log("🧹 Cleaning old bio-new bundle...")
    await rm(TARGET_DIR, { recursive: true, force: true })
  }

  // Create target directory
  await mkdir(TARGET_DIR, { recursive: true })

  // Copy all skills
  console.log("📦 Copying skills...")
  let copied = 0
  for (const skill of skills) {
    await copySkill(skill)
    copied++
    if (copied % 50 === 0) {
      console.log(`  Copied ${copied}/${skills.length} skills...`)
    }
  }

  console.log(`✓ Copied ${skills.length} skills`)

  // Generate index
  console.log("📝 Generating index...")
  await generateIndex(skills)

  console.log(`✓ Generated INDEX.md`)
  console.log("")
  console.log("✨ Done! Bio skills bundle regenerated at:")
  console.log(`   ${TARGET_DIR}`)
  console.log("")
  console.log("Next steps:")
  console.log("1. Review the generated skills")
  console.log("2. Replace old bio bundle: mv generated/skills-bundles/bio generated/skills-bundles/bio-old")
  console.log("3. Rename new bundle: mv generated/skills-bundles/bio-new generated/skills-bundles/bio")
  console.log("4. Test: bun run scripts/test-bio-skills-loading.ts")
}

main().catch(console.error)
