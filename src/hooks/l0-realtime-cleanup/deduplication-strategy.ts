/**
 * L0 Realtime Cleanup - Deduplication Strategy
 * 
 * Phase 1: Mark duplicate tool calls for pruning.
 * Keeps the most recent call, marks older duplicates.
 * 
 * Inspired by DCP's deduplication.ts implementation.
 */

import type { CleanupStrategy, StrategyContext, StrategyResult } from "./types"
import { buildToolSignature, markToolForPruning, getUnprunedToolIds } from "./state"
import { log } from "../../shared/logger"

export function createDeduplicationStrategy(config: {
  enabled: boolean
}): CleanupStrategy {
  return {
    name: "deduplication",
    enabled: config.enabled,
    
    mark: (context: StrategyContext): StrategyResult => {
      const { state } = context
      let markedCount = 0
      let estimatedTokens = 0

      // Build signature map: signature -> [callID1, callID2, ...]
      const signatureMap = new Map<string, string[]>()
      
      // Get unpruned tool IDs
      const unprunedIds = getUnprunedToolIds(state)
      
      // Group tool calls by signature
      for (const callID of unprunedIds) {
        const metadata = state.toolParameters.get(callID)
        if (!metadata) continue
        
        // Build signature
        const signature = buildToolSignature(metadata.tool, metadata.parameters)
        
        // Add to signature map
        if (!signatureMap.has(signature)) {
          signatureMap.set(signature, [])
        }
        signatureMap.get(signature)!.push(callID)
      }
      
      // Mark duplicates (keep the most recent, mark older ones)
      for (const [signature, callIDs] of signatureMap.entries()) {
        if (callIDs.length <= 1) continue
        
        // Sort by turn (oldest first)
        const sorted = callIDs.sort((a, b) => {
          const metaA = state.toolParameters.get(a)
          const metaB = state.toolParameters.get(b)
          if (!metaA || !metaB) return 0
          return metaA.turn - metaB.turn
        })
        
        // Mark all except the last one (most recent)
        const toMark = sorted.slice(0, -1)
        
        for (const callID of toMark) {
          const metadata = state.toolParameters.get(callID)
          if (!metadata) continue
          
          markToolForPruning(state, callID, metadata.tokenCount)
          markedCount++
          estimatedTokens += metadata.tokenCount
          
          log(`[l0-dedup] Marked duplicate`, {
            tool: metadata.tool,
            callID,
            turn: metadata.turn,
            signature: signature.substring(0, 50) + "...",
          })
        }
      }

      return { markedCount, estimatedTokens }
    },
  }
}
