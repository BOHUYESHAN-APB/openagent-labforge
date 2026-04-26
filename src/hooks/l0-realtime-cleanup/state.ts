/**
 * L0 Realtime Cleanup - Session State Management
 * 
 * Manages session-level state for tracking tool calls and prune targets.
 * Inspired by DCP's SessionState architecture.
 */

export interface ToolMetadata {
  tool: string
  parameters: Record<string, unknown>
  status: "completed" | "error" | "pending"
  turn: number
  tokenCount: number
}

export interface SessionState {
  // Session identifier
  sessionID: string
  
  // Current turn number (increments with each user-assistant exchange)
  currentTurn: number
  
  // Tool call tracking
  toolParameters: Map<string, ToolMetadata>  // callID -> metadata
  toolIdList: string[]  // All tool callIDs in order
  
  // Prune targets (marked by strategies)
  prune: {
    tools: Map<string, number>  // callID -> tokenCount to remove
  }
}

/**
 * Create a new session state
 */
export function createSessionState(sessionID: string): SessionState {
  return {
    sessionID,
    currentTurn: 0,
    toolParameters: new Map(),
    toolIdList: [],
    prune: {
      tools: new Map(),
    },
  }
}

/**
 * Estimate token count from text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

/**
 * Build tool signature for deduplication
 * Format: toolName::sortedParams
 */
export function buildToolSignature(tool: string, parameters: Record<string, unknown>): string {
  // Sort parameters by key for consistent signatures
  const sortedKeys = Object.keys(parameters).sort()
  const sortedParams: Record<string, unknown> = {}
  
  for (const key of sortedKeys) {
    sortedParams[key] = parameters[key]
  }
  
  return `${tool}::${JSON.stringify(sortedParams)}`
}

/**
 * Clear prune targets (called after prune execution)
 */
export function clearPruneTargets(state: SessionState): void {
  state.prune.tools.clear()
}

/**
 * Get unpruned tool IDs (not marked for pruning)
 */
export function getUnprunedToolIds(state: SessionState): string[] {
  return state.toolIdList.filter(id => !state.prune.tools.has(id))
}

/**
 * Mark tool for pruning
 */
export function markToolForPruning(
  state: SessionState,
  callID: string,
  tokenCount: number
): void {
  state.prune.tools.set(callID, tokenCount)
}

/**
 * Check if tool is marked for pruning
 */
export function isToolMarkedForPruning(state: SessionState, callID: string): boolean {
  return state.prune.tools.has(callID)
}
