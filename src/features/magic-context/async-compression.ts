import type { OhMyOpenCodeConfig } from "../../config"
import { log } from "../../shared/logger"
import { buildHistorianPrompt } from "../../agents/historian"
import { addCompartment } from "./storage/compartments-storage"
import { getSessionTags, updateTagStatus } from "./storage/tags-storage"
import { extractLatestAssistantText } from "../../shared/assistant-message-extractor"
import { promptSyncWithModelSuggestionRetry } from "../../shared/model-suggestion-retry"

export interface CompressionRequest {
  sessionId: string
  startTag: number
  endTag: number
  reason: string
}

const DEFAULT_HISTORIAN_TIMEOUT_MS = 120_000 // 2 minutes
const MAX_RETRIES = 2

type PluginClient = {
  session: {
    create: (args: any) => Promise<any>
    messages: (args: any) => Promise<any>
    delete: (args: any) => Promise<any>
  }
}

/**
 * Launch background compression via Historian agent.
 *
 * This function is called when async compression is enabled and compaction is triggered.
 * It launches a background agent (Historian) to compress the specified tag range.
 */
export async function launchBackgroundCompression(
  client: PluginClient,
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

  let childSessionId: string | null = null

  try {
    // 1. Create child session
    log("[historian] Creating child session", { parentSessionId: sessionId })
    const createResponse = await client.session.create({
      body: {
        parentID: sessionId,
        title: "magic-context-compartment",
      },
      query: { directory },
    })

    childSessionId = (createResponse.data as any)?.id ?? null
    if (!childSessionId) {
      throw new Error("Failed to create child session: no session ID returned")
    }

    log("[historian] Child session created", { childSessionId })

    // 2. Send Historian prompt with retries
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        log("[historian] Sending prompt", { attempt: attempt + 1, maxRetries: MAX_RETRIES + 1 })

        await promptSyncWithModelSuggestionRetry(
          client as any,
          {
            path: { id: childSessionId },
            query: { directory },
            body: {
              agent: "historian",
              parts: [{ type: "text", text: historianPrompt }],
            },
          },
          { timeoutMs: DEFAULT_HISTORIAN_TIMEOUT_MS }
        )

        log("[historian] Prompt completed successfully")
        lastError = null
        break
      } catch (error) {
        lastError = error as Error
        const errorMsg = error instanceof Error ? error.message : String(error)
        log("[historian] Prompt attempt failed", { attempt: attempt + 1, error: errorMsg })

        if (attempt < MAX_RETRIES && isTransientError(errorMsg)) {
          const backoffMs = getRetryBackoffMs(attempt)
          log("[historian] Retrying after backoff", { backoffMs })
          await sleep(backoffMs)
        } else {
          throw error
        }
      }
    }

    if (lastError) {
      throw lastError
    }

    // 3. Retrieve compressed summary from messages
    log("[historian] Retrieving messages from child session")
    const messagesResponse = await client.session.messages({
      path: { id: childSessionId },
      query: { directory },
    })

    const messages = messagesResponse.data
    const compressedContent = extractLatestAssistantText(messages)

    if (!compressedContent) {
      throw new Error("Historian returned no assistant output")
    }

    log("[historian] Compression completed", {
      contentLength: compressedContent.length,
      tagsCompressed: tagsInRange.length,
    })

    // 4. Store as compartment
    const compartment = addCompartment(directory, sessionId, {
      startTag,
      endTag,
      title: `Compressed §${startTag}§-§${endTag}§`,
      content: compressedContent,
    })

    // 5. Mark tags as compacted
    for (const tag of tagsInRange) {
      updateTagStatus(directory, sessionId, tag.tagNumber, "compacted")
    }

    log("[historian] Background compression completed", {
      sessionId,
      compartmentSequence: compartment.sequence,
      tagsCompacted: tagsInRange.length,
    })

    return "success"
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log("[historian] Background compression failed", {
      sessionId,
      startTag,
      endTag,
      error: errorMsg,
    })

    // On failure, don't mark tags as compacted - they remain active
    return `error: ${errorMsg}`
  } finally {
    // Cleanup: delete child session
    if (childSessionId) {
      try {
        await client.session.delete({
          path: { id: childSessionId },
          query: { directory },
        })
        log("[historian] Child session cleaned up", { childSessionId })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        log("[historian] Failed to cleanup child session", { childSessionId, error: errorMsg })
      }
    }
  }
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

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Get retry backoff time in milliseconds.
 */
function getRetryBackoffMs(retryIndex: number): number {
  if (retryIndex === 0) {
    return 2_000 + Math.floor(Math.random() * 1_001) // 2-3s
  }
  return 6_000 + Math.floor(Math.random() * 2_001) // 6-8s
}

/**
 * Check if error is transient and should be retried.
 */
function isTransientError(message: string): boolean {
  const normalized = message.toLowerCase()

  // Don't retry auth/permission errors
  if (
    normalized.includes("invalid request") ||
    normalized.includes("bad request") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("authentication") ||
    normalized.includes("auth") ||
    normalized.includes(" 400") ||
    normalized.startsWith("400")
  ) {
    return false
  }

  // Retry rate limits, timeouts, server errors
  return [
    "429",
    "rate limit",
    "timeout",
    "econnreset",
    "etimedout",
    "503",
    "502",
    "500",
    "overloaded",
  ].some((token) => normalized.includes(token))
}
