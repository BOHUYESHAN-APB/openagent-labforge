import { describe, it, expect } from "bun:test"
import { applyToolConfig } from "./tool-config-handler"
import type { OhMyOpenCodeConfig } from "../config"

function createParams(overrides: {
  taskSystem?: boolean
  agents?: string[]
}) {
  const agentResult: Record<string, { permission?: Record<string, unknown> }> = {}
  for (const agent of overrides.agents ?? []) {
    agentResult[agent] = { permission: {} }
  }

  return {
    config: { tools: {}, permission: {} } as Record<string, unknown>,
    pluginConfig: {
      experimental: { task_system: overrides.taskSystem ?? false },
    } as OhMyOpenCodeConfig,
    agentResult: agentResult as Record<string, unknown>,
  }
}

describe("applyToolConfig", () => {
  describe("#given task_system is enabled", () => {
    describe("#when applying tool config", () => {
      it("#then should deny todowrite and todoread globally", () => {
        const params = createParams({ taskSystem: true })

        applyToolConfig(params)

        const tools = params.config.tools as Record<string, unknown>
        expect(tools.todowrite).toBe(false)
        expect(tools.todoread).toBe(false)
      })

      it.each([
        "atlas",
        "sisyphus",
        "hephaestus",
        "prometheus",
        "sisyphus-junior",
      ])("#then should deny todo tools for %s agent", (agentName) => {
        const params = createParams({
          taskSystem: true,
          agents: [agentName],
        })

        applyToolConfig(params)

        const agent = params.agentResult[agentName] as {
          permission: Record<string, unknown>
        }
        expect(agent.permission.todowrite).toBe("deny")
        expect(agent.permission.todoread).toBe("deny")
      })
    })
  })

  describe("#given task_system is disabled", () => {
    describe("#when applying tool config", () => {
      it.each([
        "atlas",
        "sisyphus",
        "hephaestus",
        "prometheus",
        "sisyphus-junior",
      ])("#then should NOT deny todo tools for %s agent", (agentName) => {
        const params = createParams({
          taskSystem: false,
          agents: [agentName],
        })

        applyToolConfig(params)

        const agent = params.agentResult[agentName] as {
          permission: Record<string, unknown>
        }
        expect(agent.permission.todowrite).toBeUndefined()
        expect(agent.permission.todoread).toBeUndefined()
      })

      it("#then should grant research tools to github-scout", () => {
        const params = createParams({
          taskSystem: false,
          agents: ["github-scout"],
        })

        applyToolConfig(params)

        const agent = params.agentResult["github-scout"] as {
          permission: Record<string, unknown>
        }
        expect(agent.permission["grep_app_*"]).toBe("allow")
        expect(agent.permission.websearch_web_search_exa).toBe("allow")
      })

      it("#then should grant research and paper tools to tech-scout", () => {
        const params = createParams({
          taskSystem: false,
          agents: ["tech-scout"],
        })

        applyToolConfig(params)

        const agent = params.agentResult["tech-scout"] as {
          permission: Record<string, unknown>
        }
        expect(agent.permission["grep_app_*"]).toBe("allow")
        expect(agent.permission.websearch_web_search_exa).toBe("allow")
        expect(agent.permission["context7_resolve-library-id"]).toBe("allow")
        expect(agent.permission.paper_search_mcp_search_arxiv).toBe("allow")
      })
    })
  })
})
