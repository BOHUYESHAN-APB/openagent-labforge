/**
 * L0 Realtime Cleanup - Supersede Writes Strategy
 * 
 * Phase 1: Mark superseded write/edit operations for pruning.
 * When the same file is written multiple times, only keep the most recent.
 */

import type { CleanupStrategy, StrategyContext, StrategyResult } from "./types"
import { markToolForPruning, getUnprunedToolIds } from "./state"
import { log } from "../../shared/logger"

const FILE_OPERATION_TOOLS = ["write", "edit"]

export function createSupersedeWritesStrategy(config: {
  enabled: boolean
}): CleanupStrategy {
  return {
    name: "supersede-writes",
    enabled: config.enabled,
    
    mark: (context: StrategyContext): StrategyResult => {
      const { state } = context
      let markedCount = 0
      let estimatedTokens = 0

      // Build file operation map: filePath -> [callID1, callID2, ...]
      const fileOpsMap = new Map<string, string[]>()
      
      // Get unpruned tool IDs
      const unprunedIds = getUnprunedToolIds(state)
      
      // Group file operations by file path
      for (const callID of unprunedIds) {
        const metadata = state.toolParameters.get(callID)
        if (!metadata) continue
        
        // Only process write/edit tools
        if (!FILE_OPERATION_TOOLS.includes(metadata.tool)) continue
        
        // Extract file path from parameters
        const filePath = extractFilePath(metadata.parameters)
        if (!filePath) continue
        
        // Add to file ops map
        if (!fileOpsMap.has(filePath)) {
          fileOpsMap.set(filePath, [])
        }
        fileOpsMap.get(filePath)!.push(callID)
      }
      
      // Mark superseded operations (keep the most recent)
      for (const [filePath, callIDs] of fileOpsMap.entries()) {
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
          
          log(`[l0-supersede] Marked superseded write`, {
            tool: metadata.tool,
            callID,
            turn: metadata.turn,
            filePath,
          })
        }
      }

      return { markedCount, estimatedTokens }
    },
  }
}

/**
 * Extract file path from tool parameters
 */
function extractFilePath(parameters: Record<string, unknown>): string | null {
  // Try common parameter names
  if (typeof parameters.filePath === "string") return parameters.filePath
  if (typeof parameters.file_path === "string") return parameters.file_path
  if (typeof parameters.path === "string") return parameters.path
  if (typeof parameters.file === "string") return parameters.file
  
  return null
}
