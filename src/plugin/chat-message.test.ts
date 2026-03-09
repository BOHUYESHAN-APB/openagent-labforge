import { describe, test, expect } from "bun:test"

import { createChatMessageHandler } from "./chat-message"

type ChatMessagePart = { type: string; text?: string; [key: string]: unknown }
type ChatMessageHandlerOutput = { message: Record<string, unknown>; parts: ChatMessagePart[] }

function createMockHandlerArgs(overrides?: {
  pluginConfig?: Record<string, unknown>
  shouldOverride?: boolean
}) {
  const appliedSessions: string[] = []
  return {
    ctx: { directory: ".", client: { tui: { showToast: async () => {} } } } as any,
    pluginConfig: (overrides?.pluginConfig ?? {}) as any,
    firstMessageVariantGate: {
      shouldOverride: () => overrides?.shouldOverride ?? false,
      markApplied: (sessionID: string) => { appliedSessions.push(sessionID) },
    },
    hooks: {
      stopContinuationGuard: null,
      backgroundNotificationHook: null,
      keywordDetector: null,
      claudeCodeHooks: null,
      autoSlashCommand: null,
      startWork: null,
      ralphLoop: null,
    } as any,
    _appliedSessions: appliedSessions,
  }
}

function createMockInput(agent?: string, model?: { providerID: string; modelID: string }) {
  return {
    sessionID: "test-session",
    agent,
    model,
  }
}

function createMockOutput(variant?: string): ChatMessageHandlerOutput {
  const message: Record<string, unknown> = {}
  if (variant !== undefined) {
    message["variant"] = variant
  }
  return { message, parts: [] }
}

describe("createChatMessageHandler - TUI variant passthrough", () => {
  test("first message: does not override TUI variant when user has no selection", async () => {
    //#given - first message, no user-selected variant
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput() // no variant set

    //#when
    await handler(input, output)

    //#then - TUI sent undefined, should stay undefined (no config override)
    expect(output.message["variant"]).toBeUndefined()
  })

  test("first message: preserves user-selected variant when already set", async () => {
    //#given - first message, user already selected "xhigh" variant in OpenCode UI
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh") // user selected xhigh

    //#when
    await handler(input, output)

    //#then - user's xhigh must be preserved
    expect(output.message["variant"]).toBe("xhigh")
  })

  test("subsequent message: preserves TUI variant", async () => {
    //#given - not first message, variant already set
    const args = createMockHandlerArgs({ shouldOverride: false })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh")

    //#when
    await handler(input, output)

    //#then
    expect(output.message["variant"]).toBe("xhigh")
  })

  test("subsequent message: does not inject variant when TUI sends none", async () => {
    //#given - not first message, no variant from TUI
    const args = createMockHandlerArgs({ shouldOverride: false })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput() // no variant

    //#when
    await handler(input, output)

    //#then - should stay undefined, not auto-resolved from config
    expect(output.message["variant"]).toBeUndefined()
  })

  test("first message: marks gate as applied regardless of variant presence", async () => {
    //#given - first message with user-selected variant
    const args = createMockHandlerArgs({ shouldOverride: true })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput("xhigh")

    //#when
    await handler(input, output)

    //#then - gate should still be marked as applied
    expect(args._appliedSessions).toContain("test-session")
  })

  test("injects queued background notifications through chat.message hook", async () => {
    //#given
    const args = createMockHandlerArgs()
    args.hooks.backgroundNotificationHook = {
      "chat.message": async (
        _input: { sessionID: string },
        output: ChatMessageHandlerOutput,
      ): Promise<void> => {
        output.parts.push({
          type: "text",
          text: "<system-reminder>[BACKGROUND TASK COMPLETED]</system-reminder>",
        })
      },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.3-codex" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].text).toContain("[BACKGROUND TASK COMPLETED]")
  })

  test("locks output model to user-selected model when strict_user_model_priority is enabled", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(output.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("does not lock output model when selected model is auto sentinel", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("hephaestus", { providerID: "auto", modelID: "deep" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(output.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
  })

  test("keeps user-selected model on continue turns without reselecting", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    const firstInput = createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const firstOutput = createMockOutput()

    //#when
    await handler(firstInput, firstOutput)

    const continueInput = createMockInput("hephaestus", undefined)
    const continueOutput = createMockOutput()
    await handler(continueInput, continueOutput)

    //#then
    expect(firstOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(continueOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("clears sticky lock when user explicitly switches to auto", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    const pinnedInput = createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const pinnedOutput = createMockOutput()
    await handler(pinnedInput, pinnedOutput)

    const autoInput = createMockInput("hephaestus", { providerID: "auto", modelID: "deep" })
    const autoOutput = createMockOutput()
    await handler(autoInput, autoOutput)

    //#when
    const continueInput = createMockInput("hephaestus", undefined)
    const continueOutput = createMockOutput()
    await handler(continueInput, continueOutput)

    //#then
    expect(autoOutput.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
    expect(continueOutput.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
  })

  test("restores locked model when input reflects prior forced auto-switch", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    const firstInput = createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const firstOutput = createMockOutput()
    await handler(firstInput, firstOutput)

    //#when
    const continueInput = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.4" })
    const continueOutput = createMockOutput()
    await handler(continueInput, continueOutput)

    //#then
    expect(continueOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("allows explicit user switch to a new model", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    const firstInput = createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const firstOutput = createMockOutput()
    await handler(firstInput, firstOutput)

    //#when
    const explicitSwitchInput = createMockInput("hephaestus", { providerID: "anthropic", modelID: "claude-opus-4-6" })
    const explicitSwitchOutput = createMockOutput()
    await handler(explicitSwitchInput, explicitSwitchOutput)

    //#then
    expect(explicitSwitchOutput.message.model).toEqual({
      providerID: "anthropic",
      modelID: "claude-opus-4-6",
    })
  })
})
