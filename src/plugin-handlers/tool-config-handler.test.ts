import { describe, it, expect, beforeEach, afterEach } from "bun:test"
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
  let originalConfigContent: string | undefined
  let originalCliRunMode: string | undefined

  beforeEach(() => {
    originalConfigContent = process.env.OPENCODE_CONFIG_CONTENT
    originalCliRunMode = process.env.OPENCODE_CLI_RUN_MODE
  })

  afterEach(() => {
    if (originalConfigContent === undefined) {
      delete process.env.OPENCODE_CONFIG_CONTENT
    } else {
      process.env.OPENCODE_CONFIG_CONTENT = originalConfigContent
    }

    if (originalCliRunMode === undefined) {
      delete process.env.OPENCODE_CLI_RUN_MODE
    } else {
      process.env.OPENCODE_CLI_RUN_MODE = originalCliRunMode
    }
  })

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
    })
  })

  describe("#given question permission config", () => {
    it("#then should allow questions by default", () => {
      delete process.env.OPENCODE_CONFIG_CONTENT
      delete process.env.OPENCODE_CLI_RUN_MODE

      const params = createParams({ taskSystem: false, agents: ["sisyphus"] })
      applyToolConfig(params)

      const agent = params.agentResult.sisyphus as { permission: Record<string, unknown> }
      expect(agent.permission.question).toBe("allow")
    })

    it("#then should deny questions when CLI run mode is enabled", () => {
      delete process.env.OPENCODE_CONFIG_CONTENT
      process.env.OPENCODE_CLI_RUN_MODE = "true"

      const params = createParams({ taskSystem: false, agents: ["sisyphus"] })
      applyToolConfig(params)

      const agent = params.agentResult.sisyphus as { permission: Record<string, unknown> }
      expect(agent.permission.question).toBe("deny")
    })

    it("#then should deny questions when config sets deny", () => {
      process.env.OPENCODE_CONFIG_CONTENT = JSON.stringify({ permission: { question: "deny" } })
      process.env.OPENCODE_CLI_RUN_MODE = "false"

      const params = createParams({ taskSystem: false, agents: ["sisyphus"] })
      applyToolConfig(params)

      const agent = params.agentResult.sisyphus as { permission: Record<string, unknown> }
      expect(agent.permission.question).toBe("deny")
    })
  })
})
