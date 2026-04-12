import { describe, expect, test } from "bun:test"

import { filterDiscoveryVisibleSkills, isSkillHiddenFromDiscovery } from "./discovery-visibility"

describe("discovery visibility", () => {
  test("hides skills with discovery_hidden metadata", () => {
    const hidden = {
      metadata: {
        discovery_hidden: "true",
      },
    }

    expect(isSkillHiddenFromDiscovery(hidden as never)).toBe(true)
  })

  test("keeps visible skills when discovery_hidden is absent", () => {
    const skills = [
      { metadata: { discovery_hidden: "true" } },
      { metadata: { catalog_tier: "root" } },
      { metadata: undefined },
    ]

    const visible = filterDiscoveryVisibleSkills(skills as never)
    expect(visible).toHaveLength(2)
  })
})
