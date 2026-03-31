import { describe, expect, test } from "bun:test"

import { enforceStrictUserModelPriorityOnAgents } from "./agent-config-handler"

describe("enforceStrictUserModelPriorityOnAgents", () => {
  test("keeps model but removes fallback_models from all agent definitions", () => {
    //#given
    const agents = {
      build: {
        description: "Build agent",
      },
      sisyphus: {
        model: "gmn/gpt-5.3-codex",
        fallback_models: ["openai/gpt-5.4"],
        temperature: 0.1,
      },
      oracle: {
        model: "openai/gpt-5.4",
        prompt: "Analyze deeply",
      },
    }

    //#when
    const result = enforceStrictUserModelPriorityOnAgents(agents)

    //#then
    expect((result.sisyphus as Record<string, unknown>).model).toBe("gmn/gpt-5.3-codex")
    expect((result.sisyphus as Record<string, unknown>).fallback_models).toBeUndefined()
    expect((result.sisyphus as Record<string, unknown>).temperature).toBe(0.1)
    expect((result.oracle as Record<string, unknown>).model).toBe("openai/gpt-5.4")
    expect((result.oracle as Record<string, unknown>).prompt).toBe("Analyze deeply")
    expect((result.build as Record<string, unknown>).description).toBe("Build agent")
  })
})
