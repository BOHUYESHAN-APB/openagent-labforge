import { describe, expect, test } from "bun:test"
import { extractPromptText, stripInjectedKeywordPrelude } from "./detector"

describe("paste placeholder removal", () => {
  test("should remove [Pasted ~4 lines] placeholder from prompt text", () => {
    const parts = [
      { type: "text", text: "[Pasted ~4 lines]\n\nActual user message here" },
    ]

    const result = extractPromptText(parts)

    expect(result).toBe("Actual user message here")
    expect(result).not.toContain("[Pasted")
  })

  test("should remove [Pasted 10 lines] placeholder without tilde", () => {
    const parts = [
      { type: "text", text: "[Pasted 10 lines]\n\nUser content" },
    ]

    const result = extractPromptText(parts)

    expect(result).toBe("User content")
  })

  test("should handle multiple paste placeholders", () => {
    const parts = [
      { type: "text", text: "[Pasted ~3 lines] First part [Pasted 5 lines] Second part" },
    ]

    const result = extractPromptText(parts)

    expect(result).toBe("First part Second part")
    expect(result).not.toContain("[Pasted")
  })

  test("should handle case-insensitive paste placeholders", () => {
    const parts = [
      { type: "text", text: "[pasted ~2 LINES]\n\nContent" },
    ]

    const result = extractPromptText(parts)

    expect(result).toBe("Content")
  })

  test("should not affect normal text with similar patterns", () => {
    const parts = [
      { type: "text", text: "I pasted some code with 4 lines" },
    ]

    const result = extractPromptText(parts)

    expect(result).toBe("I pasted some code with 4 lines")
  })
})

describe("stripInjectedKeywordPrelude with paste placeholders", () => {
  test("should remove paste placeholder before stripping keyword prelude", () => {
    const text = "[Pasted ~3 lines]\n\n[analyze-mode]\nANALYSIS MODE.\n\n---\n\nActual message"

    const result = stripInjectedKeywordPrelude(text)

    expect(result).toBe("Actual message")
    expect(result).not.toContain("[Pasted")
    expect(result).not.toContain("[analyze-mode]")
  })

  test("should handle paste placeholder without keyword prelude", () => {
    const text = "[Pasted ~5 lines]\n\nJust a normal message"

    const result = stripInjectedKeywordPrelude(text)

    expect(result).toBe("Just a normal message")
  })

  test("should handle keyword prelude without paste placeholder", () => {
    const text = "[search-mode]\nSEARCH MODE.\n\n---\n\nFind the bug"

    const result = stripInjectedKeywordPrelude(text)

    expect(result).toBe("Find the bug")
  })
})
