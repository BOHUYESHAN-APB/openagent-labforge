/**
 * Todo Continuation Enforcer Hook (Boulder)
 *
 * Forces agent to continue when todos remain incomplete.
 * Fires on session.idle, checks todo status, and injects continuation prompt.
 *
 * Key features:
 * - Abort detection: When user cancels, stop forcing
 * - User intent detection: Respect "stop", "don't continue" etc.
 * - Consecutive failure tracking: After 2 cancellations, stop
 * - Smart stopping: Don't force if user wants to stop
 */

import type { PluginInput } from "@opencode-ai/plugin"

const HOOK_NAME = "todo-continuation-enforcer"

// ==========================================
// Constants
// ==========================================

const CONTINUATION_COOLDOWN_MS = 30_000
const MAX_CONSECUTIVE_FAILURES = 2 // After 2 cancellations, stop
const FAILURE_RESET_WINDOW_MS = 5 * 60_000
const ABORT_WINDOW_MS = 3000

// Reserved for future agent-specific skip logic
// const DEFAULT_SKIP_AGENTS = ["prometheus", "compaction"]

// ==========================================
// Types
// ==========================================

interface SessionState {
  failureCount: number
  lastFailureAt?: number
  abortDetectedAt?: number
  cooldownUntil?: number
  isRecovering?: boolean
  userStopped?: boolean // User explicitly stopped
  lastUserStopAt?: number
}

interface TodoItem {
  id?: string
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high"
}

// ==========================================
// State Management
// ==========================================

const sessionStates = new Map<string, SessionState>()

function getState(sessionID: string): SessionState {
  let state = sessionStates.get(sessionID)
  if (!state) {
    state = { failureCount: 0 }
    sessionStates.set(sessionID, state)
  }
  return state
}

// ==========================================
// Helper Functions
// ==========================================

async function hasIncompleteTodos(
  ctx: PluginInput,
  sessionID: string
): Promise<boolean> {
  try {
    const response = await ctx.client.session.todo({ path: { id: sessionID } })
    const todos = response as unknown as TodoItem[]

    if (!Array.isArray(todos) || todos.length === 0) {
      return false
    }

    return todos.some(
      (todo) => todo.status !== "completed" && todo.status !== "cancelled"
    )
  } catch {
    return false
  }
}

function hasRecentAbort(state: SessionState): boolean {
  if (!state.abortDetectedAt) return false
  return Date.now() - state.abortDetectedAt < ABORT_WINDOW_MS
}

function isCooldownPassed(state: SessionState): boolean {
  if (!state.cooldownUntil) return true
  return Date.now() >= state.cooldownUntil
}

function isFailureCountAcceptable(state: SessionState): boolean {
  // Reset failure count if enough time has passed
  if (state.lastFailureAt) {
    const now = Date.now()
    if (now - state.lastFailureAt > FAILURE_RESET_WINDOW_MS) {
      state.failureCount = 0
    }
  }
  return state.failureCount < MAX_CONSECUTIVE_FAILURES
}

// Reserved for future agent-specific skip logic
// function shouldSkipAgent(agent?: string): boolean {
//   if (!agent) return false
//   return DEFAULT_SKIP_AGENTS.some((skip) =>
//     agent.toLowerCase().includes(skip)
//   )
// }

// ==========================================
// User Intent Detection
// ==========================================

const STOP_PATTERNS = [
  /\b(stop|停[止住]|别[做了继]|不[要需用]继[续续]|够了|可以了|结[束束])\b/i,
  /\b(cancel|取消|中[止断]|放[弃弃])\b/i,
  /\b(don'?t continue|no more|enough|that'?s all)\b/i,
  /\b(暂停|休息|稍[等停]|等一下)\b/i,
]

function detectUserStopIntent(text: string): boolean {
  return STOP_PATTERNS.some((pattern) => pattern.test(text))
}

// ==========================================
// Abort Detection
// ==========================================

function isAbortError(error: unknown): boolean {
  if (!error) return false

  const errorObj = error as Record<string, unknown>
  const name = errorObj?.name as string | undefined
  const message = (
    typeof errorObj?.message === "string" ? errorObj.message : ""
  ).toLowerCase()

  return (
    name === "MessageAbortedError" ||
    name === "AbortError" ||
    message.includes("aborted") ||
    message.includes("cancelled")
  )
}

// ==========================================
// Continuation Prompt
// ==========================================

const CONTINUATION_PROMPT = `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - TODO CONTINUATION]

You have incomplete todos. Please continue working on them.

## Current Status
- You have unfinished work
- Do NOT stop until all todos are completed
- Do NOT ask for permission to continue
- Do NOT skip any todos

## Next Steps
1. Mark the current todo as completed (if done)
2. Start working on the next pending todo
3. Continue until all todos are completed

## Important
- Use todowrite to track progress
- Mark tasks in_progress before starting
- Mark tasks completed immediately after finishing
- Do NOT batch-complete multiple tasks
`

// ==========================================
// Hook Factory
// ==========================================

export function createTodoContinuationEnforcer(
  ctx: PluginInput,
  options?: {
    skipAgents?: string[]
    isContinuationStopped?: (sessionID: string) => boolean
  }
) {
  // Reserved for future agent-specific skip logic
  // const skipAgents = options?.skipAgents ?? DEFAULT_SKIP_AGENTS
  const isContinuationStopped = options?.isContinuationStopped

  const handler = async (input: {
    event: { type: string; properties?: unknown }
  }) => {
    const { event } = input
    const props = event.properties as Record<string, unknown> | undefined

    // Handle session.error for abort detection
    if (event.type === "session.error") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      const error = props?.error
      if (isAbortError(error)) {
        const state = getState(sessionID)
        state.abortDetectedAt = Date.now()
        state.failureCount++
        state.lastFailureAt = Date.now()

        console.log(`[${HOOK_NAME}] Abort detected`, {
          sessionID,
          failureCount: state.failureCount,
        })

        // If user cancelled twice, mark as stopped
        if (state.failureCount >= MAX_CONSECUTIVE_FAILURES) {
          state.userStopped = true
          state.lastUserStopAt = Date.now()

          console.log(`[${HOOK_NAME}] User stopped after ${state.failureCount} cancellations`, {
            sessionID,
          })
        }
      }
      return
    }

    // Handle session.idle for continuation
    if (event.type === "session.idle") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      const state = getState(sessionID)

      // Skip if recovering
      if (state.isRecovering) {
        return
      }

      // Skip if user explicitly stopped
      if (state.userStopped) {
        return
      }

      // Skip if continuation stopped by external mechanism
      if (isContinuationStopped?.(sessionID)) {
        return
      }

      // Skip recent abort
      if (hasRecentAbort(state)) {
        return
      }

      // Check if todos are incomplete
      const incomplete = await hasIncompleteTodos(ctx, sessionID)
      if (!incomplete) {
        return
      }

      // Check cooldown
      if (!isCooldownPassed(state)) {
        return
      }

      // Check failure count (after 2 cancellations, stop)
      if (!isFailureCountAcceptable(state)) {
        return
      }

      // Check last user message for stop intent
      try {
        const messagesResp = await ctx.client.session.messages({
          path: { id: sessionID },
        })
        const messages = messagesResp as unknown as Array<{
          info?: { role?: string }
          parts?: Array<{ type: string; text?: string }>
        }>

        // Find last user message
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i]
          if (msg.info?.role !== "user") continue

          const text = (msg.parts ?? [])
            .filter((p) => p.type === "text")
            .map((p) => p.text ?? "")
            .join("\n")
            .trim()

          if (text && detectUserStopIntent(text)) {
            state.userStopped = true
            state.lastUserStopAt = Date.now()

            console.log(`[${HOOK_NAME}] User stop intent detected`, {
              sessionID,
              text: text.slice(0, 100),
            })
            return
          }
          break
        }
      } catch {
        // Ignore message fetch errors
      }

      // Update cooldown
      state.cooldownUntil = Date.now() + CONTINUATION_COOLDOWN_MS

      // Inject continuation prompt
      try {
        await ctx.client.session.prompt({
          path: { id: sessionID },
          body: {
            parts: [{ type: "text", text: CONTINUATION_PROMPT }],
          },
        })

        console.log(`[${HOOK_NAME}] Injected continuation prompt`, {
          sessionID,
        })
      } catch (error) {
        state.failureCount++
        state.lastFailureAt = Date.now()

        console.error(`[${HOOK_NAME}] Failed to inject continuation`, {
          sessionID,
          error: String(error),
          failureCount: state.failureCount,
        })
      }
      return
    }

    // Handle session.deleted for cleanup
    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        sessionStates.delete(sessionInfo.id)
      }
      return
    }
  }

  return {
    handler,

    markRecovering: (sessionID: string) => {
      const state = getState(sessionID)
      state.isRecovering = true
    },

    markRecoveryComplete: (sessionID: string) => {
      const state = getState(sessionID)
      state.isRecovering = false
    },

    // Reset user stopped state (for manual restart)
    resetUserStopped: (sessionID: string) => {
      const state = getState(sessionID)
      state.userStopped = false
      state.failureCount = 0
    },

    // Check if user stopped
    isUserStopped: (sessionID: string): boolean => {
      return getState(sessionID).userStopped ?? false
    },

    cancelAllCountdowns: () => {
      // No-op for now
    },

    dispose: () => {
      sessionStates.clear()
    },
  }
}

export type TodoContinuationEnforcer = ReturnType<typeof createTodoContinuationEnforcer>
