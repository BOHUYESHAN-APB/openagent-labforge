import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import {
  applyUltraworkModelOverrideOnMessage,
  resolveUltraworkOverride,
  detectUltrawork,
} from "./ultrawork-model-override"
import * as sharedModule from "../shared"
import * as sessionStateModule from "../features/claude-code-session-state"

describe("detectUltrawork", () => {
  test("should detect ultrawork keyword", () => {
    expect(detectUltrawork("ultrawork do something")).toBe(true)
  })

  test("should detect ulw keyword", () => {
    expect(detectUltrawork("ulw fix the bug")).toBe(true)
  })

  test("should be case insensitive", () => {
    expect(detectUltrawork("ULTRAWORK do something")).toBe(true)
  })

  test("should not detect in code blocks", () => {
    const textWithCodeBlock = [
      "check this:",
      "```",
      "ultrawork mode",
      "```",
    ].join("\n")
    expect(detectUltrawork(textWithCodeBlock)).toBe(false)
  })

  test("should not detect in inline code", () => {
    expect(detectUltrawork("the `ultrawork` mode is cool")).toBe(false)
  })

  test("should not detect when keyword absent", () => {
    expect(detectUltrawork("just do something normal")).toBe(false)
  })
})

describe("resolveUltraworkOverride", () => {
  function createOutput(text: string, agentName?: string) {
    return {
      message: {
        ...(agentName ? { agent: agentName } : {}),
      } as Record<string, unknown>,
      parts: [{ type: "text", text }],
    }
  }

  function createConfig(agentName: string, ultrawork: { model?: string; variant?: string }) {
    return {
      agents: {
        [agentName]: { ultrawork },
      },
    } as unknown as Parameters<typeof resolveUltraworkOverride>[0]
  }

  test("should resolve override when ultrawork keyword detected", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6", variant: "max" })
  })

  test("should return null when no keyword detected", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("just do something normal")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when agent name is undefined", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output)

    //#then
    expect(result).toBeNull()
  })

  test("should use message.agent when input agent is undefined", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something", "sisyphus")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output)

    //#then
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6", variant: undefined })
  })

  test("should return null when agents config is missing", () => {
    //#given
    const config = {} as Parameters<typeof resolveUltraworkOverride>[0]
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should return null when agent has no ultrawork config", () => {
    //#given
    const config = {
      agents: { sisyphus: { model: "anthropic/claude-sonnet-4-6" } },
    } as unknown as Parameters<typeof resolveUltraworkOverride>[0]
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should resolve variant-only override when ultrawork.model is not set", () => {
    //#given
    const config = createConfig("sisyphus", { variant: "max" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toEqual({ variant: "max" })
  })

  test("should handle model string with multiple slashes", () => {
    //#given
    const config = createConfig("sisyphus", { model: "openai/gpt-5.3/codex" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toEqual({ providerID: "openai", modelID: "gpt-5.3/codex", variant: undefined })
  })

  test("should return null when model string has no slash", () => {
    //#given
    const config = createConfig("sisyphus", { model: "just-a-model" })
    const output = createOutput("ultrawork do something")

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toBeNull()
  })

  test("should resolve display name to config key", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ulw do something")

    //#when
    const result = resolveUltraworkOverride(config, "Sisyphus (Ultraworker)", output)

    //#then
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6", variant: "max" })
  })

  test("should handle multiple text parts by joining them", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = {
      message: {} as Record<string, unknown>,
      parts: [
        { type: "text", text: "hello " },
        { type: "image", text: undefined },
        { type: "text", text: "ultrawork now" },
      ],
    }

    //#when
    const result = resolveUltraworkOverride(config, "sisyphus", output)

    //#then
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6", variant: undefined })
  })

  test("should use session agent when input and message agents are undefined", () => {
    //#given
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something")
    const getSessionAgentSpy = spyOn(sessionStateModule, "getSessionAgent").mockReturnValue("sisyphus")

    //#when
    const result = resolveUltraworkOverride(config, undefined, output, "ses_test")

    //#then
    expect(getSessionAgentSpy).toHaveBeenCalledWith("ses_test")
    expect(result).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6", variant: "max" })

    getSessionAgentSpy.mockRestore()
  })
})

describe("applyUltraworkModelOverrideOnMessage", () => {
  let logSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    logSpy = spyOn(sharedModule, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy?.mockRestore()
  })

  function createMockTui() {
    return {
      showToast: async () => {},
    }
  }

  function createOutput(
    text: string,
    options?: {
      existingModel?: { providerID: string; modelID: string }
      agentName?: string
      messageId?: string
    },
  ) {
    return {
      message: {
        ...(options?.existingModel ? { model: options.existingModel } : {}),
        ...(options?.agentName ? { agent: options.agentName } : {}),
        ...(options?.messageId ? { id: options.messageId } : {}),
      } as Record<string, unknown>,
      parts: [{ type: "text", text }],
    }
  }

  function createConfig(agentName: string, ultrawork: { model?: string; variant?: string }) {
    return {
      agents: {
        [agentName]: { ultrawork },
      },
    } as unknown as Parameters<typeof applyUltraworkModelOverrideOnMessage>[0]
  }

  test("should directly mutate model and variant when keyword detected", () => {
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, createMockTui())

    expect(output.message.model).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6" })
    expect(output.message["variant"]).toBe("max")
    expect(output.message["thinking"]).toBe("max")
  })

  test("should override existing model to ultrawork target", () => {
    const output = createOutput("ultrawork do something", {
      existingModel: { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
      messageId: "msg_123",
    })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, createMockTui())

    expect(output.message.model).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6" })
  })

  test("should keep no override when keyword not detected", () => {
    const output = createOutput("just do something normal", { messageId: "msg_123" })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, createMockTui())

    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
  })

  test("should skip override when manual model change is detected", () => {
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })

    applyUltraworkModelOverrideOnMessage(
      config,
      "sisyphus",
      output,
      createMockTui(),
      undefined,
      true,
    )

    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
    expect(output.message["thinking"]).toBeUndefined()
  })

  test("should skip override when internal initiator prompt is detected", () => {
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })

    applyUltraworkModelOverrideOnMessage(
      config,
      "sisyphus",
      output,
      createMockTui(),
      undefined,
      false,
      true,
    )

    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
  })

  test("should skip override when session model lock is active", () => {
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })

    applyUltraworkModelOverrideOnMessage(
      config,
      "sisyphus",
      output,
      createMockTui(),
      undefined,
      false,
      false,
      true,
    )

    expect(output.message.model).toBeUndefined()
    expect(output.message["variant"]).toBeUndefined()
  })

  test("should log transition with direct message tag", () => {
    const output = createOutput("ultrawork do something", {
      existingModel: { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
      messageId: "msg_123",
    })
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, createMockTui())

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("direct message"),
      expect.objectContaining({ agent: "sisyphus" }),
    )
  })

  test("should call showToast on override", () => {
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6" })
    const output = createOutput("ultrawork do something", { messageId: "msg_123" })
    let toastCalled = false
    const tui = {
      showToast: async () => {
        toastCalled = true
      },
    }

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    expect(toastCalled).toBe(true)
  })

  test("should resolve display name to config key with direct path", () => {
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ulw do something", { messageId: "msg_123" })

    applyUltraworkModelOverrideOnMessage(config, "Sisyphus (Ultraworker)", output, createMockTui())

    expect(output.message.model).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6" })
    expect(output.message["variant"]).toBe("max")
  })

  test("should skip override trigger when current model already matches ultrawork model", () => {
    const config = createConfig("sisyphus", { model: "anthropic/claude-opus-4-6", variant: "max" })
    const output = createOutput("ultrawork do something", {
      existingModel: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      messageId: "msg_123",
    })
    let toastCalled = false
    const tui = {
      showToast: async () => {
        toastCalled = true
      },
    }

    applyUltraworkModelOverrideOnMessage(config, "sisyphus", output, tui)

    expect(output.message.model).toEqual({ providerID: "anthropic", modelID: "claude-opus-4-6" })
    expect(toastCalled).toBe(false)
  })
})
