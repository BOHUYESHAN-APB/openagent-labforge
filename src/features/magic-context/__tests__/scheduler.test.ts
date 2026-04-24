import { describe, expect, test } from "bun:test"
import { Scheduler, createScheduler } from "../scheduler"
import type { SessionMeta } from "../storage/session-meta-storage"
import type { ContextUsage } from "../scheduler"

describe("Scheduler", () => {
  describe("shouldExecute", () => {
    test("returns execute when threshold exceeded", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session",
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 70,
        inputTokens: 700000,
      }

      expect(scheduler.shouldExecute(sessionMeta, contextUsage)).toBe("execute")
    })

    test("returns defer when threshold not exceeded and TTL not expired", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 50,
        inputTokens: 500000,
      }

      expect(scheduler.shouldExecute(sessionMeta, contextUsage)).toBe("defer")
    })

    test("returns execute when TTL expired even if threshold not exceeded", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 50,
        inputTokens: 500000,
      }

      expect(scheduler.shouldExecute(sessionMeta, contextUsage)).toBe("execute")
    })

    test("returns defer when no session metadata", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const contextUsage: ContextUsage = {
        percentage: 50,
        inputTokens: 500000,
      }

      expect(scheduler.shouldExecute(null, contextUsage)).toBe("defer")
    })
  })

  describe("threshold management", () => {
    test("uses default threshold of 65%", () => {
      const scheduler = createScheduler()
      expect(scheduler.getExecuteThreshold()).toBe(65)
    })

    test("uses custom threshold", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 75 })
      expect(scheduler.getExecuteThreshold()).toBe(75)
    })

    test("allows updating threshold", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      scheduler.setExecuteThreshold(80)
      expect(scheduler.getExecuteThreshold()).toBe(80)
    })
  })
})
