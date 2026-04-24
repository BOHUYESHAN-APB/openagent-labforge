import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  writeMemory,
  listMemories,
  updateMemory,
  deleteMemory,
  searchMemories,
  recordMemoryRetrieval,
} from "../storage/memory-storage"

describe("memory-storage", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "memory-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("writeMemory creates new memory", () => {
    const memory = writeMemory(tempDir, "session-1", {
      category: "ARCHITECTURE_DECISIONS",
      content: "We decided to use JSON storage instead of SQLite",
    })

    expect(memory.id).toBe(1)
    expect(memory.category).toBe("ARCHITECTURE_DECISIONS")
    expect(memory.content).toBe("We decided to use JSON storage instead of SQLite")
    expect(memory.status).toBe("active")
    expect(memory.seenCount).toBe(1)
    expect(memory.retrievalCount).toBe(0)
  })

  test("writeMemory deduplicates identical content", () => {
    const m1 = writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Use tool.schema instead of importing zod",
    })

    const m2 = writeMemory(tempDir, "session-2", {
      category: "PATTERNS",
      content: "Use tool.schema instead of importing zod",
    })

    expect(m1.id).toBe(m2.id)
    expect(m2.seenCount).toBe(2)
  })

  test("listMemories returns all memories", () => {
    writeMemory(tempDir, "session-1", {
      category: "ARCHITECTURE_DECISIONS",
      content: "Memory 1",
    })

    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Memory 2",
    })

    const memories = listMemories(tempDir)

    expect(memories).toHaveLength(2)
  })

  test("listMemories filters by category", () => {
    writeMemory(tempDir, "session-1", {
      category: "ARCHITECTURE_DECISIONS",
      content: "Memory 1",
    })

    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Memory 2",
    })

    const filtered = listMemories(tempDir, { category: "PATTERNS" })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].category).toBe("PATTERNS")
  })

  test("listMemories filters by status", () => {
    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Memory 1",
      status: "active",
    })

    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Memory 2",
      status: "permanent",
    })

    const filtered = listMemories(tempDir, { status: "permanent" })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].status).toBe("permanent")
  })

  test("updateMemory modifies existing memory", () => {
    const memory = writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Original content",
    })

    const updated = updateMemory(tempDir, memory.id, {
      content: "Updated content",
      status: "permanent",
    })

    expect(updated).not.toBeNull()
    expect(updated!.content).toBe("Updated content")
    expect(updated!.status).toBe("permanent")
  })

  test("updateMemory returns null for non-existent memory", () => {
    const updated = updateMemory(tempDir, 999, {
      content: "New content",
    })

    expect(updated).toBeNull()
  })

  test("deleteMemory removes memory", () => {
    const memory = writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "To be deleted",
    })

    const deleted = deleteMemory(tempDir, memory.id)

    expect(deleted).toBe(true)

    const memories = listMemories(tempDir)
    expect(memories).toHaveLength(0)
  })

  test("deleteMemory returns false for non-existent memory", () => {
    const deleted = deleteMemory(tempDir, 999)

    expect(deleted).toBe(false)
  })

  test("searchMemories finds matching content", () => {
    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Use tool.schema for zod schemas",
    })

    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Use atomic writes for file storage",
    })

    const results = searchMemories(tempDir, "tool.schema")

    expect(results).toHaveLength(1)
    expect(results[0].content).toContain("tool.schema")
  })

  test("searchMemories is case-insensitive", () => {
    writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Use TypeScript for type safety",
    })

    const results = searchMemories(tempDir, "typescript")

    expect(results).toHaveLength(1)
  })

  test("recordMemoryRetrieval increments retrieval count", () => {
    const memory = writeMemory(tempDir, "session-1", {
      category: "PATTERNS",
      content: "Test memory",
    })

    expect(memory.retrievalCount).toBe(0)

    recordMemoryRetrieval(tempDir, memory.id)

    const memories = listMemories(tempDir)
    expect(memories[0].retrievalCount).toBe(1)
  })
})
