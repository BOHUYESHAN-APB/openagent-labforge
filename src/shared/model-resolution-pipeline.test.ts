import { describe, expect, test } from "bun:test"
import { resolveModelPipeline } from "./model-resolution-pipeline"

describe("resolveModelPipeline", () => {
  test("does not return unused explicit user config metadata in override result", () => {
    // given
    const result = resolveModelPipeline({
      intent: {
        userModel: "openai/gpt-5.3-codex",
      },
      constraints: {
        availableModels: new Set<string>(),
      },
    })

    // when
    const hasExplicitUserConfigField = result
      ? Object.prototype.hasOwnProperty.call(result, "explicitUserConfig")
      : false

    // then
    expect(result).toEqual({ model: "openai/gpt-5.3-codex", provenance: "override" })
    expect(hasExplicitUserConfigField).toBe(false)
  })

  test("treats auto sentinel as non-explicit override", () => {
    // given
    const result = resolveModelPipeline({
      intent: {
        userModel: "auto",
        categoryDefaultModel: "openai/gpt-5.4",
      },
      constraints: {
        availableModels: new Set<string>(["openai/gpt-5.4"]),
      },
    })

    // then
    expect(result).toEqual({
      model: "openai/gpt-5.4",
      provenance: "category-default",
      attempted: ["openai/gpt-5.4"],
    })
  })
})
