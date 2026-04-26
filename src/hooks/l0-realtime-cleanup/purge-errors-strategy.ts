/**
 * L0 Realtime Cleanup - Purge Errors Strategy
 * 
 * Phase 1: Mark old error tool calls for pruning.
 * Removes error tool calls that are older than N turns.
 * 
 * Inspired by DCP's purge-errors.ts implementation.
 */

import type { CleanupStrategy, StrategyContext, StrategyResult } from "./types"
import { markToolForPruning, getUnprunedToolIds } from "./state"
import { log } from "../../shared/logger"

const DEFAULT_ERROR_TURN_THRESHOLD = 3

export function createPurgeErrorsStrategy(config: {
  enabled: boolean
  turnThreshold?: number
}): CleanupStrategy {
  const turnThreshold = config.turnThreshold ?? DEFAULT_ERROR_TURN_THRESHOLD
  
  return {
    name: "purge-errors",
    enabled: config.enabled,
    
    mark: (context: StrategyContext): StrategyResult => {
      const { state } = context
      let markedCount = 0
      let estimatedTokens = 0

      // Get unpruned tool IDs
      const unprunedIds = getUnprunedToolIds(state)
      
      // Mark old error tools
      for (const callID of unprunedIds) {
        const metadata = state.toolParameters.get(callID)
        if (!metadata) continue
        
        // Only process error tools
        if (metadata.status !== "error") continue
        
        // Check if error is old enough
        const turnAge = state.currentTurn - metadata.turn
        if (turnAge < turnThreshold) continue
        
        // Mark for pruning
        markToolForPruning(state, callID, metadata.tokenCount)
        markedCount++
        estimatedTokens += metadata.tokenCount
        
        log(`[l0-purge-errors] Marked old error`, {
          tool: metadata.tool,
          callID,
          turn: metadata.turn,
          turnAge,
          threshold: turnThreshold,
        })
      }

      return { markedCount, estimatedTokens }
    },
  }
}
