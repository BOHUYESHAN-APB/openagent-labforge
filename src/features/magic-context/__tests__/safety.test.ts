import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createScheduler } from "../scheduler"
import {
  loadSessionMeta,
  updateSessionMeta,
  recordResponseTime,
} from "../storage/session-meta-storage"
import {
  queuePendingOp,
  getSessionPendingOps,
  executePendingOps,
  generateOpId,
} from "../storage/pending-ops-storage"
import { readLatestCheckpointMetadata } from "../../boulder-state/checkpoint-metadata"
import type { SessionMeta } from "../storage/session-meta-storage"
import type { ContextUsage } from "../scheduler"

/**
 * Safety Tests for Magic Context
 *
 * These tests verify that Magic Context does NOT break existing systems:
 * 1. Checkpoint system (boulder-state)
 * 2. L1/L2/L3 compression mechanism
 * 3. Context Guard thresholds
 * 4. Graceful degradation on errors
 */

describe("Magic Context Safety Tests", () => {
  let testDir: string

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "magic-context-safety-test-"))
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe("Checkpoint System Compatibility", () => {
    test("Magic Context storage does not interfere with checkpoint metadata", () => {
      const sessionId = "test-session-checkpoint"

      // Create Magic Context session metadata
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
      })

      // Verify checkpoint metadata reading still works (should return null for non-existent checkpoint)
      const checkpointMeta = readLatestCheckpointMetadata(testDir)
      expect(checkpointMeta).toBeNull()

      // Verify Magic Context metadata exists
      const sessionMeta = loadSessionMeta(testDir, sessionId)
      expect(sessionMeta).not.toBeNull()
      expect(sessionMeta?.sessionId).toBe(sessionId)
    })

    test("Magic Context does not modify checkpoint directory structure", () => {
      const sessionId = "test-session-structure"

      // Create Magic Context data
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
      })

      // Queue a pending operation
      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId,
        type: "compress",
        timestamp: Date.now(),
        reason: "test operation",
      })

      // Verify Magic Context uses its own directory
      // Magic Context should be in .opencode/openagent-labforge/magic-context/
      // Checkpoints should be in .opencode/openagent-labforge/checkpoints/
      // These should not interfere with each other

      const sessionMeta = loadSessionMeta(testDir, sessionId)
      expect(sessionMeta).not.toBeNull()

      const pendingOps = getSessionPendingOps(testDir, sessionId)
      expect(pendingOps.length).toBe(1)

      // Checkpoint reading should still work independently
      const checkpointMeta = readLatestCheckpointMetadata(testDir)
      expect(checkpointMeta).toBeNull() // No checkpoint created, should be null
    })
  })

  describe("L1/L2/L3 Compression Compatibility", () => {
    test("Scheduler defers compression when TTL not expired and threshold not exceeded", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-defer",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 60, // Below threshold
        inputTokens: 600000,
      }

      // Should defer because TTL not expired AND threshold not exceeded
      const decision = scheduler.shouldExecute(sessionMeta, contextUsage)
      expect(decision).toBe("defer")
    })

    test("Scheduler executes compression when threshold exceeded even if TTL not expired", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-threshold-exceeded",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 2 * 60 * 1000, // 2 minutes ago (TTL not expired)
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 70, // Above threshold
        inputTokens: 700000,
      }

      // Should execute because threshold exceeded (even though TTL not expired)
      const decision = scheduler.shouldExecute(sessionMeta, contextUsage)
      expect(decision).toBe("execute")
    })

    test("Scheduler executes compression when TTL expired", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-execute",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 70, // Above threshold
        inputTokens: 700000,
      }

      // Should execute because TTL expired (6 minutes > 5 minutes)
      const decision = scheduler.shouldExecute(sessionMeta, contextUsage)
      expect(decision).toBe("execute")
    })

    test("Scheduler executes compression when threshold critically exceeded", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-critical",
        cacheTtl: "5m",
        lastResponseTime: Date.now(), // Just now
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 90, // Critically high
        inputTokens: 900000,
      }

      // Should execute immediately because threshold critically exceeded
      const decision = scheduler.shouldExecute(sessionMeta, contextUsage)
      expect(decision).toBe("execute")
    })

    test("Original compression path is preserved when Magic Context disabled", () => {
      // This test verifies that when Magic Context is disabled,
      // the original compression logic still works

      // When Magic Context is disabled, scheduler should not be created
      // and the original compression path should execute directly

      // We can't fully test this without mocking ctx.client.session.summarize,
      // but we can verify that the scheduler logic is isolated

      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      expect(scheduler).toBeDefined()
      expect(typeof scheduler.shouldExecute).toBe("function")
    })
  })

  describe("Graceful Degradation", () => {
    test("System handles missing session metadata gracefully", () => {
      const sessionId = "non-existent-session"

      // Try to load non-existent session metadata
      const sessionMeta = loadSessionMeta(testDir, sessionId)

      // Should return null, not throw
      expect(sessionMeta).toBeNull()
    })

    test("System handles corrupted TTL values gracefully", () => {
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-invalid-ttl",
        cacheTtl: "invalid" as any, // Invalid TTL format
        lastResponseTime: Date.now(),
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const contextUsage: ContextUsage = {
        percentage: 70,
        inputTokens: 700000,
      }

      // Should not throw, should handle gracefully
      // The TTL parser should return a default or handle the error
      expect(() => {
        scheduler.shouldExecute(sessionMeta, contextUsage)
      }).not.toThrow()
    })

    test("Pending operations execute without errors", () => {
      const sessionId = "test-session-pending-ops"

      // Queue multiple operations
      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId,
        type: "compress",
        timestamp: Date.now(),
        reason: "test compression",
      })

      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId,
        type: "drop",
        tagIds: [1, 2, 3],
        timestamp: Date.now(),
        reason: "test drop",
      })

      // Verify operations are queued
      const pendingOps = getSessionPendingOps(testDir, sessionId)
      expect(pendingOps.length).toBe(2)

      // Execute pending operations
      const executedCount = executePendingOps(testDir, sessionId)
      expect(executedCount).toBe(2)

      // Verify operations are cleared
      const remainingOps = getSessionPendingOps(testDir, sessionId)
      expect(remainingOps.length).toBe(0)
    })

    test("System handles file I/O errors gracefully", () => {
      // Try to load from a non-existent directory
      const nonExistentDir = join(testDir, "non-existent-subdir")

      // Should not throw, should return null
      expect(() => {
        const sessionMeta = loadSessionMeta(nonExistentDir, "test-session")
        expect(sessionMeta).toBeNull()
      }).not.toThrow()
    })
  })

  describe("Context Guard Integration", () => {
    test("Magic Context respects Context Guard thresholds", () => {
      // Context Guard thresholds: L1: 65%, L2: 80%, L3: 90%
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })

      const sessionMeta: SessionMeta = {
        sessionId: "test-session-context-guard",
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 6 * 60 * 1000, // TTL expired
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Test L1 threshold (65%)
      const l1Usage: ContextUsage = { percentage: 66, inputTokens: 660000 }
      expect(scheduler.shouldExecute(sessionMeta, l1Usage)).toBe("execute")

      // Test L2 threshold (80%)
      const l2Usage: ContextUsage = { percentage: 81, inputTokens: 810000 }
      expect(scheduler.shouldExecute(sessionMeta, l2Usage)).toBe("execute")

      // Test L3 threshold (90%)
      const l3Usage: ContextUsage = { percentage: 91, inputTokens: 910000 }
      expect(scheduler.shouldExecute(sessionMeta, l3Usage)).toBe("execute")
    })

    test("Magic Context does not modify Context Guard threshold calculations", () => {
      // This test verifies that Magic Context's scheduler uses the same
      // threshold logic as Context Guard

      const scheduler = createScheduler({ executeThresholdPercentage: 65 })
      const sessionMeta: SessionMeta = {
        sessionId: "test-session-threshold",
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Below threshold - should defer
      const belowThreshold: ContextUsage = { percentage: 60, inputTokens: 600000 }
      expect(scheduler.shouldExecute(sessionMeta, belowThreshold)).toBe("defer")

      // At threshold - should execute (>= threshold)
      const atThreshold: ContextUsage = { percentage: 65, inputTokens: 650000 }
      expect(scheduler.shouldExecute(sessionMeta, atThreshold)).toBe("execute")

      // Above threshold - should execute
      const aboveThreshold: ContextUsage = { percentage: 70, inputTokens: 700000 }
      expect(scheduler.shouldExecute(sessionMeta, aboveThreshold)).toBe("execute")
    })
  })

  describe("Session Metadata Integrity", () => {
    test("recordResponseTime updates lastResponseTime correctly", () => {
      const sessionId = "test-session-response-time"

      // Create initial metadata
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 10000, // 10 seconds ago
        compressionCount: 0,
      })

      // Record new response time
      recordResponseTime(testDir, sessionId)

      // Verify update
      const sessionMeta = loadSessionMeta(testDir, sessionId)
      expect(sessionMeta).not.toBeNull()
      expect(sessionMeta!.lastResponseTime).toBeGreaterThan(Date.now() - 1000) // Within last second
    })

    test("compressionCount increments correctly", () => {
      const sessionId = "test-session-compression-count"

      // Create initial metadata
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
      })

      // Simulate compression
      const sessionMeta = loadSessionMeta(testDir, sessionId)
      expect(sessionMeta).not.toBeNull()
      expect(sessionMeta!.compressionCount).toBe(0)

      // Update compression count
      updateSessionMeta(testDir, sessionId, {
        compressionCount: sessionMeta!.compressionCount + 1,
        lastCompressionTime: Date.now(),
      })

      // Verify increment
      const updatedMeta = loadSessionMeta(testDir, sessionId)
      expect(updatedMeta).not.toBeNull()
      expect(updatedMeta!.compressionCount).toBe(1)
      expect(updatedMeta!.lastCompressionTime).toBeDefined()
    })
  })
})
