import type { PluginInput } from "@opencode-ai/plugin"
import { log } from "../../shared"
import { normalizeSDKResponse } from "../../shared"

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

  // Poll for session completion
  const POLL_INTERVAL_MS = 1000 // Increased from 500ms to 1000ms
  const MAX_POLL_TIME_MS = 10 * 60 * 1000 // 10 minutes max
  const pollStart = Date.now()
  let lastMsgCount = 0
  let stablePolls = 0
  const STABILITY_REQUIRED = 2 // Reduced from 3 to 2
  let pollCount = 0

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
      continue
    }

    // Session is idle - check message stability
    const messagesCheck = await ctx.client.session.messages({ path: { id: sessionID } })
    const msgs = normalizeSDKResponse(messagesCheck, [] as Array<unknown>, {
      preferResponseOnMissingData: true,
    })
    const currentMsgCount = msgs.length

    log(`[call_omo_agent] Poll ${pollCount}: status=idle, msgCount=${currentMsgCount}, lastMsgCount=${lastMsgCount}, stablePolls=${stablePolls}/${STABILITY_REQUIRED}`)

    if (currentMsgCount > 0 && currentMsgCount === lastMsgCount) {
      stablePolls++
      if (stablePolls >= STABILITY_REQUIRED) {
        log(`[call_omo_agent] Session complete after ${pollCount} polls, ${currentMsgCount} messages, elapsed=${Date.now() - pollStart}ms`)
        break
      }
    } else {
      if (currentMsgCount !== lastMsgCount) {
        log(`[call_omo_agent] Message count changed: ${lastMsgCount} -> ${currentMsgCount}, resetting stability`)
      }
      stablePolls = 0
      lastMsgCount = currentMsgCount
    }
  }

  if (Date.now() - pollStart >= MAX_POLL_TIME_MS) {
    log(`[call_omo_agent] Timeout reached after ${pollCount} polls, ${Date.now() - pollStart}ms elapsed`)
    throw new Error("Agent task timed out after 10 minutes.")
  }
}
