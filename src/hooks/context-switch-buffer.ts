/**
 * Context Switch Buffer
 *
 * Provides smooth context window transitions when switching between models
 * with different context limits (e.g., 1M → 400K → 200K → 128K).
 *
 * Strategy:
 * - When switching to a smaller context model, temporarily relax thresholds
 * - Allow one compaction cycle at L2 standard even if at L3 level
 * - Prevent immediate "context overflow" errors during model switches
 */

import { log } from "../shared/logger"

interface ContextSwitchState {
  previousLimit: number
  newLimit: number
  switchTimestamp: number
  allowBufferedCompaction: boolean
}

const SWITCH_BUFFER_DURATION_MS = 60_000 // 1 minute buffer after switch
const contextSwitchStates = new Map<string, ContextSwitchState>()

/**
 * Register a context window switch for a session
 */
export function registerContextSwitch(
  sessionID: string,
  previousLimit: number,
  newLimit: number
): void {
  // Only register if switching to a smaller context
  if (newLimit >= previousLimit) {
    contextSwitchStates.delete(sessionID)
    return
  }

  contextSwitchStates.set(sessionID, {
    previousLimit,
    newLimit,
    switchTimestamp: Date.now(),
    allowBufferedCompaction: true,
  })

  log("[context-switch-buffer] Registered context switch", {
    sessionID,
    previousLimit,
    newLimit,
    reduction: `${((1 - newLimit / previousLimit) * 100).toFixed(1)}%`,
  })
}

/**
 * Check if a session is in context switch buffer period
 */
export function isInSwitchBuffer(sessionID: string): boolean {
  const state = contextSwitchStates.get(sessionID)
  if (!state) return false

  const elapsed = Date.now() - state.switchTimestamp
  if (elapsed > SWITCH_BUFFER_DURATION_MS) {
    contextSwitchStates.delete(sessionID)
    return false
  }

  return true
}

/**
 * Get adjusted compaction threshold during switch buffer
 *
 * During buffer period:
 * - If at L3 level, use L2 threshold for compaction
 * - This allows one "gentle" compaction instead of aggressive truncation
 */
export function getBufferedThreshold(
  sessionID: string,
  normalThreshold: number,
  currentLevel: 0 | 1 | 2 | 3
): number {
  if (!isInSwitchBuffer(sessionID)) {
    return normalThreshold
  }

  const state = contextSwitchStates.get(sessionID)
  if (!state || !state.allowBufferedCompaction) {
    return normalThreshold
  }

  // If at L3 (severe), relax to L2 threshold for first compaction
  if (currentLevel === 3) {
    // Use a slightly higher threshold (more lenient)
    const bufferedThreshold = normalThreshold * 0.85 // 15% more lenient

    log("[context-switch-buffer] Applying buffered threshold", {
      sessionID,
      normalThreshold,
      bufferedThreshold,
      currentLevel,
    })

    // Mark that we've used the buffer
    state.allowBufferedCompaction = false

    return bufferedThreshold
  }

  return normalThreshold
}

/**
 * Clear switch buffer for a session
 */
export function clearSwitchBuffer(sessionID: string): void {
  contextSwitchStates.delete(sessionID)
}

/**
 * Get switch buffer info for debugging
 */
export function getSwitchBufferInfo(sessionID: string): ContextSwitchState | null {
  return contextSwitchStates.get(sessionID) ?? null
}
