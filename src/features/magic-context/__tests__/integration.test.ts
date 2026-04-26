import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createScheduler } from "../scheduler"
import {
  loadSessionMeta,
  updateSessionMeta,
  recordResponseTime,
  recordCompression,
} from "../storage/session-meta-storage"
import {
  addTag,
  getSessionTags,
  updateTagStatus,
  getProtectedTags,
} from "../storage/tags-storage"
import {
  queuePendingOp,
  getSessionPendingOps,
  executePendingOps,
  generateOpId,
} from "../storage/pending-ops-storage"
import {
  addCompartment,
  getSessionCompartments,
} from "../storage/compartments-storage"
import {
  writeMemory,
  listMemories,
  searchMemories,
  updateMemory,
  deleteMemory,
} from "../storage/memory-storage"
import type { SessionMeta } from "../storage/session-meta-storage"
import type { ContextUsage } from "../scheduler"

/**
 * Integration Tests for Magic Context
 *
 * These tests verify that Magic Context features work correctly end-to-end:
 * 1. TTL-aware compression flow
 * 2. Tag system
 * 3. Memory persistence
 * 4. Pending operations
 */

describe("Magic Context Integration Tests", () => {
  let testDir: string

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "magic-context-integration-test-"))
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe("TTL-Aware Compression Flow", () => {
    test("Complete compression flow with TTL tracking", () => {
      const sessionId = "test-session-compression-flow"
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })

      // Step 1: Create session metadata
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        compressionCount: 0,
      })

      // Step 2: Check if compression should execute (below threshold, TTL not expired)
      let sessionMeta = loadSessionMeta(testDir, sessionId)
      const lowUsage: ContextUsage = { percentage: 50, inputTokens: 500000 }
      expect(scheduler.shouldExecute(sessionMeta, lowUsage)).toBe("defer")

      // Step 3: Simulate high usage (above threshold)
      const highUsage: ContextUsage = { percentage: 70, inputTokens: 700000 }
      expect(scheduler.shouldExecute(sessionMeta, highUsage)).toBe("execute")

      // Step 4: Record compression
      recordCompression(testDir, sessionId)

      // Step 5: Verify compression was recorded
      sessionMeta = loadSessionMeta(testDir, sessionId)
      expect(sessionMeta!.compressionCount).toBe(1)
      expect(sessionMeta!.lastCompressionTime).toBeDefined()
    })

    test("TTL expiry triggers compression even with low usage", () => {
      const sessionId = "test-session-ttl-expiry"
      const scheduler = createScheduler({ executeThresholdPercentage: 65 })

      // Create session metadata with expired TTL
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now() - 6 * 60 * 1000, // 6 minutes ago (expired)
        compressionCount: 0,
      })

      // Even with low usage, should execute because TTL expired
      const sessionMeta = loadSessionMeta(testDir, sessionId)
      const lowUsage: ContextUsage = { percentage: 50, inputTokens: 500000 }
      expect(scheduler.shouldExecute(sessionMeta, lowUsage)).toBe("execute")
    })

    test("Multiple compressions increment counter correctly", () => {
      const sessionId = "test-session-multiple-compressions"

      // Create initial metadata
      updateSessionMeta(testDir, sessionId, {
        cacheTtl: "5m",
        lastResponseTime: Date.now(),
        compressionCount: 0,
      })

      // Perform multiple compressions
      for (let i = 1; i <= 5; i++) {
        recordCompression(testDir, sessionId)
        const sessionMeta = loadSessionMeta(testDir, sessionId)
        expect(sessionMeta!.compressionCount).toBe(i)
      }
    })
  })

  describe("Tag System", () => {
    test("Tags are created and tracked correctly", () => {
      const sessionId = "test-session-tags"

      // Add tags
      addTag(testDir, {
        tagNumber: 1,
        sessionId,
        messageType: "message",
        byteSize: 1000,
        status: "active",
        createdAt: Date.now(),
      })

      addTag(testDir, {
        tagNumber: 2,
        sessionId,
        messageType: "tool",
        byteSize: 2000,
        status: "active",
        createdAt: Date.now(),
      })

      // Verify tags
      const tags = getSessionTags(testDir, sessionId)
      expect(tags.length).toBe(2)
      expect(tags[0].tagNumber).toBe(1)
      expect(tags[1].tagNumber).toBe(2)
    })

    test("Tag status updates work correctly", () => {
      const sessionId = "test-session-tag-status"

      // Add tag
      addTag(testDir, {
        tagNumber: 1,
        sessionId,
        messageType: "message",
        byteSize: 1000,
        status: "active",
        createdAt: Date.now(),
      })

      // Update status to dropped
      updateTagStatus(testDir, sessionId, 1, "dropped")

      // Verify status
      const tags = getSessionTags(testDir, sessionId)
      expect(tags[0].status).toBe("dropped")

      // Update status to compacted
      updateTagStatus(testDir, sessionId, 1, "compacted")

      // Verify status
      const updatedTags = getSessionTags(testDir, sessionId)
      expect(updatedTags[0].status).toBe("compacted")
    })

    test("Protected tags are identified correctly", () => {
      const sessionId = "test-session-protected-tags"

      // Add 25 tags
      for (let i = 1; i <= 25; i++) {
        addTag(testDir, {
          tagNumber: i,
          sessionId,
          messageType: "message",
          byteSize: 1000,
          status: "active",
          createdAt: Date.now(),
        })
      }

      // Get protected tags (last 20)
      const protectedTagNumbers = getProtectedTags(testDir, sessionId, 20)
      expect(protectedTagNumbers.length).toBe(20)
      // Protected tags should be the highest tag numbers
      expect(protectedTagNumbers).toContain(25)
      expect(protectedTagNumbers).toContain(6)
    })

    test("Tag filtering by status works correctly", () => {
      const sessionId = "test-session-tag-filtering"

      // Add tags with different statuses
      addTag(testDir, {
        tagNumber: 1,
        sessionId,
        messageType: "message",
        byteSize: 1000,
        status: "active",
        createdAt: Date.now(),
      })

      addTag(testDir, {
        tagNumber: 2,
        sessionId,
        messageType: "message",
        byteSize: 1000,
        status: "active",
        createdAt: Date.now(),
      })

      addTag(testDir, {
        tagNumber: 3,
        sessionId,
        messageType: "message",
        byteSize: 1000,
        status: "active",
        createdAt: Date.now(),
      })

      // Update statuses
      updateTagStatus(testDir, sessionId, 2, "dropped")
      updateTagStatus(testDir, sessionId, 3, "compacted")

      // Get all tags
      const allTags = getSessionTags(testDir, sessionId)
      expect(allTags.length).toBe(3)

      // Filter by status
      const activeTags = allTags.filter(t => t.status === "active")
      const droppedTags = allTags.filter(t => t.status === "dropped")
      const compactedTags = allTags.filter(t => t.status === "compacted")

      expect(activeTags.length).toBe(1)
      expect(droppedTags.length).toBe(1)
      expect(compactedTags.length).toBe(1)
    })
  })

  describe("Memory Persistence", () => {
    test("Memories are written and retrieved correctly", () => {
      const sessionId = "test-session-memory"

      const memory1 = writeMemory(testDir, sessionId, {
        category: "ARCHITECTURE_DECISIONS",
        content: "We use JSON storage instead of SQLite for simplicity",
      })

      const memory2 = writeMemory(testDir, sessionId, {
        category: "PATTERNS",
        content: "Use atomic writes with temp + rename pattern",
      })

      // List all memories
      const memories = listMemories(testDir, { status: "active" })
      expect(memories.length).toBe(2)

      // Verify both memories exist (order may vary)
      const memoryIds = memories.map(m => m.id)
      expect(memoryIds).toContain(memory1.id)
      expect(memoryIds).toContain(memory2.id)
    })

    test("Memory deduplication works correctly", () => {
      const sessionId = "test-session-dedup"
      const content = "This is a duplicate memory"

      // Write same content twice
      const memory1 = writeMemory(testDir, sessionId, {
        category: "OTHER",
        content,
      })

      const memory2 = writeMemory(testDir, sessionId, {
        category: "OTHER",
        content,
      })

      // Should be the same memory (deduplicated)
      expect(memory1.id).toBe(memory2.id)

      // Should only have one memory
      const memories = listMemories(testDir, { status: "active" })
      expect(memories.length).toBe(1)
    })

    test("Memory search works correctly", () => {
      const sessionId = "test-session-search"

      writeMemory(testDir, sessionId, {
        category: "ARCHITECTURE_DECISIONS",
        content: "We use JSON storage for configuration",
      })

      writeMemory(testDir, sessionId, {
        category: "PATTERNS",
        content: "Use TypeScript for type safety",
      })

      writeMemory(testDir, sessionId, {
        category: "BUGS_FIXED",
        content: "Fixed JSON parsing error in config loader",
      })

      // Search for "JSON"
      const jsonMemories = searchMemories(testDir, "JSON")
      expect(jsonMemories.length).toBe(2)

      // Search for "TypeScript"
      const tsMemories = searchMemories(testDir, "TypeScript")
      expect(tsMemories.length).toBe(1)

      // Search by category
      const archMemories = listMemories(testDir, {
        status: "active",
        category: "ARCHITECTURE_DECISIONS",
      })
      expect(archMemories.length).toBe(1)
    })

    test("Memory update and delete work correctly", () => {
      const sessionId = "test-session-update"

      const memory = writeMemory(testDir, sessionId, {
        category: "OTHER",
        content: "Original content",
      })

      // Update memory
      updateMemory(testDir, memory.id, {
        content: "Updated content",
      })

      // Verify update
      const memories = listMemories(testDir, { status: "active" })
      expect(memories[0].content).toBe("Updated content")

      // Delete memory
      deleteMemory(testDir, memory.id)

      // Verify deletion
      const remainingMemories = listMemories(testDir, { status: "active" })
      expect(remainingMemories.length).toBe(0)
    })
  })

  describe("Pending Operations", () => {
    test("Operations are queued and executed correctly", () => {
      const sessionId = "test-session-pending-ops"

      // Queue operations
      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId,
        type: "compress",
        timestamp: Date.now(),
        reason: "High context usage",
      })

      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId,
        type: "drop",
        tagIds: [1, 2, 3],
        timestamp: Date.now(),
        reason: "Remove old messages",
      })

      // Verify operations are queued
      const pendingOps = getSessionPendingOps(testDir, sessionId)
      expect(pendingOps.length).toBe(2)
      expect(pendingOps[0].type).toBe("compress")
      expect(pendingOps[1].type).toBe("drop")

      // Execute operations
      const executedCount = executePendingOps(testDir, sessionId)
      expect(executedCount).toBe(2)

      // Verify operations are cleared
      const remainingOps = getSessionPendingOps(testDir, sessionId)
      expect(remainingOps.length).toBe(0)
    })

    test("Operations are isolated by session", () => {
      const session1 = "test-session-1"
      const session2 = "test-session-2"

      // Queue operations for session 1
      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId: session1,
        type: "compress",
        timestamp: Date.now(),
        reason: "Session 1 compression",
      })

      // Queue operations for session 2
      queuePendingOp(testDir, {
        id: generateOpId(),
        sessionId: session2,
        type: "compress",
        timestamp: Date.now(),
        reason: "Session 2 compression",
      })

      // Verify isolation
      const session1Ops = getSessionPendingOps(testDir, session1)
      const session2Ops = getSessionPendingOps(testDir, session2)

      expect(session1Ops.length).toBe(1)
      expect(session2Ops.length).toBe(1)
      expect(session1Ops[0].reason).toBe("Session 1 compression")
      expect(session2Ops[0].reason).toBe("Session 2 compression")

      // Execute session 1 operations
      executePendingOps(testDir, session1)

      // Verify session 2 operations are unaffected
      const session2OpsAfter = getSessionPendingOps(testDir, session2)
      expect(session2OpsAfter.length).toBe(1)
    })
  })

  describe("Compartments", () => {
    test("Compartments are created and retrieved correctly", () => {
      const sessionId = "test-session-compartments"

      // Add compartments
      addCompartment(testDir, sessionId, {
        startTag: 1,
        endTag: 10,
        title: "Initial conversation",
        summary: "User asked about Magic Context",
        content: "Full conversation content here...",
      })

      addCompartment(testDir, sessionId, {
        startTag: 11,
        endTag: 20,
        title: "Implementation discussion",
        summary: "Discussed TTL-aware compression",
        content: "More conversation content...",
      })

      // Verify compartments
      const compartments = getSessionCompartments(testDir, sessionId)
      expect(compartments.length).toBe(2)
      expect(compartments[0].sequence).toBe(1)
      expect(compartments[1].sequence).toBe(2)
    })

    test("Compartments are ordered by sequence", () => {
      const sessionId = "test-session-compartment-order"

      // Add compartments out of order
      addCompartment(testDir, sessionId, {
        startTag: 21,
        endTag: 30,
        title: "Third compartment",
        summary: "Third",
        content: "Third content",
      })

      addCompartment(testDir, sessionId, {
        startTag: 1,
        endTag: 10,
        title: "First compartment",
        summary: "First",
        content: "First content",
      })

      addCompartment(testDir, sessionId, {
        startTag: 11,
        endTag: 20,
        title: "Second compartment",
        summary: "Second",
        content: "Second content",
      })

      // Verify order
      const compartments = getSessionCompartments(testDir, sessionId)
      expect(compartments[0].sequence).toBe(1)
      expect(compartments[1].sequence).toBe(2)
      expect(compartments[2].sequence).toBe(3)
    })
  })
})
