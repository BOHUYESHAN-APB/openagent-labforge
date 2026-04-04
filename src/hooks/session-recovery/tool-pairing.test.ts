import { describe, expect, test } from "bun:test"

import {
  collectMissingToolUseIds,
  collectMissingToolUses,
  collectToolResultUseIds,
} from "./tool-pairing"

describe("tool-pairing", () => {
  test("collectMissingToolUseIds returns unpaired tool_use ids only", () => {
    //#given
    const parts = [
      { type: "tool_use", id: "u1", name: "read" },
      { type: "tool_use", id: "u2", name: "bash" },
      { type: "tool_result", tool_use_id: "u1" },
    ]

    //#when
    const missing = collectMissingToolUseIds(parts)

    //#then
    expect(missing).toEqual(["u2"])
  })

  test("supports legacy tool type alias mapped to tool_use", () => {
    //#given
    const parts = [
      { type: "tool", id: "legacy-1", name: "read" },
      { type: "tool_result", tool_use_id: "legacy-1" },
      { type: "tool", id: "legacy-2", name: "edit" },
    ]

    //#when
    const missing = collectMissingToolUseIds(parts)

    //#then
    expect(missing).toEqual(["legacy-2"])
  })

  test("collectMissingToolUses returns full unpaired parts for unavailable tool recovery", () => {
    //#given
    const parts = [
      { type: "tool_use", id: "u1", name: "missing_tool" },
      { type: "tool_use", id: "u2", name: "available_tool" },
      { type: "tool_result", tool_use_id: "u2" },
    ]

    //#when
    const missingUses = collectMissingToolUses(parts)

    //#then
    expect(missingUses.map((p) => p.id)).toEqual(["u1"])
    expect(missingUses[0]?.name).toBe("missing_tool")
  })

  test("collectToolResultUseIds deduplicates tool_result references", () => {
    //#given
    const parts = [
      { type: "tool_result", tool_use_id: "u1" },
      { type: "tool_result", tool_use_id: "u1" },
      { type: "tool_result", tool_use_id: "u2" },
    ]

    //#when
    const ids = collectToolResultUseIds(parts)

    //#then
    expect(Array.from(ids)).toEqual(["u1", "u2"])
  })
})
