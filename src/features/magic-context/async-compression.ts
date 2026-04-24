import type { OhMyOpenCodeConfig } from "../../config"
import { log } from "../../shared/logger"
import { buildHistorianPrompt } from "../../agents/historian"
import { addCompartment } from "./storage/compartments-storage"
import { getSessionTags, updateTagStatus } from "./storage/tags-storage"

export interface CompressionRequest {
  sessionId: string
  startTag: number
  endTag: number
  reason: string
}

/**
 * Launch background compression via BackgroundManager.
 *
 * This function is called when async compression is enabled and compaction is triggered.
 * It launches a background agent (Historian) to compress the specified tag range.
 */
export async function launchBackgroundCompression(
  directory: string,
  pluginConfig: OhMyOpenCodeConfig,
  request: CompressionRequest,
): Promise<string> {
  const { sessionId, startTag, endTag, reason } = request

  // Get tags in range
  const tags = getSessionTags(directory, sessionId)
  const tagsInRange = tags.filter(
    t => t.tagNumber >= startTag && t.tagNumber <= endTag && t.status === "active",
  )

  if (tagsInRange.length === 0) {
    log("[historian] No active tags in range", { sessionId, startTag, endTag })
    return "no-tags"
  }

  // Build Historian prompt
  const historianPrompt = buildHistorianPrompt({
    sessionId,
    startTag,
    endTag,
    messageCount: tagsInRange.length,
  })

  log("[historian] Launching background compression", {
    sessionId,
    startTag,
    endTag,
    messageCount: tagsInRange.length,
    reason,
  })

  // TODO: Integrate with BackgroundManager
  // For now, this is a placeholder that will be implemented when BackgroundManager integration is ready
  // The actual implementation will:
  // 1. Launch a background agent with the Historian prompt
  // 2. Wait for the agent to complete
  // 3. Extract the compressed summary from the agent's response
  // 4. Store the summary as a compartment
  // 5. Mark the tags as "compacted"

  // Placeholder: Mark tags as compacted immediately
  for (const tag of tagsInRange) {
    updateTagStatus(directory, sessionId, tag.tagNumber, "compacted")
  }

  // Placeholder: Create a dummy compartment
  const compartment = addCompartment(directory, sessionId, {
    startTag,
    endTag,
    title: `Compressed §${startTag}§-§${endTag}§`,
    content: `[Placeholder] This compartment will contain the compressed summary of messages §${startTag}§ through §${endTag}§.`,
  })

  log("[historian] Background compression completed (placeholder)", {
    sessionId,
    compartmentSequence: compartment.sequence,
  })

  return "success"
}

/**
 * Check if async compression is enabled.
 */
export function isAsyncCompressionEnabled(pluginConfig: OhMyOpenCodeConfig): boolean {
  return (
    pluginConfig.experimental?.magic_context?.enabled === true &&
    pluginConfig.experimental?.magic_context?.async_compression === true
  )
}
