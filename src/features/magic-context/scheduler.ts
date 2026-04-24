import type { SessionMeta } from "./storage/session-meta-storage"
import { isCacheTtlExpired } from "./ttl-tracker"

export interface ContextUsage {
  percentage: number
  inputTokens: number
}

export type SchedulerDecision = "execute" | "defer"

export interface SchedulerOptions {
  executeThresholdPercentage?: number
}

/**
 * Scheduler decides whether to execute compression operations immediately
 * or defer them until cache TTL expires
 */
export class Scheduler {
  private executeThresholdPercentage: number

  constructor(options: SchedulerOptions = {}) {
    this.executeThresholdPercentage = options.executeThresholdPercentage ?? 65
  }

  /**
   * Determine whether to execute compression now or defer it
   *
   * Returns "execute" when:
   * 1. Context usage exceeds threshold (default 65%)
   * 2. Cache TTL has expired
   *
   * Returns "defer" otherwise (queue operations, don't apply yet)
   */
  shouldExecute(
    sessionMeta: SessionMeta | null,
    contextUsage: ContextUsage,
    currentTime?: number,
    sessionId?: string,
    modelKey?: string
  ): SchedulerDecision {
    // Condition 1: Threshold exceeded
    if (contextUsage.percentage >= this.executeThresholdPercentage) {
      return "execute"
    }

    // If no session metadata, defer (conservative approach)
    if (!sessionMeta) {
      return "defer"
    }

    // Condition 2: Cache TTL expired
    const ttlExpired = isCacheTtlExpired(
      sessionMeta.lastResponseTime,
      sessionMeta.cacheTtl
    )

    if (ttlExpired) {
      return "execute"
    }

    // Default: defer operations
    return "defer"
  }

  /**
   * Update the execute threshold percentage
   */
  setExecuteThreshold(percentage: number): void {
    this.executeThresholdPercentage = percentage
  }

  /**
   * Get current execute threshold
   */
  getExecuteThreshold(): number {
    return this.executeThresholdPercentage
  }
}

/**
 * Create a scheduler instance with default or custom options
 */
export function createScheduler(options?: SchedulerOptions): Scheduler {
  return new Scheduler(options)
}
