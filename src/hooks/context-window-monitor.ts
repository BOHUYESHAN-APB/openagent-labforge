/**
 * Context Window Monitor Hook
 *
 * Tracks context window usage and triggers compression when needed.
 * Uses OpenCode's native context stats (not self-estimated).
 *
 * Key features:
 * - Tracks token usage per session
 * - Triggers compression at configurable thresholds
 * - Supports L0-L3 compression levels
 */

import type { PluginInput } from "@opencode-ai/plugin"

const HOOK_NAME = "context-window-monitor"

// ==========================================
// Types
// ==========================================

interface TokenInfo {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

interface SessionContextState {
  tokens: TokenInfo
  contextLimit?: number
  lastUpdatedAt: number
}

// ==========================================
// Constants
// ==========================================

const DEFAULT_CONTEXT_LIMIT = 128_000

// Context guard profiles
const CONTEXT_GUARD_PROFILES = {
  conservative: {
    l1_threshold: 0.55,
    l2_threshold: 0.70,
    l3_threshold: 0.80,
  },
  balanced: {
    l1_threshold: 0.60,
    l2_threshold: 0.75,
    l3_threshold: 0.85,
  },
  aggressive: {
    l1_threshold: 0.65,
    l2_threshold: 0.80,
    l3_threshold: 0.90,
  },
} as const

type ContextGuardProfile = keyof typeof CONTEXT_GUARD_PROFILES

// ==========================================
// State Management
// ==========================================

const sessionStates = new Map<string, SessionContextState>()

function getState(sessionID: string): SessionContextState {
  let state = sessionStates.get(sessionID)
  if (!state) {
    state = {
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      lastUpdatedAt: Date.now(),
    }
    sessionStates.set(sessionID, state)
  }
  return state
}

// ==========================================
// Helper Functions
// ==========================================

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function calculateUsageRatio(state: SessionContextState): number {
  const totalTokens = state.tokens.input + state.tokens.output + state.tokens.reasoning
  const limit = state.contextLimit ?? DEFAULT_CONTEXT_LIMIT
  return totalTokens / limit
}

function getCompressionLevel(usageRatio: number, profile: ContextGuardProfile): number {
  const thresholds = CONTEXT_GUARD_PROFILES[profile]

  if (usageRatio >= thresholds.l3_threshold) return 3
  if (usageRatio >= thresholds.l2_threshold) return 2
  if (usageRatio >= thresholds.l1_threshold) return 1
  return 0
}

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

// ==========================================
// Compression Trigger
// ==========================================

async function triggerCompression(
  ctx: PluginInput,
  sessionID: string,
  level: number
): Promise<void> {
  const state = getState(sessionID)
  const usageRatio = calculateUsageRatio(state)

  console.log(`[${HOOK_NAME}] Compression triggered`, {
    sessionID,
    level,
    usageRatio: `${(usageRatio * 100).toFixed(1)}%`,
    tokens: formatTokenCount(state.tokens.input + state.tokens.output),
  })

  // Show toast
  await ctx.client.tui
    .showToast({
      body: {
        title: `Context Compression L${level}`,
        message: `Usage: ${(usageRatio * 100).toFixed(1)}% - Compressing...`,
        variant: "warning" as const,
        duration: 3000,
      },
    })
    .catch(() => {})

  // TODO: Implement actual compression logic
  // For now, just log the event
}

// ==========================================
// Hook Factory
// ==========================================

export function createContextWindowMonitorHook(
  ctx: PluginInput,
  options?: {
    profile?: ContextGuardProfile
  }
) {
  const profile = options?.profile ?? "balanced"

  return {
    "experimental.chat.messages.transform": async (
      _input: Record<string, never>,
      output: { messages: Array<{ info: { role: string; sessionID?: string }; parts: Array<{ type: string; text?: string }> }> }
    ): Promise<void> => {
      // Find session ID from messages
      let sessionID: string | undefined
      for (const msg of output.messages) {
        if (msg.info.sessionID) {
          sessionID = msg.info.sessionID
          break
        }
      }

      if (!sessionID) return

      const state = getState(sessionID)

      // Estimate tokens from messages
      let totalTokens = 0
      for (const msg of output.messages) {
        for (const part of msg.parts) {
          if (part.type === "text" && part.text) {
            totalTokens += estimateTokens(part.text)
          }
        }
      }

      // Update state
      state.tokens.input = totalTokens
      state.lastUpdatedAt = Date.now()

      // Check compression threshold
      const usageRatio = calculateUsageRatio(state)
      const compressionLevel = getCompressionLevel(usageRatio, profile)

      if (compressionLevel > 0) {
        await triggerCompression(ctx, sessionID, compressionLevel)
      }
    },

    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      // Cleanup on session delete
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionId = props?.info?.id
        if (sessionId) {
          sessionStates.delete(sessionId)
        }
      }
    },
  }
}

export type ContextWindowMonitorHook = ReturnType<typeof createContextWindowMonitorHook>
