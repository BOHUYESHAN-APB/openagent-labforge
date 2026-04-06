import { beforeEach, describe, test, expect } from "bun:test"

import { createChatMessageHandler } from "./chat-message"
import type { ChatMessageInput } from "./chat-message"
import { OMO_INTERNAL_INITIATOR_MARKER } from "../shared/internal-initiator-marker"
import { getSessionAgent, isUltraworkAutonomousSession, _resetForTesting } from "../features/claude-code-session-state"
import {
  clearSessionAutoModelRouting,
  clearSessionForcedModel,
  clearSessionModel,
  clearSessionModelLock,
  setSessionAutoModelRouting,
  setSessionModel,
} from "../shared/session-model-state"

type ChatMessagePart = { type: string; text?: string; [key: string]: unknown }
type ChatMessageHandlerOutput = { message: Record<string, unknown>; parts: ChatMessagePart[] }

function createMockHandlerArgs(overrides?: {
  pluginConfig?: Record<string, unknown>
  shouldOverride?: boolean
  sessionMessages?: Array<{ info?: { agent?: string; role?: string } }>
}) {
  const appliedSessions: string[] = []
  const toastCalls: Array<{ title: string; message: string }> = []
  return {
    ctx: {
      directory: ".",
      client: {
        session: {
          messages: async () => ({
            data: overrides?.sessionMessages ?? [],
          }),
        },
        tui: {
          showToast: async ({ body }: { body: { title: string; message: string } }) => {
            toastCalls.push({ title: body.title, message: body.message })
          },
        },
      },
    } as any,
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
    _toastCalls: toastCalls,
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
  beforeEach(() => {
    clearSessionAutoModelRouting("test-session")
    clearSessionForcedModel("test-session")
    clearSessionModelLock("test-session")
    clearSessionModel("test-session")
    _resetForTesting()
  })

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

  test("marks session autonomous when agent is wase", async () => {
    //#given
    const args = createMockHandlerArgs({ shouldOverride: false })
    const handler = createChatMessageHandler(args)
    const input = createMockInput("wase", { providerID: "anthropic", modelID: "claude-opus-4-6" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(getSessionAgent(input.sessionID)).toBe("wase")
    expect(isUltraworkAutonomousSession(input.sessionID)).toBe(true)
  })

  test("recovers latest agent from transcript when resumed session has no in-memory agent", async () => {
    //#given
    const args = createMockHandlerArgs({
      sessionMessages: [
        { info: { role: "assistant", agent: "prometheus" } },
        { info: { role: "assistant", agent: "bio-autopilot" } },
      ],
    })
    const handler = createChatMessageHandler(args)
    const input = createMockInput(undefined, { providerID: "google", modelID: "gemini-2.5-pro" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(getSessionAgent(input.sessionID)).toBeUndefined()
    expect(isUltraworkAutonomousSession(input.sessionID)).toBe(false)
  })

  test("does not query session messages inside chat.message when agent is missing", async () => {
    //#given
    let messageFetchCount = 0
    const args = createMockHandlerArgs()
    args.ctx.client.session = {
      messages: async () => {
        messageFetchCount += 1
        return { data: [] }
      },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput(undefined, { providerID: "google", modelID: "gemini-2.5-pro" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(messageFetchCount).toBe(0)
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

  test("skips heavy prompt injections for native plan agent", async () => {
    //#given
    const calledHooks: string[] = []
    const args = createMockHandlerArgs()
    args.hooks.keywordDetector = {
      "chat.message": async () => { calledHooks.push("keywordDetector") },
    }
    args.hooks.thinkMode = {
      "chat.message": async () => { calledHooks.push("thinkMode") },
    }
    args.hooks.claudeCodeHooks = {
      "chat.message": async () => { calledHooks.push("claudeCodeHooks") },
    }
    args.hooks.noSisyphusGpt = {
      "chat.message": async () => { calledHooks.push("noSisyphusGpt") },
    }
    args.hooks.noHephaestusNonGpt = {
      "chat.message": async () => { calledHooks.push("noHephaestusNonGpt") },
    }
    args.hooks.startWork = {
      "chat.message": async () => { calledHooks.push("startWork") },
    }
    args.hooks.autoSlashCommand = {
      "chat.message": async () => { calledHooks.push("autoSlashCommand") },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("plan", { providerID: "openai", modelID: "gpt-5.4" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(calledHooks).toEqual(["autoSlashCommand"])
  })

  test("skips heavy prompt injections for native build agent", async () => {
    //#given
    const calledHooks: string[] = []
    const args = createMockHandlerArgs()
    args.hooks.keywordDetector = {
      "chat.message": async () => { calledHooks.push("keywordDetector") },
    }
    args.hooks.thinkMode = {
      "chat.message": async () => { calledHooks.push("thinkMode") },
    }
    args.hooks.claudeCodeHooks = {
      "chat.message": async () => { calledHooks.push("claudeCodeHooks") },
    }
    args.hooks.autoSlashCommand = {
      "chat.message": async () => { calledHooks.push("autoSlashCommand") },
    }
    const handler = createChatMessageHandler(args)
    const input = createMockInput("build", { providerID: "openai", modelID: "gpt-5.4" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(calledHooks).toEqual(["autoSlashCommand"])
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

  test("keeps locked model when selected model is auto sentinel", async () => {
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
    await handler(
      createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" }),
      createMockOutput(),
    )

    const input = createMockInput("hephaestus", { providerID: "auto", modelID: "deep" })
    const output = createMockOutput()

    //#when
    await handler(input, output)

    //#then
    expect(output.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(args._toastCalls[0]?.title).toBe("Model lock restored")
  })

  test("shows recovery toast only once per session until explicit model change", async () => {
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

    await handler(
      createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" }),
      createMockOutput(),
    )

    //#when
    await handler(createMockInput("hephaestus", { providerID: "auto", modelID: "deep" }), createMockOutput())
    await handler(createMockInput("hephaestus", { providerID: "auto", modelID: "deep" }), createMockOutput())

    //#then
    expect(args._toastCalls.filter((t) => t.title === "Model lock restored")).toHaveLength(1)
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

  test("keeps pinned model across agent switches when user does not explicitly reselect a model", async () => {
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

    const switchedAgentInput = createMockInput("sisyphus", undefined)
    const switchedAgentOutput = createMockOutput()
    await handler(switchedAgentInput, switchedAgentOutput)

    //#when
    const switchedBackInput = createMockInput("hephaestus", undefined)
    const switchedBackOutput = createMockOutput()
    await handler(switchedBackInput, switchedBackOutput)

    //#then
    expect(switchedAgentOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(switchedBackOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("does not restore sticky model onto agent with explicit configured model", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
        agents: {
          sisyphus: {
            model: "github-copilot/claude-opus-4.6",
          },
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (input: ChatMessageInput, output: ChatMessageHandlerOutput): Promise<void> => {
        if (input.agent === "sisyphus") {
          output.message.model = { providerID: "github-copilot", modelID: "claude-opus-4.6" }
          return
        }

        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    await handler(
      createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" }),
      createMockOutput(),
    )

    const switchedAgentInput = createMockInput("sisyphus", undefined)
    const switchedAgentOutput = createMockOutput()

    //#when
    await handler(switchedAgentInput, switchedAgentOutput)

    //#then
    expect(switchedAgentOutput.message.model).toEqual({
      providerID: "github-copilot",
      modelID: "claude-opus-4.6",
    })
    expect(args._toastCalls.filter((t) => t.title === "Model lock restored")).toHaveLength(0)
  })

  test("does not clear sticky lock when user explicitly switches to auto", async () => {
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
    expect(autoOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(continueOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("keeps explicit model when replayed input matches prior forced model", async () => {
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
    expect(continueOutput.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
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

  test("does not clear locked model when internal continuation carries auto model", async () => {
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

    // Simulate host replay carrying forward the previously forced model.
    setSessionModel("test-session", { providerID: "openai", modelID: "gpt-5.4" })

    const internalAutoInput = createMockInput("hephaestus", { providerID: "auto", modelID: "deep" })
    const internalAutoOutput: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: `continue work\n${OMO_INTERNAL_INITIATOR_MARKER}` }],
    }

    //#when
    await handler(internalAutoInput, internalAutoOutput)

    const continueInput = createMockInput("hephaestus", undefined)
    const continueOutput = createMockOutput()
    await handler(continueInput, continueOutput)

    //#then
    expect(internalAutoOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(continueOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
  })

  test("allows explicit user switch even when selection matches prior forced model", async () => {
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

    await handler(
      createMockInput("hephaestus", { providerID: "gmn", modelID: "gpt-5.3-codex" }),
      createMockOutput(),
    )

    //#when
    const explicitSwitchInput = createMockInput("hephaestus", { providerID: "openai", modelID: "gpt-5.4" })
    const explicitSwitchOutput = createMockOutput()
    await handler(explicitSwitchInput, explicitSwitchOutput)

    //#then
    expect(explicitSwitchOutput.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
  })

  test("keeps locked model when internal ultrawork continuation is injected", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: true,
        },
        agents: {
          sisyphus: {
            ultrawork: {
              model: "openai/gpt-5.4",
              variant: "max",
            },
          },
        },
      },
    })
    args.hooks.runtimeFallback = {
      "chat.message": async (_input: unknown, output: ChatMessageHandlerOutput): Promise<void> => {
        output.message.model = { providerID: "openai", modelID: "gpt-5.4" }
      },
    }
    const handler = createChatMessageHandler(args)

    const firstInput = createMockInput("sisyphus", { providerID: "gmn", modelID: "gpt-5.3-codex" })
    const firstOutput = createMockOutput()
    await handler(firstInput, firstOutput)

    const internalUlwInput = createMockInput("sisyphus", undefined)
    const internalUlwOutput: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: `ultrawork continue\n${OMO_INTERNAL_INITIATOR_MARKER}` }],
    }

    //#when
    await handler(internalUlwInput, internalUlwOutput)

    //#then
    expect(internalUlwOutput.message.model).toEqual({ providerID: "gmn", modelID: "gpt-5.3-codex" })
    expect(internalUlwOutput.message["variant"]).toBeUndefined()
    expect(internalUlwOutput.message["thinking"]).toBeUndefined()
  })

  test("does not apply plugin ultrawork model override when user explicitly selected non-auto model", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: false,
        },
        agents: {
          sisyphus: {
            ultrawork: {
              model: "openai/gpt-5.4",
              variant: "max",
            },
          },
        },
      },
    })
    const handler = createChatMessageHandler(args)

    const explicitInput = createMockInput("sisyphus", { providerID: "github-copilot", modelID: "gpt-5.3-codex" })
    const explicitOutput: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "ultrawork do the full implementation" }],
    }

    //#when
    await handler(explicitInput, explicitOutput)

    //#then
    expect(explicitOutput.message.model).toBeUndefined()
    expect(explicitOutput.message["variant"]).toBeUndefined()
  })

  test("does not apply plugin ultrawork model override when explicit model is selected even if session auto routing is on", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: false,
        },
        agents: {
          sisyphus: {
            ultrawork: {
              model: "openai/gpt-5.3-codex",
              variant: "max",
            },
          },
        },
      },
    })
    const handler = createChatMessageHandler(args)
    setSessionAutoModelRouting("test-session", true)

    const explicitInput = createMockInput("sisyphus", { providerID: "openai", modelID: "gpt-5.4" })
    const explicitOutput: ChatMessageHandlerOutput = {
      message: { model: { providerID: "openai", modelID: "gpt-5.4" } },
      parts: [{ type: "text", text: "ultrawork continue implementation" }],
    }

    //#when
    await handler(explicitInput, explicitOutput)

    //#then
    expect(explicitOutput.message.model).toEqual({ providerID: "openai", modelID: "gpt-5.4" })
    expect(explicitOutput.message["variant"]).toBeUndefined()
  })

  test("applies plugin ultrawork model override when model input is auto", async () => {
    //#given
    const args = createMockHandlerArgs({
      pluginConfig: {
        experimental: {
          strict_user_model_priority: false,
        },
        agents: {
          sisyphus: {
            ultrawork: {
              model: "openai/gpt-5.4",
              variant: "max",
            },
          },
        },
      },
    })
    const handler = createChatMessageHandler(args)

    const autoInput = createMockInput("sisyphus", { providerID: "auto", modelID: "deep" })
    const autoOutput: ChatMessageHandlerOutput = {
      message: {},
      parts: [{ type: "text", text: "ultrawork do the full implementation" }],
    }

    await handler(createMockInput("sisyphus", undefined), createMockOutput())

    //#when
    await handler(autoInput, autoOutput)

    //#then
    expect(autoOutput.message["variant"]).toBe("max")
  })
})
