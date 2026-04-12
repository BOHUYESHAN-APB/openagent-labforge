import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { SkillsConfigSchema } from "../../config/schema/skills"
import { discoverConfigSourceSkills, normalizePathForGlob } from "./config-source-discovery"

const TEST_DIR = join(tmpdir(), `config-source-discovery-test-${Date.now()}`)

function writeSkill(path: string, name: string, description: string): void {
  mkdirSync(path, { recursive: true })
  writeFileSync(
    join(path, "SKILL.md"),
    `---\nname: ${name}\ndescription: ${description}\n---\nBody\n`,
  )
}

describe("config source discovery", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it("loads skills from local sources path", async () => {
    // given
    const configDir = join(TEST_DIR, "config")
    const sourceDir = join(configDir, "custom-skills")
    writeSkill(join(sourceDir, "local-skill"), "local-skill", "Loaded from local source")
    const config = SkillsConfigSchema.parse({
      sources: [{ path: "./custom-skills", recursive: true }],
    })

    // when
    const skills = await discoverConfigSourceSkills({
      config,
      configDir,
    })

    // then
    const localSkill = skills.find((skill) => skill.name === "local-skill")
    expect(localSkill).toBeDefined()
    expect(localSkill?.scope).toBe("config")
    expect(localSkill?.definition.description).toContain("Loaded from local source")
  })

  it("filters discovered skills using source glob", async () => {
    // given
    const configDir = join(TEST_DIR, "config")
    const sourceDir = join(configDir, "custom-skills")

    writeSkill(join(sourceDir, "keep", "kept"), "kept", "Should be kept")
    writeSkill(join(sourceDir, "skip", "skipped"), "skipped", "Should be skipped")
    const config = SkillsConfigSchema.parse({
      sources: [{ path: "./custom-skills", recursive: true, glob: "keep/**" }],
    })

    // when
    const skills = await discoverConfigSourceSkills({
      config,
      configDir,
    })

    // then
    const names = skills.map((skill) => skill.name)
    expect(names).toContain("keep/kept")
    expect(names).not.toContain("skip/skipped")
  })

  it("loads full bundle together with bio bundle when bundle is full", async () => {
    // given
    const configDir = join(TEST_DIR, "config")
    const fullDir = join(configDir, "generated", "skills-bundles", "full", "skills", "engineering", "external-skill")
    const bioDir = join(configDir, "generated", "skills-bundles", "bio", "skills", "research")

    writeSkill(fullDir, "external-skill", "Loaded from full bundle")
    mkdirSync(bioDir, { recursive: true })
    writeFileSync(
      join(bioDir, "bioinformatics.md"),
      `---\nname: bioinformatics\ndescription: Root bio skill\nmetadata:\n  category: research/bioinformatics\n  discovery_hidden: "false"\n---\nBody\n`,
    )

    const config = SkillsConfigSchema.parse({
      bundle: "full",
    })

    // when
    const skills = await discoverConfigSourceSkills({
      config,
      configDir,
    })

    // then
    const names = skills.map((skill) => skill.name)
    expect(names).toContain("engineering/external-skill")
    expect(names).toContain("research/bioinformatics")
  })

  it("normalizes windows separators before glob matching", () => {
    // given
    const windowsPath = "keep\\nested\\SKILL.md"

    // when
    const normalized = normalizePathForGlob(windowsPath)

    // then
    expect(normalized).toBe("keep/nested/SKILL.md")
  })
})
