import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import { createKeywordDetectorHook } from "./index"
import { _resetForTesting } from "../../features/claude-code-session-state"
import { ContextCollector } from "../../features/context-injector"
import * as sharedModule from "../../shared"

describe("keyword-detector undo/replay scenarios", () => {
  let logCalls: Array<{ msg: string; data?: unknown }>
  let logSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    _resetForTesting()
    logCalls = []
    logSpy = spyOn(sharedModule, "log").mockImplementation((msg: string, data?: unknown) => {
      logCalls.push({ msg, data })
    })
  })

  afterEach(() => {
    logSpy?.mockRestore()
    _resetForTesting()
  })

  function createMockPluginInput() {
    return {
      client: {
        tui: {
          showToast: async () => {},
        },
      },
    } as any
  }

  test("should remove paste placeholder and prevent duplicate injection on undo", async () => {
    // Scenario: User pastes content, keyword is detected, then user undos
    const collector = new ContextCollector()
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector)
    const sessionID = "undo-test-session"

    // First submission: user pastes content with search keyword
    const firstOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "[Pasted ~4 lines]\n\nsearch for the bug" }],
    }

    await hook["chat.message"]({ sessionID }, firstOutput)

    // Verify: paste placeholder removed, search mode injected
    const firstTextPart = firstOutput.parts.find(p => p.type === "text")
    expect(firstTextPart).toBeDefined()
    expect(firstTextPart!.text).not.toContain("[Pasted")
    expect(firstTextPart!.text).toContain("[search-mode]")
    expect(firstTextPart!.text).toContain("for the bug")

    // User undos: the injected content comes back in the input
    const undoOutput = {
      message: {} as Record<string, unknown>,
      parts: [{
        type: "text",
        text: `[search-mode]
MAXIMIZE SEARCH EFFORT.

---

[Pasted ~4 lines]

search for the bug`
      }],
    }

    await hook["chat.message"]({ sessionID }, undoOutput)

    // Verify: both paste placeholder and stale injection removed, no duplicate injection
    const undoTextPart = undoOutput.parts.find(p => p.type === "text")
    expect(undoTextPart).toBeDefined()
    expect(undoTextPart!.text).not.toContain("[Pasted")
    expect(undoTextPart!.text).toBe("search for the bug")

    // Check logs for duplicate detection
    const duplicateLog = logCalls.find(c =>
      c.msg.includes("Skipping duplicate message processing")
    )
    expect(duplicateLog).toBeDefined()
  })

  test("should handle undo with multiple mode injections", async () => {
    const collector = new ContextCollector()
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector)
    const sessionID = "multi-mode-undo"

    // First: analyze mode
    const firstOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "analyze this code" }],
    }

    await hook["chat.message"]({ sessionID }, firstOutput)

    const firstText = firstOutput.parts[0].text
    expect(firstText).toContain("[analyze-mode]")

    // User undos and changes to search
    const secondOutput = {
      message: {} as Record<string, unknown>,
      parts: [{
        type: "text",
        text: `[analyze-mode]
ANALYSIS MODE.

---

search for the file`
      }],
    }

    await hook["chat.message"]({ sessionID }, secondOutput)

    // Should strip old analyze-mode and inject search-mode
    const secondText = secondOutput.parts[0].text
    expect(secondText).not.toContain("[analyze-mode]")
    expect(secondText).toContain("[search-mode]")
    expect(secondText).toContain("for the file")
  })

  test("should handle undo when user removes keyword", async () => {
    const collector = new ContextCollector()
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector)
    const sessionID = "remove-keyword-undo"

    // First: with keyword
    const firstOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "search for the bug" }],
    }

    await hook["chat.message"]({ sessionID }, firstOutput)

    expect(firstOutput.parts[0].text).toContain("[search-mode]")

    // User undos and removes keyword
    const secondOutput = {
      message: {} as Record<string, unknown>,
      parts: [{
        type: "text",
        text: `[search-mode]
MAXIMIZE SEARCH EFFORT.

---

just a normal message`
      }],
    }

    await hook["chat.message"]({ sessionID }, secondOutput)

    // Should strip old injection and NOT inject new one
    const secondText = secondOutput.parts[0].text
    expect(secondText).toBe("just a normal message")
    expect(secondText).not.toContain("[search-mode]")
  })

  test("should handle ultrawork autonomous mode undo", async () => {
    const collector = new ContextCollector()
    const hook = createKeywordDetectorHook(createMockPluginInput(), collector)
    const sessionID = "ultrawork-auto-undo"

    // First: ultrawork auto
    const firstOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "ultrawork auto finish this" }],
    }

    await hook["chat.message"]({ sessionID }, firstOutput)

    const firstText = firstOutput.parts[0].text
    expect(firstText).toContain("<ultrawork-mode>")
    expect(firstText).toContain("[ultrawork-autonomous-mode]")

    // User undos
    const secondOutput = {
      message: {} as Record<string, unknown>,
      parts: [{
        type: "text",
        text: `<ultrawork-mode>
YOU MUST LEVERAGE ALL AVAILABLE AGENTS

[ultrawork-autonomous-mode]
AUTONOMOUS EXECUTION ENABLED.

---

ultrawork auto finish this`
      }],
    }

    await hook["chat.message"]({ sessionID }, secondOutput)

    // Should detect duplicate and skip
    const duplicateLog = logCalls.find(c =>
      c.msg.includes("Skipping duplicate message processing")
    )
    expect(duplicateLog).toBeDefined()
  })
})
