import { describe, expect, test } from "bun:test"

import { resolveCategoryConfig } from "./categories"

describe("resolveCategoryConfig", () => {
  test("should prioritize inherited model over category default", () => {
    //#given
    const inheritedModel = "gmn/gpt-5.3-codex"

    //#when
    const resolved = resolveCategoryConfig("deep", {
      inheritedModel,
      systemDefaultModel: "openai/gpt-5.4",
      userCategories: {},
    })

    //#then
    expect(resolved).not.toBeNull()
    expect(resolved?.model).toBe(inheritedModel)
  })

  test("should keep explicit user category model as highest priority", () => {
    //#given
    const userModel = "openai/gpt-5.4"

    //#when
    const resolved = resolveCategoryConfig("deep", {
      inheritedModel: "gmn/gpt-5.3-codex",
      systemDefaultModel: "anthropic/claude-sonnet-4-6",
      userCategories: {
        deep: {
          model: userModel,
        },
      },
    })

    //#then
    expect(resolved).not.toBeNull()
    expect(resolved?.model).toBe(userModel)
  })
})
