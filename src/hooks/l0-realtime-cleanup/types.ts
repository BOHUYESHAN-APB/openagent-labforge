/**
 * L0 Realtime Cleanup - Type Definitions
 * 
 * Defines types for L0 layer real-time context cleanup strategies.
 * Matches OpenCode's message structure from messages.transform hook.
 */

import type { SessionState } from "./state"

/**
 * OpenCode message structure (from messages.transform hook)
 */
export interface MessageWithParts {
  info: {
    id?: string
    role: string
    [key: string]: unknown
  }
  parts: Array<{
    type: string
    callID?: string
    tool?: string
    state?: {
      status?: "completed" | "error" | "pending"
      input?: Record<string, unknown>
      output?: string
      [key: string]: unknown
    }
    [key: string]: unknown
  }>
}

/**
 * Strategy context (Phase 1: Mark tool IDs)
 */
export interface StrategyContext {
  state: SessionState
  messages: MessageWithParts[]
  config: {
    protectedTools: string[]
    turnProtection: {
      enabled: boolean
      turns: number
    }
  }
}

/**
 * Strategy result (Phase 1: Marking)
 */
export interface StrategyResult {
  markedCount: number
  estimatedTokens: number
}

/**
 * Prune result (Phase 2: Modification)
 */
export interface PruneResult {
  modifiedParts: number
  removedTokens: number
}

/**
 * Strategy interface (Phase 1: Mark tool IDs for pruning)
 */
export interface CleanupStrategy {
  name: string
  enabled: boolean
  
  /**
   * Phase 1: Analyze messages and mark tool IDs for pruning
   * Does NOT modify messages, only marks state.prune.tools
   */
  mark: (context: StrategyContext) => StrategyResult
}
