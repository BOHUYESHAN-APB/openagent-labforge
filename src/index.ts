/**
 * OpenAgent LabForge - OpenCode Plugin
 *
 * Lightweight OpenCode plugin with bioinformatics support.
 * Based on opencode-workspace (KDCO) infrastructure.
 *
 * License: Apache-2.0 (new code), MIT (KDCO-derived code)
 */

import type { Plugin } from "@opencode-ai/plugin"
import { createBuiltinMcps } from "./mcp"
import { createBuiltinAgents } from "./agents"
import { createBuiltinSkills } from "./skills"
import { createHooks } from "./hooks"

export const OpenAgentLabforgePlugin: Plugin = async (ctx) => {
  const { project, client, $, directory, worktree, experimental_workspace, serverUrl } = ctx

  // Create MCP servers
  const mcps = createBuiltinMcps()

  // Create agents
  const agents = await createBuiltinAgents(directory)

  // Create skills
  const skills = createBuiltinSkills()

  // Create hooks
  const hooks = createHooks({ ctx: { project, client, $, directory, worktree, experimental_workspace, serverUrl } })

  return {
    // Custom tools
    tool: {},

    // Agent configurations
    agent: agents,

    // MCP servers
    mcp: mcps,

    // Skills
    skill: skills,

    // Event handlers
    event: async ({ event }) => {
      // Keyword detector cleanup
      await hooks.keywordDetector?.event?.({ event })

      // Session recovery
      if (event.type === "session.error") {
        const props = event.properties as any
        if (props?.error && hooks.sessionRecovery) {
          await hooks.sessionRecovery.handleSessionRecovery({
            sessionID: props.sessionID,
            error: props.error,
            role: "assistant",
          })
        }
      }

      // Todo continuation enforcer
      if (hooks.todoContinuationEnforcer) {
        await hooks.todoContinuationEnforcer.handler({ event })
      }
    },

    // Tool hooks
    "tool.execute.before": async (_input, _output) => {
      // Reserved for future tool guards
    },

    "tool.execute.after": async (_input, _output) => {
      // Reserved for future tool hooks
    },

    // Message hooks
    "chat.message": async (input, output) => {
      // Keyword detector
      await hooks.keywordDetector?.["chat.message"]?.(input, output)

      // Start work command
      await hooks.startWork?.["chat.message"]?.(input, output)
    },

    // Compaction hook
    "experimental.session.compacting": async (_input, _output) => {
      // Preserve todos through compaction
      // TODO: Implement todo preservation
    },

    // Shell environment
    "shell.env": async (_input, output) => {
      // Inject non-interactive env vars for all shell commands
      output.env.GIT_EDITOR = ":"
      output.env.EDITOR = ":"
      output.env.VISUAL = ""
      output.env.GIT_TERMINAL_PROMPT = "0"
      output.env.GCM_INTERACTIVE = "never"
    },
  }
}

export default OpenAgentLabforgePlugin
