import { describe, expect, test } from "bun:test"

import { maybeCreateHephaestusConfig } from "./hephaestus-agent"

describe("maybeCreateHephaestusConfig", () => {
  test("should respect uiSelectedModel when no explicit hephaestus model override", () => {
    //#given
    const uiSelectedModel = "gmn/gpt-5.3-codex"

    //#when
    const config = maybeCreateHephaestusConfig({
      disabledAgents: [],
      agentOverrides: {},
      uiSelectedModel,
      availableModels: new Set(["openai/gpt-5.3-codex", "gmn/gpt-5.3-codex"]),
      systemDefaultModel: "openai/gpt-5.4",
      isFirstRunNoCache: false,
      availableAgents: [],
      availableSkills: [],
      availableCategories: [],
      mergedCategories: {},
      directory: ".",
      useTaskSystem: false,
      disableOmoEnv: true,
    })

    //#then
    expect(config).toBeDefined()
    expect(config?.model).toBe(uiSelectedModel)
  })
})
