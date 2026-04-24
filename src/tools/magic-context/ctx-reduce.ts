import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import {
  queuePendingOp,
  generateOpId,
} from "../../features/magic-context/storage/pending-ops-storage"
import { getProtectedTags, updateTagStatus } from "../../features/magic-context/storage/tags-storage"
import { parseTagRange } from "../../features/magic-context/tagger"
import { log } from "../../shared/logger"

/**
 * ctx_reduce tool - Mark tags for removal to reduce context size
 */
export function createCtxReduceTool(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
): ToolDefinition | null {
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false

  if (!magicContextEnabled) {
    return null
  }

  return tool({
    description: "Mark message tags for removal to reduce context size. Protected tags (last 20) are queued for later removal.",
    args: {
      drop: tool.schema.string().describe("Tag ranges to drop: '3-5,12' or '1,2,9'. Use tag numbers from message prefixes (§N§)."),
    },
    execute: async (args, context) => {
      const sessionId = context.sessionID
      try {
        const tagIds = parseTagRange(args.drop as string)
        if (tagIds.length === 0) {
          return "No valid tag numbers provided."
        }

        const protectedTags = getProtectedTags(ctx.directory, sessionId, 20)
        const protectedSet = new Set(protectedTags)

        let queuedCount = 0
        let droppedCount = 0

        for (const tagId of tagIds) {
          if (protectedSet.has(tagId)) {
            queuePendingOp(ctx.directory, {
              id: generateOpId(),
              sessionId,
              type: "drop",
              tagIds: [tagId],
              timestamp: Date.now(),
              reason: "protected tag - deferred",
            })
            queuedCount++
          } else {
            updateTagStatus(ctx.directory, sessionId, tagId, "dropped")
            droppedCount++
          }
        }

        log("[ctx_reduce] Tags marked for removal", {
          sessionId,
          totalTags: tagIds.length,
          droppedCount,
          queuedCount,
        })

        return `Marked ${tagIds.length} tags for removal:\n- ${droppedCount} dropped immediately\n- ${queuedCount} queued (protected tags)\n\nProtected tags will be removed after they age out of the last 20 messages.`
      } catch (error) {
        log("[ctx_reduce] Error", {
          sessionId,
          error: error instanceof Error ? error.message : String(error),
        })
        return `Error: ${error instanceof Error ? error.message : String(error)}`
      }
    },
  })
}
