declare const require: (name: string) => any
const { describe, test, expect } = require("bun:test")

import { resolveInheritedParentModel } from "./parent-context-resolver"

describe("resolveInheritedParentModel", () => {
  test("prefers locked session model over stale previous message model", async () => {
    //#given
    //#when
    const result = resolveInheritedParentModel({
      lockedSessionModel: { providerID: "gmn", modelID: "gpt-5.3-codex" },
      currentSessionModel: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      prevMessageModel: { providerID: "openai", modelID: "gpt-5.4" },
      autoModelRoutingEnabled: false,
    })

    //#then
    expect(result).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("returns no inherited model when session is in auto routing mode", () => {
    //#given
    //#when
    const result = resolveInheritedParentModel({
      lockedSessionModel: { providerID: "gmn", modelID: "gpt-5.3-codex" },
      currentSessionModel: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      prevMessageModel: { providerID: "openai", modelID: "gpt-5.4" },
      autoModelRoutingEnabled: true,
    })

    //#then
    expect(result).toBeUndefined()
  })

  test("falls back to previous message model when session state is unavailable", () => {
    //#given
    //#when
    const result = resolveInheritedParentModel({
      prevMessageModel: { providerID: "openai", modelID: "gpt-5.4" },
      autoModelRoutingEnabled: false,
    })

    //#then
    expect(result).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
  })
})
