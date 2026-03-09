import { describe, expect, test } from "bun:test"

import { collectPendingBuiltinAgents } from "./general-agents"
import type { AgentFactory } from "../types"

const createSubagentFactory = (name: string): AgentFactory => {
  const fn = ((model: string) => ({
    description: `${name} agent`,
    model,
  })) as AgentFactory
  fn.mode = "subagent"
  return fn
}

describe("collectPendingBuiltinAgents", () => {
  test("respects uiSelectedModel for subagents when override is not set", () => {
    //#given
    const source = createSubagentFactory("oracle")

    //#when
    const result = collectPendingBuiltinAgents({
      agentSources: {
        oracle: source,
      } as any,
      agentMetadata: {},
      disabledAgents: [],
      agentOverrides: {},
      mergedCategories: {},
      uiSelectedModel: "gmn/gpt-5.3-codex",
      availableModels: new Set(["gmn/gpt-5.3-codex", "openai/gpt-5.4"]),
    })

    //#then
    expect(result.pendingAgentConfigs.get("oracle")?.model).toBe("gmn/gpt-5.3-codex")
  })
})
