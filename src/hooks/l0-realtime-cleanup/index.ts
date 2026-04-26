/**
 * L0 Realtime Cleanup Hook
 * 
 * Real-time context cleanup using messages.transform hook.
 * Two-phase execution: Phase 1 (mark tool IDs) → Phase 2 (modify messages).
 * 
 * Inspired by DCP (Dynamic Context Pruning) plugin architecture.
 */

import type { PluginContext } from "../../plugin/types"
import type { OhMyOpenCodeConfig } from "../../config"
import type { MessageWithParts, CleanupStrategy } from "./types"
import { createSessionState, clearPruneTargets, estimateTokens } from "./state"
import { createDeduplicationStrategy } from "./deduplication-strategy"
import { createSupersedeWritesStrategy } from "./supersede-writes-strategy"
import { createPurgeErrorsStrategy } from "./purge-errors-strategy"
import { pruneMessages } from "./prune"
import { log } from "../../shared/logger"

// Session state cache (per session)
const sessionStates = new Map<string, ReturnType<typeof createSessionState>>()

export function createL0RealtimeCleanupHook(args: {
  ctx: PluginContext
  config: OhMyOpenCodeConfig
}) {
  const { config } = args
  
  // Get L0 config (temporarily disabled until schema is updated)
  const l0Config = {
    enabled: false,
    deduplication: { enabled: false },
    supersede_writes: { enabled: false },
    purge_errors: { enabled: false, turn_threshold: 3 },
  }
  
  // TODO: Uncomment when schema is updated
  // const l0Config = config.experimental?.l0_realtime_cleanup ?? {
  //   enabled: false,
  //   deduplication: { enabled: false },
  //   supersede_writes: { enabled: false },
  //   purge_errors: { enabled: false, turn_threshold: 3 },
  // }
  
  // Check if L0 is enabled
  if (!l0Config.enabled) {
    return null
  }
  
  // Create strategies
  const strategies: CleanupStrategy[] = [
    createDeduplicationStrategy({
      enabled: l0Config.deduplication?.enabled ?? false,
    }),
    createSupersedeWritesStrategy({
      enabled: l0Config.supersede_writes?.enabled ?? false,
    }),
    createPurgeErrorsStrategy({
      enabled: l0Config.purge_errors?.enabled ?? false,
      turnThreshold: l0Config.purge_errors?.turn_threshold ?? 3,
    }),
  ]
  
  // Filter enabled strategies
  const enabledStrategies = strategies.filter(s => s.enabled)
  
  // If no strategies enabled, return null
  if (enabledStrategies.length === 0) {
    return null
  }
  
  return {
    "experimental.chat.messages.transform": async (
      input: unknown,
      output: { messages: MessageWithParts[] }
    ): Promise<void> => {
      try {
        const messages = output.messages
        if (!messages || messages.length === 0) return
        
        // Get or create session state
        const sessionID = "current" // Session ID not available in transform hook
        let state = sessionStates.get(sessionID)
        if (!state) {
          state = createSessionState(sessionID)
          sessionStates.set(sessionID, state)
        }
        
        // Update current turn
        state.currentTurn = Math.floor(messages.length / 2)
        
        // Sync tool parameters from messages
        syncToolParameters(state, messages)
        
        // Clear previous prune targets
        clearPruneTargets(state)
        
        // Phase 1: Apply strategies (mark tool IDs for pruning)
        let totalMarked = 0
        let totalEstimatedTokens = 0
        
        for (const strategy of enabledStrategies) {
          const result = strategy.mark({
            state,
            messages,
            config: {
              protectedTools: [],
              turnProtection: {
                enabled: true,
                turns: 2,
              },
            },
          })
          
          totalMarked += result.markedCount
          totalEstimatedTokens += result.estimatedTokens
        }
        
        // Phase 2: Prune messages (modify based on marked IDs)
        if (totalMarked > 0) {
          const pruneResult = pruneMessages(state, messages)
          
          log("[l0-realtime-cleanup] Cleanup completed", {
            markedTools: totalMarked,
            modifiedParts: pruneResult.modifiedParts,
            estimatedTokens: totalEstimatedTokens,
            removedTokens: pruneResult.removedTokens,
            strategiesApplied: enabledStrategies.map(s => s.name),
          })
        }
        
      } catch (error) {
        log("[l0-realtime-cleanup] Error", { error })
      }
    },
  }
}

/**
 * Sync tool parameters from messages to state
 */
function syncToolParameters(
  state: ReturnType<typeof createSessionState>,
  messages: MessageWithParts[]
): void {
  // Clear existing data
  state.toolParameters.clear()
  state.toolIdList = []
  
  let turn = 0
  
  for (const msg of messages) {
    // Increment turn on user messages
    if (msg.info.role === "user") {
      turn++
    }
    
    // Process tool parts
    for (const part of msg.parts) {
      if (part.type !== "tool" || !part.callID || !part.tool) continue
      
      // Add to tool ID list
      state.toolIdList.push(part.callID)
      
      // Extract parameters
      const parameters = (part.state?.input as Record<string, unknown>) ?? {}
      
      // Estimate token count
      const output = part.state?.output ?? ""
      const tokenCount = typeof output === "string" ? estimateTokens(output) : 0
      
      // Store metadata
      state.toolParameters.set(part.callID, {
        tool: part.tool,
        parameters,
        status: (part.state?.status as "completed" | "error" | "pending") ?? "pending",
        turn,
        tokenCount,
      })
    }
  }
}
