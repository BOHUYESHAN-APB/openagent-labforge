import { describe, expect, test } from "bun:test"

import { normalizeSkillsConfig } from "./skills-config-normalizer"

describe("normalizeSkillsConfig", () => {
  test("defaults to bio bundle when skills config is missing", () => {
    const normalized = normalizeSkillsConfig(undefined)
    expect(normalized.bundle).toBe("bio")
  })

  test("defaults to bio bundle for empty object config", () => {
    const normalized = normalizeSkillsConfig({})
    expect(normalized.bundle).toBe("bio")
  })

  test("preserves explicit bundle selection", () => {
    const normalized = normalizeSkillsConfig({ bundle: "paper" })
    expect(normalized.bundle).toBe("paper")
  })
})
