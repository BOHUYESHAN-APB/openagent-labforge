import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { log } from "../../shared/logger"

/**
 * ctx_memory tool - Manage cross-session project memories
 *
 * Note: This is a placeholder for Phase 5 implementation.
 */
export function createCtxMemoryTool(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
): ToolDefinition | null {
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false
  const memoriesEnabled = pluginConfig.experimental?.magic_context?.cross_session_memories ?? true

  if (!magicContextEnabled || !memoriesEnabled) {
    return null
  }

  return tool({
    description: "Manage cross-session project memories. Store and retrieve knowledge that persists across sessions.",
    args: {
      action: tool.schema.enum(["write", "list", "update", "delete"]).describe("Action to perform on memories"),
      category: tool.schema.string().optional().describe("Memory category"),
      content: tool.schema.string().optional().describe("Memory content"),
      id: tool.schema.number().optional().describe("Memory ID"),
    },
    execute: async (args, context) => {
      const sessionId = context.sessionID
      log("[ctx_memory] Called (Phase 5 placeholder)", {
        sessionId,
        action: args.action,
      })

      return "ctx_memory tool is a Phase 5 feature. Full implementation with cross-session memory storage and semantic search will be available after Phase 4 (Async Background Compression) is complete.\n\nPlanned features:\n- Write memories with categories\n- List and search memories\n- Update existing memories\n- Delete obsolete memories\n- Semantic search via embeddings\n- Project-scoped persistence"
    },
  })
}
