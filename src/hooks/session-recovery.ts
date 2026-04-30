/**
 * Session Recovery Hook
 *
 * Auto-recovers from various session errors:
 * - tool_result_missing: Reconstruct missing tool results
 * - thinking_block_order: Reorder malformed thinking blocks
 * - thinking_disabled_violation: Strip thinking blocks when disabled
 * - unavailable_tool: Handle unavailable tool calls
 *
 * This hook fires on session.error events.
 */

import type { PluginInput } from "@opencode-ai/plugin"

// ==========================================
// Types
// ==========================================

type RecoveryErrorType =
  | "tool_result_missing"
  | "thinking_block_order"
  | "thinking_disabled_violation"
  | "unavailable_tool"
  | "assistant_prefill_unsupported"
  | null

interface MessageInfo {
  id?: string
  role?: string
  sessionID?: string
  parentID?: string
  error?: unknown
}

// ==========================================
// Error Detection
// ==========================================

function getErrorMessage(error: unknown): string {
  if (!error) return ""
  if (typeof error === "string") return error.toLowerCase()

  const errorObj = error as Record<string, unknown>
  const paths = [
    errorObj.data,
    errorObj.error,
    errorObj,
    (errorObj.data as Record<string, unknown>)?.error,
  ]

  for (const obj of paths) {
    if (obj && typeof obj === "object") {
      const msg = (obj as Record<string, unknown>).message
      if (typeof msg === "string" && msg.length > 0) {
        return msg.toLowerCase()
      }
    }
  }

  try {
    return JSON.stringify(error).toLowerCase()
  } catch {
    return ""
  }
}

function detectErrorType(error: unknown): RecoveryErrorType {
  const message = getErrorMessage(error)

  if (
    message.includes("assistant message prefill") ||
    message.includes("conversation must end with a user message")
  ) {
    return "assistant_prefill_unsupported"
  }

  if (
    message.includes("thinking") &&
    (message.includes("first block") ||
      message.includes("must start with") ||
      message.includes("preceeding") ||
      message.includes("final block") ||
      message.includes("cannot be thinking") ||
      (message.includes("expected") && message.includes("found")))
  ) {
    return "thinking_block_order"
  }

  if (message.includes("thinking is disabled") && message.includes("cannot contain")) {
    return "thinking_disabled_violation"
  }

  if (
    message.includes("tool_result") &&
    (message.includes("missing") || message.includes("not found"))
  ) {
    return "tool_result_missing"
  }

  if (
    message.includes("unavailable tool") ||
    message.includes("no such tool")
  ) {
    return "unavailable_tool"
  }

  return null
}

function isRecoverableError(error: unknown): boolean {
  return detectErrorType(error) !== null
}

// ==========================================
// Recovery Strategies
// ==========================================

async function recoverToolResultMissing(
  ctx: PluginInput,
  sessionID: string,
  assistantMsgID: string
): Promise<boolean> {
  try {
    // Get messages to find the missing tool result
    const messagesResp = await ctx.client.session.messages({
      path: { id: sessionID },
    })
    const messages = messagesResp as unknown as Array<{
      info?: { id?: string; role?: string }
      parts?: Array<{ type: string; [key: string]: unknown }>
    }>

    // Find the assistant message with the tool_use
    const assistantMsg = messages.find((m) => m.info?.id === assistantMsgID)
    if (!assistantMsg) return false

    // Find tool_use parts without corresponding tool_result
    const toolUseParts = (assistantMsg.parts ?? []).filter(
      (p) => p.type === "tool_use"
    )

    if (toolUseParts.length === 0) return false

    // Inject synthetic tool_result for each missing one
    for (const toolUse of toolUseParts) {
      const toolUseId = (toolUse as any).id
      if (!toolUseId) continue

      // Check if tool_result already exists
      const hasResult = messages.some((m) =>
        (m.parts ?? []).some(
          (p) => p.type === "tool_result" && (p as any).tool_use_id === toolUseId
        )
      )

      if (!hasResult) {
        // Inject a recovery message as text (tool_result not supported in prompt API)
        await ctx.client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [
              {
                type: "text",
                text: `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - TOOL RECOVERY]\n\nTool result for ${toolUseId} was missing. The tool call has been recovered. Please continue with the next step.`,
              },
            ],
          },
        })
      }
    }

    return true
  } catch {
    return false
  }
}

async function recoverThinkingBlockOrder(
  _ctx: PluginInput,
  _sessionID: string
): Promise<boolean> {
  // This is handled by the thinking-block-validator hook proactively
  // If we still get this error, we can't recover automatically
  return false
}

async function recoverThinkingDisabledViolation(
  _ctx: PluginInput,
  _sessionID: string
): Promise<boolean> {
  // Strip thinking blocks from the last assistant message
  // This is complex and better handled by the thinking-block-validator
  return false
}

async function recoverUnavailableTool(
  ctx: PluginInput,
  sessionID: string,
  assistantMsgID: string
): Promise<boolean> {
  try {
    // Get messages to find the unavailable tool call
    const messagesResp = await ctx.client.session.messages({
      path: { id: sessionID },
    })
    const messages = messagesResp as unknown as Array<{
      info?: { id?: string; role?: string }
      parts?: Array<{ type: string; [key: string]: unknown }>
    }>

    // Find the assistant message
    const assistantMsg = messages.find((m) => m.info?.id === assistantMsgID)
    if (!assistantMsg) return false

    // Find unavailable tool_use parts
    const toolUseParts = (assistantMsg.parts ?? []).filter(
      (p) => p.type === "tool_use"
    )

    if (toolUseParts.length === 0) return false

    // Inject error recovery message for each unavailable tool
    for (const toolUse of toolUseParts) {
      const toolUseId = (toolUse as any).id
      if (!toolUseId) continue

      await ctx.client.session.prompt({
        path: { id: sessionID },
        body: {
          parts: [
            {
              type: "text",
              text: `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - TOOL UNAVAILABLE]\n\nTool ${toolUseId} is unavailable. Please use an alternative approach.`,
            },
          ],
        },
      })
    }

    return true
  } catch {
    return false
  }
}

// ==========================================
// Hook Factory
// ==========================================

export function createSessionRecoveryHook(
  ctx: PluginInput,
  _options?: {
    experimental?: {
      auto_resume?: boolean
    }
  }
) {
  const processingErrors = new Set<string>()

  return {
    handleSessionRecovery: async (info: MessageInfo): Promise<boolean> => {
      if (!info || info.role !== "assistant" || !info.error) return false

      const errorType = detectErrorType(info.error)
      if (!errorType) return false

      const sessionID = info.sessionID
      const assistantMsgID = info.id

      if (!sessionID || !assistantMsgID) return false
      if (processingErrors.has(assistantMsgID)) return false
      processingErrors.add(assistantMsgID)

      try {
        // Abort current session
        await ctx.client.session.abort({ path: { id: sessionID } }).catch(() => {})

        // Show toast
        const toastTitles: Record<string, string> = {
          tool_result_missing: "Tool Crash Recovery",
          unavailable_tool: "Tool Recovery",
          thinking_block_order: "Thinking Block Recovery",
          thinking_disabled_violation: "Thinking Strip Recovery",
          assistant_prefill_unsupported: "Prefill Unsupported",
        }

        await ctx.client.tui
          .showToast({
            body: {
              title: toastTitles[errorType] ?? "Session Recovery",
              message: "Attempting automatic recovery...",
              variant: "warning" as const,
              duration: 3000,
            },
          })
          .catch(() => {})

        // Attempt recovery based on error type
        let recovered = false
        switch (errorType) {
          case "tool_result_missing":
            recovered = await recoverToolResultMissing(ctx, sessionID, assistantMsgID)
            break
          case "thinking_block_order":
            recovered = await recoverThinkingBlockOrder(ctx, sessionID)
            break
          case "thinking_disabled_violation":
            recovered = await recoverThinkingDisabledViolation(ctx, sessionID)
            break
          case "unavailable_tool":
            recovered = await recoverUnavailableTool(ctx, sessionID, assistantMsgID)
            break
          case "assistant_prefill_unsupported":
            // No recovery possible
            recovered = false
            break
        }

        if (recovered) {
          await ctx.client.tui
            .showToast({
              body: {
                title: "Recovery Successful",
                message: `Recovered from ${errorType}`,
                variant: "success" as const,
                duration: 3000,
              },
            })
            .catch(() => {})
        }

        return recovered
      } catch {
        return false
      } finally {
        processingErrors.delete(assistantMsgID)
      }
    },

    isRecoverableError,

    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      // Cleanup on session delete
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionId = props?.info?.id
        if (sessionId) {
          // Clear any processing state for this session
          for (const key of processingErrors) {
            if (key.includes(sessionId)) {
              processingErrors.delete(key)
            }
          }
        }
      }
    },
  }
}

export type SessionRecoveryHook = ReturnType<typeof createSessionRecoveryHook>
