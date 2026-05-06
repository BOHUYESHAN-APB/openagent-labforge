import type { PluginInput } from "@opencode-ai/plugin"
import { log } from "../../shared"
import { normalizeSDKResponse } from "../../shared"
import { RetryableSubagentError, isSessionErrorRetryable } from "../../shared/subagent-error-handler"

interface SDKMessage {
  info?: { role?: string; time?: { created?: number } }
  parts?: Array<{ type: string; text?: string; content?: string | Array<{ type: string; text?: string }> }>
}

export async function waitForCompletion(
  sessionID: string,
  toolContext: {
    sessionID: string
    messageID: string
    agent: string
    abort: AbortSignal
    metadata?: (input: { title?: string; metadata?: Record<string, unknown> }) => void
  },
  ctx: PluginInput
): Promise<void> {
  log(`[call_omo_agent] Polling for completion...`)

  const POLL_INTERVAL_MS = 1000
  const MAX_POLL_TIME_MS = 10 * 60 * 1000 // 10 minutes max
  const pollStart = Date.now()
  let lastMsgCount = 0
  let stablePolls = 0
  const STABILITY_REQUIRED = 2
  let pollCount = 0
  let stuckPolls = 0
  const STUCK_THRESHOLD = 15 // 15 polls (15s) with no message change → check for errors

  while (Date.now() - pollStart < MAX_POLL_TIME_MS) {
    pollCount++

    // Check if aborted
    if (toolContext.abort?.aborted) {
      log(`[call_omo_agent] Aborted by user after ${pollCount} polls`)
      throw new Error("Task aborted.")
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))

    // Check session status
    const statusResult = await ctx.client.session.status()
    const allStatuses = normalizeSDKResponse(statusResult, {} as Record<string, { type: string }>)
    const sessionStatus = allStatuses[sessionID]

    // If session is actively running, reset stability counter
    if (sessionStatus && sessionStatus.type !== "idle") {
      log(`[call_omo_agent] Poll ${pollCount}: status=${sessionStatus.type}, waiting for idle...`)
      stablePolls = 0
      lastMsgCount = 0
      stuckPolls = 0
      continue
    }

    // Session is idle - check message stability
    const messagesCheck = await ctx.client.session.messages({ path: { id: sessionID } })
    const msgs = normalizeSDKResponse(messagesCheck, [] as Array<SDKMessage>, {
      preferResponseOnMissingData: true,
    })
    const currentMsgCount = msgs.length

    log(`[call_omo_agent] Poll ${pollCount}: status=idle, msgCount=${currentMsgCount}, lastMsgCount=${lastMsgCount}, stablePolls=${stablePolls}/${STABILITY_REQUIRED}`)

    if (currentMsgCount > 0 && currentMsgCount === lastMsgCount) {
      stablePolls++
      stuckPolls = 0
      if (stablePolls >= STABILITY_REQUIRED) {
        log(`[call_omo_agent] Session complete after ${pollCount} polls, ${currentMsgCount} messages, elapsed=${Date.now() - pollStart}ms`)
        break
      }
    } else if (currentMsgCount === lastMsgCount) {
      // Message count at 0 and not changing — session may be stuck
      stuckPolls++
      stablePolls = 0

      if (stuckPolls >= STUCK_THRESHOLD) {
        // Check if session has retryable errors in messages
        if (msgs.length > 0) {
          const { retryable, reason } = isSessionErrorRetryable(msgs)
          if (retryable) {
            log(`[call_omo_agent] Session ${sessionID} stuck with retryable error: ${reason}`)
            throw new RetryableSubagentError(
              `Subagent session stuck with retryable error: ${reason}`,
              sessionID,
              reason,
            )
          }
        }

        log(`[call_omo_agent] Session ${sessionID} stuck after ${stuckPolls} polls with ${currentMsgCount} messages`)
        throw new RetryableSubagentError(
          `Subagent session stuck: no messages after ${stuckPolls} polls`,
          sessionID,
          "session stuck, no messages",
        )
      }
    } else {
      if (currentMsgCount !== lastMsgCount) {
        log(`[call_omo_agent] Message count changed: ${lastMsgCount} -> ${currentMsgCount}, resetting stability`)
      }
      stablePolls = 0
      stuckPolls = 0
      lastMsgCount = currentMsgCount
    }
  }

  if (Date.now() - pollStart >= MAX_POLL_TIME_MS) {
    log(`[call_omo_agent] Timeout reached after ${pollCount} polls, ${Date.now() - pollStart}ms elapsed`)
    // Check one last time for retryable errors before giving up
    try {
      const finalMessages = await ctx.client.session.messages({ path: { id: sessionID } })
      const finalMsgs = normalizeSDKResponse(finalMessages, [] as Array<SDKMessage>, {
        preferResponseOnMissingData: true,
      })
      const { retryable, reason } = isSessionErrorRetryable(finalMsgs)
      if (retryable) {
        throw new RetryableSubagentError(
          `Subagent session timed out with retryable error: ${reason}`,
          sessionID,
          reason,
        )
      }
    } catch (err) {
      if (err instanceof RetryableSubagentError) {
        throw err
      }
      // Fall through to timeout error
    }
    throw new Error("Agent task timed out after 10 minutes.")
  }
}
