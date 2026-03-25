import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { resetConfigContext } from "./config-context"
import { getBootstrapSkillPath, writeBootstrapSkill } from "./write-bootstrap-skill"

describe("writeBootstrapSkill", () => {
  let testConfigDir = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omo-bootstrap-skill-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = testConfigDir
    resetConfigContext()
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
    resetConfigContext()
    delete process.env.OPENCODE_CONFIG_DIR
  })

  it("creates the managed bootstrap skill on first install", () => {
    const result = writeBootstrapSkill()

    expect(result.success).toBe(true)
    expect(result.action).toBe("created")
    expect(existsSync(getBootstrapSkillPath())).toBe(true)
    expect(readFileSync(getBootstrapSkillPath(), "utf-8")).toContain("name: openagent-labforge")
  })

  it("keeps a user-managed bootstrap skill file untouched", () => {
    const skillPath = getBootstrapSkillPath()
    mkdirSync(join(testConfigDir, "skills", "openagent-labforge"), { recursive: true })
    writeFileSync(skillPath, "---\nname: openagent-labforge\ndescription: user custom skill\n---\nCustom body\n")

    const result = writeBootstrapSkill()

    expect(result.success).toBe(true)
    expect(result.action).toBe("kept")
    expect(readFileSync(skillPath, "utf-8")).toContain("user custom skill")
  })
})
