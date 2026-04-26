/**
 * Context Usage and Compression Trigger Optimization
 * 
 * Prevents double compression by checking context usage before injection
 * and adding cooldown periods between compressions.
 */

import { log } from "../../shared/logger"

const COMPACTION_COOLDOWN_MS = 60_000 // 60s cooldown between compressions
const CONTEXT_USAGE_THRESHOLD = 0.80 // Trigger preemptive compression at 80%

interface CompactionState {
  lastCompactionAt?: number
  lastCompactionTriggeredBy?: string
}

const sessionCompactionState = new Map<string, CompactionState>()

/**
 * Check if we're in compaction cooldown period
 */
export function isInCompactionCooldown(sessionID: string): boolean {
  const state = sessionCompactionState.get(sessionID)
  if (!state?.lastCompactionAt) return false
  
  const elapsed = Date.now() - state.lastCompactionAt
  return elapsed < COMPACTION_COOLDOWN_MS
}

/**
 * Get time remaining in cooldown (ms)
 */
export function getCompactionCooldownRemaining(sessionID: string): number {
  const state = sessionCompactionState.get(sessionID)
  if (!state?.lastCompactionAt) return 0
  
  const elapsed = Date.now() - state.lastCompactionAt
  const remaining = COMPACTION_COOLDOWN_MS - elapsed
  return Math.max(0, remaining)
}

/**
 * Mark that a compaction occurred
 */
export function markCompactionOccurred(sessionID: string, triggeredBy: string): void {
  sessionCompactionState.set(sessionID, {
    lastCompactionAt: Date.now(),
    lastCompactionTriggeredBy: triggeredBy,
  })
  
  log("[compaction-guard] Compaction marked", {
    sessionID,
    triggeredBy,
    cooldownMs: COMPACTION_COOLDOWN_MS,
  })
}

/**
 * Get context usage ratio (0.0 - 1.0)
 * Returns undefined if unable to determine
 */
export async function getContextUsage(
  client: any,
  sessionID: string
): Promise<number | undefined> {
  try {
    // Try to get context usage from session metadata
    const session = await client.session.get({ path: { id: sessionID } })
    
    // Check if session has context usage info
    if (session?.data?.contextUsage !== undefined) {
      return session.data.contextUsage
    }
    
    // Fallback: estimate from message count (rough heuristic)
    const messages = await client.session.message({ path: { id: sessionID } })
    const messageCount = messages?.data?.length || 0
    
    // Very rough estimate: assume ~1000 tokens per message, 200K context
    // This is just a fallback heuristic
    const estimatedTokens = messageCount * 1000
    const estimatedUsage = estimatedTokens / 200000
    
    return Math.min(1.0, estimatedUsage)
  } catch (error) {
    log("[compaction-guard] Failed to get context usage", {
      sessionID,
      error: String(error),
    })
    return undefined
  }
}

/**
 * Check if we should trigger preemptive compression before injection
 */
export async function shouldTriggerPreemptiveCompression(
  client: any,
  sessionID: string
): Promise<{ shouldCompress: boolean; reason?: string; usage?: number }> {
  // Check cooldown first
  if (isInCompactionCooldown(sessionID)) {
    const remaining = getCompactionCooldownRemaining(sessionID)
    return {
      shouldCompress: false,
      reason: `In cooldown (${Math.ceil(remaining / 1000)}s remaining)`,
    }
  }
  
  // Check context usage
  const usage = await getContextUsage(client, sessionID)
  
  if (usage === undefined) {
    return {
      shouldCompress: false,
      reason: "Unable to determine context usage",
    }
  }
  
  if (usage >= CONTEXT_USAGE_THRESHOLD) {
    return {
      shouldCompress: true,
      reason: `Context usage high (${(usage * 100).toFixed(1)}%)`,
      usage,
    }
  }
  
  return {
    shouldCompress: false,
    reason: `Context usage acceptable (${(usage * 100).toFixed(1)}%)`,
    usage,
  }
}

/**
 * Trigger compression and wait for completion
 */
export async function triggerAndWaitForCompression(
  client: any,
  sessionID: string,
  triggeredBy: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  try {
    log("[compaction-guard] Triggering preemptive compression", {
      sessionID,
      triggeredBy,
      timeoutMs,
    })
    
    // Trigger compression via session.summarize or similar
    // This is a placeholder - actual implementation depends on OpenCode API
    await client.session.summarize?.({ path: { id: sessionID } })
    
    // Mark compaction occurred
    markCompactionOccurred(sessionID, triggeredBy)
    
    // Wait a bit for compression to settle
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    log("[compaction-guard] Preemptive compression completed", {
      sessionID,
      triggeredBy,
    })
    
    return true
  } catch (error) {
    log("[compaction-guard] Preemptive compression failed", {
      sessionID,
      triggeredBy,
      error: String(error),
    })
    return false
  }
}
