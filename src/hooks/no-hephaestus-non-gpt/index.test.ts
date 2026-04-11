/// <reference types="bun-types" />

import { describe, expect, spyOn, test } from "bun:test"
import { _resetForTesting, registerAgentName, updateSessionAgent } from "../../features/claude-code-session-state"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createNoHephaestusNonGptHook } from "./index"

const HEPHAESTUS_DISPLAY = getAgentDisplayName("hephaestus")
const SISYPHUS_DISPLAY = getAgentDisplayName("sisyphus")

function createOutput() {
  return {
    message: {} as { agent?: string; [key: string]: unknown },
    parts: [],
  }
}

describe("no-hephaestus-non-gpt hook", () => {
  test("shows toast on every chat.message when hephaestus uses non-gpt model", async () => {
    // given - hephaestus with claude model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output1 = createOutput()
    const output2 = createOutput()

    // when - chat.message is called repeatedly
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output1)
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output2)

    // then - toast is shown, but agent is not auto-switched by default
    expect(showToast).toHaveBeenCalledTimes(2)
    expect(output1.message.agent).toBeUndefined()
    expect(output2.message.agent).toBeUndefined()
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use Hephaestus with Non-GPT",
        message: expect.stringContaining("consider Sisyphus"),
        variant: "warning",
      },
    })
  })

  test("shows warning and does not switch agent when allow_non_gpt_model is enabled", async () => {
    // given - hephaestus with claude model and opt-out enabled
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any, {
      allowNonGptModel: true,
    })

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_opt_out",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - warning toast is shown but agent is not switched
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBeUndefined()
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use Hephaestus with Non-GPT",
        variant: "warning",
      },
    })
  })

  test("does not show toast when hephaestus uses gpt model", async () => {
    // given - hephaestus with gpt model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_2",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
    }, output)

    // then - no toast, agent unchanged
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("does not show toast for non-hephaestus agent", async () => {
    // given - sisyphus with claude model (non-gpt)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_3",
      agent: SISYPHUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("uses session agent fallback when input agent is missing", async () => {
    // given - session agent saved as hephaestus
    _resetForTesting()
    updateSessionAgent("ses_4", HEPHAESTUS_DISPLAY)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs without input.agent
    await hook["chat.message"]?.({
      sessionID: "ses_4",
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - toast shown via session-agent fallback, but no forced reroute by default
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBeUndefined()
  })

  test("forces reroute only when forceAgentModelRouting is enabled", async () => {
    // given
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when
    await hook["chat.message"]?.({
      sessionID: "ses_force",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      forceAgentModelRouting: true,
    }, output)

    // then
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBe(SISYPHUS_DISPLAY)
  })

  test("prefers registered agent runtime name when force rerouting", async () => {
    _resetForTesting()
    registerAgentName(SISYPHUS_DISPLAY)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoHephaestusNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    await hook["chat.message"]?.({
      sessionID: "ses_force_registered",
      agent: HEPHAESTUS_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
      forceAgentModelRouting: true,
    }, output)

    expect(output.message.agent).toBe(SISYPHUS_DISPLAY)
  })
})
