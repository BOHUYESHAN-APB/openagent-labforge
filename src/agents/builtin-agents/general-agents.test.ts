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

  test("includes article-writer in availableAgents when metadata and model requirement are present", () => {
    //#given
    const source = createSubagentFactory("article-writer")

    //#when
    const result = collectPendingBuiltinAgents({
      agentSources: {
        "article-writer": source,
      } as any,
      agentMetadata: {
        "article-writer": {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "External writing", trigger: "Polished public prose" }],
        },
      } as any,
      disabledAgents: [],
      agentOverrides: {},
      mergedCategories: {},
      availableModels: new Set(["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"]),
    })

    //#then
    expect(result.pendingAgentConfigs.get("article-writer")?.description).toBe("article-writer agent")
    expect(result.availableAgents).toEqual([
      {
        name: "article-writer",
        description: "article-writer agent",
        metadata: {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "External writing", trigger: "Polished public prose" }],
        },
      },
    ])
  })

  test("includes scientific-writer in availableAgents when metadata and model requirement are present", () => {
    //#given
    const source = createSubagentFactory("scientific-writer")

    //#when
    const result = collectPendingBuiltinAgents({
      agentSources: {
        "scientific-writer": source,
      } as any,
      agentMetadata: {
        "scientific-writer": {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "Scientific and technical writing", trigger: "Research-style technical prose" }],
        },
      } as any,
      disabledAgents: [],
      agentOverrides: {},
      mergedCategories: {},
      availableModels: new Set(["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"]),
    })

    //#then
    expect(result.pendingAgentConfigs.get("scientific-writer")?.description).toBe("scientific-writer agent")
    expect(result.availableAgents).toEqual([
      {
        name: "scientific-writer",
        description: "scientific-writer agent",
        metadata: {
          category: "specialist",
          cost: "CHEAP",
          triggers: [{ domain: "Scientific and technical writing", trigger: "Research-style technical prose" }],
        },
      },
    ])
  })
})
