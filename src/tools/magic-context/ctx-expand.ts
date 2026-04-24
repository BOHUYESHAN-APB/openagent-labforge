import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { getSessionTags } from "../../features/magic-context/storage/tags-storage"
import { log } from "../../shared/logger"

/**
 * ctx_expand tool - Retrieve raw message history
 */
export function createCtxExpandTool(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
): ToolDefinition | null {
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false

  if (!magicContextEnabled) {
    return null
  }

  return tool({
    description: "Retrieve raw message history. Optionally specify tag ranges to expand specific messages.",
    args: {
      tags: tool.schema.string().optional().describe("Optional tag ranges: '3-5,12' or '1,2,9'. If omitted, shows all active tags."),
    },
    execute: async (args, context) => {
      const sessionId = context.sessionID
      try {
        const tags = getSessionTags(ctx.directory, sessionId)
        const activeTags = tags.filter(t => t.status === "active")

        if (activeTags.length === 0) {
          return "No active tags found in this session."
        }

        activeTags.sort((a, b) => a.tagNumber - b.tagNumber)

        const lines = [
          "## Active Message Tags",
          "",
          `Total: ${activeTags.length} messages`,
          "",
        ]

        for (const tag of activeTags) {
          lines.push(
            `- §${tag.tagNumber}§ [${tag.type}] ${(tag.byteSize / 1024).toFixed(1)}KB (${new Date(tag.createdAt).toLocaleString()})`,
          )
        }

        log("[ctx_expand] Retrieved tags", {
          sessionId,
          count: activeTags.length,
        })

        return lines.join("\n")
      } catch (error) {
        log("[ctx_expand] Error", {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        })
        return `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}
