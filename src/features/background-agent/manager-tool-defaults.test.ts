declare const require: (name: string) => any
const { describe, test, expect } = require("bun:test")

import { tmpdir } from "node:os"
import type { PluginInput } from "@opencode-ai/plugin"
import { BackgroundManager } from "./manager"
import type { BackgroundTask } from "./types"

function getTaskMap(manager: BackgroundManager): Map<string, BackgroundTask> {
  return (manager as unknown as { tasks: Map<string, BackgroundTask> }).tasks
}

describe("BackgroundManager delegated tool defaults", () => {
  test("launch should prefer task over call_omo_agent for unrestricted agents", async () => {
    let capturedBody: Record<string, unknown> | undefined
    const client = {
      session: {
        create: async () => ({ data: { id: "ses_launch" } }),
        get: async () => ({ data: { directory: "/test/dir" } }),
        promptAsync: async (args: { body: Record<string, unknown> }) => {
          capturedBody = args.body
          return {}
        },
        prompt: async () => ({}),
        abort: async () => ({}),
      },
    }
    const manager = new BackgroundManager({ client, directory: tmpdir() } as unknown as PluginInput)

    await manager.launch({
      description: "delegate to sisyphus",
      prompt: "test prompt",
      agent: "sisyphus",
      parentSessionID: "parent-session",
      parentMessageID: "parent-message",
    })

    for (let i = 0; i < 10 && !capturedBody; i++) {
      await Promise.resolve()
    }

    expect(capturedBody?.tools).toMatchObject({
      task: true,
      call_omo_agent: false,
      question: false,
    })

    manager.shutdown()
  })

  test("resume should prefer task over call_omo_agent for unrestricted agents", async () => {
    let capturedBody: Record<string, unknown> | undefined
    const client = {
      session: {
        promptAsync: async (args: { body: Record<string, unknown> }) => {
          capturedBody = args.body
          return {}
        },
        prompt: async () => ({}),
        abort: async () => ({}),
      },
    }
    const manager = new BackgroundManager({ client, directory: tmpdir() } as unknown as PluginInput)
    const taskMap = getTaskMap(manager)
    taskMap.set("task-1", {
      id: "task-1",
      sessionID: "ses_resume",
      parentSessionID: "parent-session",
      parentMessageID: "parent-message",
      description: "resume task",
      prompt: "old prompt",
      agent: "sisyphus",
      status: "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      concurrencyGroup: "sisyphus",
    })

    await manager.resume({
      sessionId: "ses_resume",
      prompt: "continue",
      parentSessionID: "parent-session-2",
      parentMessageID: "parent-message-2",
    })

    expect(capturedBody?.tools).toMatchObject({
      task: true,
      call_omo_agent: false,
      question: false,
    })

    manager.shutdown()
  })
})
