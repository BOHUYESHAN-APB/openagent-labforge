import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { log } from "../../shared/logger"
import {
  writeMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
  type MemoryCategory,
  type MemoryStatus,
} from "../../features/magic-context/storage/memory-storage"

/**
 * ctx_memory tool - Manage cross-session project memories
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
      action: tool.schema.enum(["write", "list", "update", "delete", "search"]).describe("Action to perform on memories"),
      category: tool.schema.string().optional().describe("Memory category: ARCHITECTURE_DECISIONS, CONSTRAINTS, PATTERNS, BUGS_FIXED, TECHNICAL_DEBT, USER_PREFERENCES, PROJECT_CONTEXT, OTHER"),
      content: tool.schema.string().optional().describe("Memory content"),
      id: tool.schema.number().optional().describe("Memory ID (for update/delete)"),
      query: tool.schema.string().optional().describe("Search query (for search action)"),
      status: tool.schema.string().optional().describe("Memory status: active, permanent, archived"),
    },
    execute: async (args, context) => {
      const sessionId = context.sessionID
      const action = args.action as string

      try {
        if (action === "write") {
          if (!args.content || !args.category) {
            return "Error: 'content' and 'category' are required for write action."
          }

          const memory = writeMemory(ctx.directory, sessionId, {
            category: args.category as MemoryCategory,
            content: args.content as string,
            status: args.status as MemoryStatus | undefined,
          })

          log("[ctx_memory] Memory written", {
            sessionId,
            memoryId: memory.id,
            category: memory.category,
          })

          return `Memory #${memory.id} written successfully.\nCategory: ${memory.category}\nContent: ${memory.content}`
        }

        if (action === "list") {
          const memories = listMemories(ctx.directory, {
            category: args.category as MemoryCategory | undefined,
            status: args.status as MemoryStatus | undefined,
          })

          if (memories.length === 0) {
            return "No memories found."
          }

          const lines = [
            `## Project Memories (${memories.length} total)`,
            "",
          ]

          for (const memory of memories) {
            lines.push(
              `### Memory #${memory.id} [${memory.category}]`,
              `Status: ${memory.status}`,
              `Content: ${memory.content}`,
              `Seen: ${memory.seenCount} times | Retrieved: ${memory.retrievalCount} times`,
              `Created: ${new Date(memory.createdAt).toLocaleString()}`,
              "",
            )
          }

          log("[ctx_memory] Memories listed", {
            sessionId,
            count: memories.length,
          })

          return lines.join("\n")
        }

        if (action === "update") {
          if (!args.id) {
            return "Error: 'id' is required for update action."
          }

          const memory = updateMemory(ctx.directory, args.id as number, {
            content: args.content as string | undefined,
            category: args.category as MemoryCategory | undefined,
            status: args.status as MemoryStatus | undefined,
          })

          if (!memory) {
            return `Error: Memory #${args.id} not found.`
          }

          log("[ctx_memory] Memory updated", {
            sessionId,
            memoryId: memory.id,
          })

          return `Memory #${memory.id} updated successfully.`
        }

        if (action === "delete") {
          if (!args.id) {
            return "Error: 'id' is required for delete action."
          }

          const deleted = deleteMemory(ctx.directory, args.id as number)

          if (!deleted) {
            return `Error: Memory #${args.id} not found.`
          }

          log("[ctx_memory] Memory deleted", {
            sessionId,
            memoryId: args.id,
          })

          return `Memory #${args.id} deleted successfully.`
        }

        if (action === "search") {
          if (!args.query) {
            return "Error: 'query' is required for search action."
          }

          const memories = searchMemories(ctx.directory, args.query as string, {
            category: args.category as MemoryCategory | undefined,
            status: args.status as MemoryStatus | undefined,
          })

          if (memories.length === 0) {
            return `No memories found matching query: "${args.query}"`
          }

          const lines = [
            `## Search Results (${memories.length} matches)`,
            `Query: "${args.query}"`,
            "",
          ]

          for (const memory of memories) {
            lines.push(
              `### Memory #${memory.id} [${memory.category}]`,
              `Content: ${memory.content}`,
              `Status: ${memory.status}`,
              "",
            )
          }

          log("[ctx_memory] Memory search", {
            sessionId,
            query: args.query,
            results: memories.length,
          })

          return lines.join("\n")
        }

        return `Error: Unknown action "${action}". Valid actions: write, list, update, delete, search`
      } catch (error) {
        log("[ctx_memory] Error", {
          sessionId,
          action,
          error: error instanceof Error ? error.message : String(error),
        })
        return `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}
