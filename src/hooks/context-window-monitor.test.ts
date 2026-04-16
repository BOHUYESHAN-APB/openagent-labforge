/// <reference types="bun-types" />

import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test"
import { createContextWindowMonitorHook } from "./context-window-monitor"

const ANTHROPIC_CONTEXT_ENV_KEY = "ANTHROPIC_1M_CONTEXT"
const VERTEX_CONTEXT_ENV_KEY = "VERTEX_ANTHROPIC_1M_CONTEXT"

const originalAnthropicContextEnv = process.env[ANTHROPIC_CONTEXT_ENV_KEY]
const originalVertexContextEnv = process.env[VERTEX_CONTEXT_ENV_KEY]

function resetContextLimitEnv(): void {
  if (originalAnthropicContextEnv === undefined) {
    delete process.env[ANTHROPIC_CONTEXT_ENV_KEY]
  } else {
    process.env[ANTHROPIC_CONTEXT_ENV_KEY] = originalAnthropicContextEnv
  }

  if (originalVertexContextEnv === undefined) {
    delete process.env[VERTEX_CONTEXT_ENV_KEY]
  } else {
    process.env[VERTEX_CONTEXT_ENV_KEY] = originalVertexContextEnv
  }
}

function createMockCtx() {
  return {
    client: {
      session: {
        messages: mock(() => Promise.resolve({ data: [] })),
      },
      tui: {
        showToast: mock(() => Promise.resolve({})),
      },
    },
    directory: "/tmp/test",
  }
}

function createTransformMessage(args: {
  sessionID: string
  role: "user" | "assistant"
  agent?: string
  text?: string
  toolPart?: Record<string, unknown>
  id: string
}) {
  const parts: Array<Record<string, unknown>> = []
  if (args.text !== undefined) {
    parts.push({
      id: `${args.id}_text`,
      sessionID: args.sessionID,
      messageID: args.id,
      type: "text",
      text: args.text,
    })
  }
  if (args.toolPart) {
    parts.push(args.toolPart)
  }
  return {
    info: {
      id: args.id,
      sessionID: args.sessionID,
      role: args.role,
      ...(args.agent ? { agent: args.agent } : {}),
    },
    parts,
  }
}

describe("context-window-monitor", () => {
  let ctx: ReturnType<typeof createMockCtx>

  beforeEach(() => {
    ctx = createMockCtx()
    delete process.env[ANTHROPIC_CONTEXT_ENV_KEY]
    delete process.env[VERTEX_CONTEXT_ENV_KEY]
  })

  afterEach(() => {
    resetContextLimitEnv()
  })

  // #given event caches token info from message.updated
  // #when tool.execute.after is called
  // #then session.messages() should NOT be called
  it("should use cached token info instead of fetching session.messages()", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_test1"

    // Simulate message.updated event with token info
    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "anthropic",
            finish: true,
            tokens: {
              input: 50000,
              output: 1000,
              reasoning: 0,
              cache: { read: 10000, write: 0 },
            },
          },
        },
      },
    })

    const output = { title: "", output: "test output", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    // session.messages() should NOT have been called
    expect(ctx.client.session.messages).not.toHaveBeenCalled()
  })

  // #given no cached token info exists
  // #when tool.execute.after is called
  // #then should skip gracefully without fetching
  it("should skip gracefully when no cached token info exists", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_no_cache"

    const output = { title: "", output: "test output", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    // No fetch, no crash
    expect(ctx.client.session.messages).not.toHaveBeenCalled()
    expect(output.output).toBe("test output")
  })

  // #given token usage exceeds 70% threshold
  // #when tool.execute.after is called
  // #then context reminder should be appended to output
  it("should append context reminder when usage exceeds threshold", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_high_usage"

    // 150K input + 10K cache read = 160K, which is 80% of 200K limit
    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "anthropic",
            finish: true,
            tokens: {
              input: 150000,
              output: 1000,
              reasoning: 0,
              cache: { read: 10000, write: 0 },
            },
          },
        },
      },
    })

    const output = { title: "", output: "original", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    expect(output.output).toContain("context remaining")
    expect(ctx.client.session.messages).not.toHaveBeenCalled()
  })

  it("should append context reminder for google-vertex-anthropic provider", async () => {
    //#given cached usage for google-vertex-anthropic above threshold
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_vertex_anthropic_high_usage"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "google-vertex-anthropic",
            finish: true,
            tokens: {
              input: 150000,
              output: 1000,
              reasoning: 0,
              cache: { read: 10000, write: 0 },
            },
          },
        },
      },
    })

    //#when tool.execute.after runs
    const output = { title: "", output: "original", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    //#then context reminder should be appended
    expect(output.output).toContain("context remaining")
  })

  // #given session is deleted
  // #when session.deleted event fires
  // #then cached data should be cleaned up
  it("should clean up cache on session.deleted", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_deleted"

    // Cache some data
    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "anthropic",
            finish: true,
            tokens: { input: 150000, output: 0, reasoning: 0, cache: { read: 10000, write: 0 } },
          },
        },
      },
    })

    // Delete session
    await hook.event({
      event: {
        type: "session.deleted",
        properties: { info: { id: sessionID } },
      },
    })

    // After deletion, no reminder should fire (cache gone, reminded set gone)
    const output = { title: "", output: "test", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )
    expect(output.output).toBe("test")
  })

  // #given non-anthropic provider with high carried context
  // #when message.updated fires
  // #then labforge compression notice should still trigger
  it("should append labforge notice for non-anthropic providers when context debt is high", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_openai"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            finish: true,
            tokens: { input: 200000, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
          },
        },
      },
    })

    const output = { title: "", output: "test", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )
    expect(output.output).toContain("Labforge")
    expect(output.output).toContain("Severe context debt")
  })

  it("writes a local context capsule when labforge notice triggers", async () => {
    const testDir = `/tmp/labforge-context-${Date.now()}`
    const localCtx = {
      client: {
        session: {
          messages: mock(() => Promise.resolve({ data: [] })),
        },
      },
      directory: testDir,
    }
    const hook = createContextWindowMonitorHook(localCtx as never)
    const sessionID = "ses_capsule"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 650000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const output = { title: "", output: "test", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_capsule" },
      output
    )

    const { existsSync, readFileSync, rmSync } = await import("node:fs")
    const capsulePath = `${testDir}/.opencode/openagent-labforge/runtime/${sessionID}/context-capsule.md`
    const autoCheckpointPath = `${testDir}/.opencode/openagent-labforge/checkpoints/auto/latest.md`
    const autoCheckpointMetaPath = `${testDir}/.opencode/openagent-labforge/checkpoints/auto/latest.meta.json`
    expect(existsSync(capsulePath)).toBe(true)
    expect(readFileSync(capsulePath, "utf-8")).toContain("Labforge Context Capsule")
    expect(existsSync(autoCheckpointPath)).toBe(true)
    expect(readFileSync(autoCheckpointPath, "utf-8")).toContain("AUTO COMPRESSION CHECKPOINT")
    expect(existsSync(autoCheckpointMetaPath)).toBe(true)
    expect(readFileSync(autoCheckpointMetaPath, "utf-8")).toContain("\"checkpoint_kind\": \"heavy\"")
    expect(output.output).toContain("checkpoints/auto/latest.md")
    rmSync(testDir, { recursive: true, force: true })
  })

  it("shows a visible L1 summary without creating an auto checkpoint", async () => {
    const testDir = `/tmp/labforge-context-l1-${Date.now()}`
    const localCtx = {
      client: {
        session: {
          messages: mock(() => Promise.resolve({ data: [] })),
        },
        tui: {
          showToast: mock(() => Promise.resolve({})),
        },
      },
      directory: testDir,
    }
    const hook = createContextWindowMonitorHook(localCtx as never)
    const sessionID = "ses_l1_capsule"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 230000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const output = { title: "", output: "test", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_l1" },
      output
    )

    const { existsSync, rmSync } = await import("node:fs")
    expect(output.output).toContain("Compression guard L1")
    expect(output.output).toContain("context-capsule.md")
    expect(output.output).toContain("context-pressure.json")
    expect(output.output).toContain("Checkpoint: pending")
    expect(existsSync(`${testDir}/.opencode/openagent-labforge/runtime/${sessionID}/context-capsule.md`)).toBe(true)
    expect(existsSync(`${testDir}/.opencode/openagent-labforge/checkpoints/auto/latest.md`)).toBe(false)
    expect(localCtx.client.tui.showToast).toHaveBeenCalled()
    rmSync(testDir, { recursive: true, force: true })
  })

  it("writes L2 auto checkpoint metadata without user confirmation requirement", async () => {
    const testDir = `/tmp/labforge-context-l2-${Date.now()}`
    const localCtx = {
      client: {
        session: {
          messages: mock(() => Promise.resolve({ data: [] })),
        },
        tui: {
          showToast: mock(() => Promise.resolve({})),
        },
      },
      directory: testDir,
    }
    const hook = createContextWindowMonitorHook(localCtx as never)
    const sessionID = "ses_l2_capsule"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 330000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const output = { title: "", output: "test", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_l2" },
      output,
    )

    const { readFileSync, rmSync } = await import("node:fs")
    const autoCheckpointMetaPath = `${testDir}/.opencode/openagent-labforge/checkpoints/auto/latest.meta.json`
    const metadata = readFileSync(autoCheckpointMetaPath, "utf-8")
    expect(metadata).toContain("\"checkpoint_kind\": \"light\"")
    expect(metadata).toContain("\"checkpoint_scope\": \"same-session\"")
    expect(metadata).toContain("\"session_switch_recommendation\": \"stay\"")
    expect(metadata).toContain("\"user_confirmation_required\": false")
    rmSync(testDir, { recursive: true, force: true })
  })

  it("prunes old compression notice messages during transform under context debt", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_transform_prune_notice"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 650000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const messages = [
      createTransformMessage({
        sessionID,
        role: "assistant",
        text: "▣ DCP | -1476.5K removed, +477.5K summary\nCompression #192",
        id: "msg_old_notice",
      }),
      ...Array.from({ length: 54 }, (_, index) =>
        createTransformMessage({
          sessionID,
          role: index % 2 === 0 ? "user" : "assistant",
          text: `message_${index}`,
          id: `msg_${index}`,
        })
      ),
    ]

    const output = { messages }
    await hook["experimental.chat.messages.transform"]?.({}, output as never)

    expect(output.messages.length).toBe(54)
    expect(
      output.messages.some((message) =>
        message.parts.some((part) => typeof part.text === "string" && String(part.text).includes("▣ DCP |"))
      )
    ).toBe(false)
  })

  it("compacts old tool outputs during transform under context debt", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_transform_tool_compact"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 650000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const messages = [
      createTransformMessage({
        sessionID,
        role: "assistant",
        id: "msg_tool_old",
        toolPart: {
          id: "tool_1",
          sessionID,
          messageID: "msg_tool_old",
          type: "tool",
          tool: "bash",
          state: {
            status: "completed",
            output: "x".repeat(2400),
          },
        },
      }),
      ...Array.from({ length: 54 }, (_, index) =>
        createTransformMessage({
          sessionID,
          role: index % 2 === 0 ? "user" : "assistant",
          text: `message_${index}`,
          id: `msg_tail_${index}`,
        })
      ),
    ]

    const output = { messages }
    await hook["experimental.chat.messages.transform"]?.({}, output as never)

    const transformedToolPart = output.messages[0].parts.find((part) => part.type === "tool")
    expect(transformedToolPart?.state?.output).toBe("[Labforge compacted stale tool output]")
  })

  it("injects compression directive into the latest user message when context debt is severe", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_transform_directive"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 760000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const messages = [
      createTransformMessage({
        sessionID,
        role: "assistant",
        text: "older assistant context",
        id: "msg_assistant_old",
      }),
      createTransformMessage({
        sessionID,
        role: "user",
        text: "继续推进当前分析",
        id: "msg_user_latest",
      }),
    ]

    const output = { messages }
    await hook["experimental.chat.messages.transform"]?.({}, output as never)

    expect(output.messages[1].parts.length).toBe(2)
    expect(String(output.messages[1].parts[0].text)).toContain("[Labforge Compression Directive]")
    expect(String(output.messages[1].parts[0].text)).toContain("Severe context debt detected")
  })

  it("injects bio-specific compression directive for bio sessions", async () => {
    const hook = createContextWindowMonitorHook(ctx as never)
    const sessionID = "ses_transform_directive_bio"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "openai",
            modelID: "gpt-5.4",
            finish: true,
            tokens: {
              input: 760000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    const messages = [
      createTransformMessage({
        sessionID,
        role: "assistant",
        agent: "生信总控官",
        text: "older bio context",
        id: "msg_bio_assistant_old",
      }),
      createTransformMessage({
        sessionID,
        role: "user",
        agent: "生信总控官",
        text: "继续推进当前分析",
        id: "msg_bio_user_latest",
      }),
    ]

    const output = { messages }
    await hook["experimental.chat.messages.transform"]?.({}, output as never)

    expect(String(output.messages[1].parts[0].text)).toContain("bioinformatics / academic")
    expect(String(output.messages[1].parts[0].text)).toContain("Do NOT open a new modality")
  })

  it("should use 1M limit when model cache flag is enabled", async () => {
    //#given
    const hook = createContextWindowMonitorHook(ctx as never, {
      anthropicContext1MEnabled: true,
    })
    const sessionID = "ses_1m_flag"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "anthropic",
            finish: true,
            tokens: {
              input: 300000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    //#when
    const output = { title: "", output: "original", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    //#then
    expect(output.output).toContain("Compression guard L1")
    expect(output.output).toContain("context-capsule.md")
  })

  it("should keep env var fallback when model cache flag is disabled", async () => {
    //#given
    process.env[ANTHROPIC_CONTEXT_ENV_KEY] = "true"
    const hook = createContextWindowMonitorHook(ctx as never, {
      anthropicContext1MEnabled: false,
    })
    const sessionID = "ses_env_fallback"

    await hook.event({
      event: {
        type: "message.updated",
        properties: {
          info: {
            role: "assistant",
            sessionID,
            providerID: "anthropic",
            finish: true,
            tokens: {
              input: 300000,
              output: 1000,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
          },
        },
      },
    })

    //#when
    const output = { title: "", output: "original", metadata: null }
    await hook["tool.execute.after"](
      { tool: "bash", sessionID, callID: "call_1" },
      output
    )

    //#then
    expect(output.output).toContain("Compression guard L1")
    expect(output.output).toContain("context-capsule.md")
  })
})
