import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  addCompartment,
  getSessionCompartments,
  getCompartmentsByTagRange,
  deleteCompartmentsByTagRange,
} from "../storage/compartments-storage"

describe("compartments-storage", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "compartments-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  test("addCompartment creates new compartment with auto-incrementing sequence", () => {
    const sessionId = "test-session"

    const c1 = addCompartment(tempDir, sessionId, {
      startTag: 1,
      endTag: 10,
      title: "First compartment",
      content: "Summary of messages 1-10",
    })

    expect(c1.sequence).toBe(1)
    expect(c1.startTag).toBe(1)
    expect(c1.endTag).toBe(10)
    expect(c1.title).toBe("First compartment")
    expect(c1.byteSize).toBeGreaterThan(0)
    expect(c1.createdAt).toBeGreaterThan(0)

    const c2 = addCompartment(tempDir, sessionId, {
      startTag: 11,
      endTag: 20,
      title: "Second compartment",
      content: "Summary of messages 11-20",
    })

    expect(c2.sequence).toBe(2)
  })

  test("getSessionCompartments returns all compartments sorted by sequence", () => {
    const sessionId = "test-session"

    addCompartment(tempDir, sessionId, {
      startTag: 1,
      endTag: 10,
      title: "First",
      content: "Content 1",
    })

    addCompartment(tempDir, sessionId, {
      startTag: 11,
      endTag: 20,
      title: "Second",
      content: "Content 2",
    })

    const compartments = getSessionCompartments(tempDir, sessionId)

    expect(compartments).toHaveLength(2)
    expect(compartments[0].sequence).toBe(1)
    expect(compartments[1].sequence).toBe(2)
  })

  test("getCompartmentsByTagRange filters by tag range", () => {
    const sessionId = "test-session"

    addCompartment(tempDir, sessionId, {
      startTag: 1,
      endTag: 10,
      title: "First",
      content: "Content 1",
    })

    addCompartment(tempDir, sessionId, {
      startTag: 11,
      endTag: 20,
      title: "Second",
      content: "Content 2",
    })

    addCompartment(tempDir, sessionId, {
      startTag: 21,
      endTag: 30,
      title: "Third",
      content: "Content 3",
    })

    // Range 5-25 overlaps with all three compartments
    const inRange = getCompartmentsByTagRange(tempDir, sessionId, 5, 25)

    expect(inRange).toHaveLength(3)
    expect(inRange[0].startTag).toBe(1)
    expect(inRange[1].startTag).toBe(11)
    expect(inRange[2].startTag).toBe(21)
  })

  test("deleteCompartmentsByTagRange removes compartments in range", () => {
    const sessionId = "test-session"

    addCompartment(tempDir, sessionId, {
      startTag: 1,
      endTag: 10,
      title: "First",
      content: "Content 1",
    })

    addCompartment(tempDir, sessionId, {
      startTag: 11,
      endTag: 20,
      title: "Second",
      content: "Content 2",
    })

    addCompartment(tempDir, sessionId, {
      startTag: 21,
      endTag: 30,
      title: "Third",
      content: "Content 3",
    })

    // Range 5-25 overlaps with all three compartments
    const deleted = deleteCompartmentsByTagRange(tempDir, sessionId, 5, 25)

    expect(deleted).toBe(3)

    const remaining = getSessionCompartments(tempDir, sessionId)
    expect(remaining).toHaveLength(0)
  })

  test("getSessionCompartments returns empty array for non-existent session", () => {
    const compartments = getSessionCompartments(tempDir, "non-existent")
    expect(compartments).toEqual([])
  })
})
