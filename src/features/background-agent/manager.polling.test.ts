import { describe, test, expect } from "bun:test"
import { tmpdir } from "node:os"
import type { PluginInput } from "@opencode-ai/plugin"
import type { BackgroundTask } from "./types"
import { BackgroundManager } from "./manager"

function createManagerWithClient(clientOverrides: Partial<PluginInput["client"]>): BackgroundManager {
  const client = {
    session: {
      status: async () => ({ data: {} }),
      prompt: async () => ({}),
      promptAsync: async () => ({}),
      abort: async () => ({}),
      todo: async () => ({ data: [] }),
      messages: async () => ({ data: [] }),
      ...(clientOverrides.session ?? {}),
    },
  }

  return new BackgroundManager({ client, directory: tmpdir() } as unknown as PluginInput)
}

function createRunningTask(overrides: Partial<BackgroundTask> = {}): BackgroundTask {
  return {
    id: overrides.id ?? "bg-task-1",
    status: "running",
    sessionID: overrides.sessionID ?? "session-1",
    parentSessionID: overrides.parentSessionID ?? "parent-1",
    parentMessageID: overrides.parentMessageID ?? "message-1",
    description: overrides.description ?? "Test task",
    prompt: overrides.prompt ?? "Test prompt",
    agent: overrides.agent ?? "sisyphus",
    ...overrides,
  }
}

function injectTask(manager: BackgroundManager, task: BackgroundTask): void {
  (manager as unknown as { tasks: Map<string, BackgroundTask> }).tasks.set(task.id, task)
}

describe("BackgroundManager polling overlap", () => {
  test("skips overlapping pollRunningTasks executions", async () => {
    //#given
    let activeCalls = 0
    let maxActiveCalls = 0
    let statusCallCount = 0
    let releaseStatus: (() => void) | undefined
    const statusGate = new Promise<void>((resolve) => {
      releaseStatus = resolve
    })

    const manager = createManagerWithClient({
      session: {
        status: async () => {
          statusCallCount += 1
          activeCalls += 1
          maxActiveCalls = Math.max(maxActiveCalls, activeCalls)
          await statusGate
          activeCalls -= 1
          return { data: {} }
        },
      },
    })

    //#when
    const firstPoll = (manager as unknown as { pollRunningTasks: () => Promise<void> }).pollRunningTasks()
    await Promise.resolve()
    const secondPoll = (manager as unknown as { pollRunningTasks: () => Promise<void> }).pollRunningTasks()
    releaseStatus?.()
    await Promise.all([firstPoll, secondPoll])
    manager.shutdown()

    //#then
    expect(maxActiveCalls).toBe(1)
    expect(statusCallCount).toBe(1)
  })
})

describe("BackgroundManager polling completion", () => {
  test("completes when session status is missing", async () => {
    //#given
    const manager = createManagerWithClient({
      session: {
        status: async () => ({ data: {} }),
      },
    })
    const task = createRunningTask({ sessionID: "missing-status-session" })
    injectTask(manager, task)

    const completedTasks: string[] = []
    ;(manager as unknown as { validateSessionHasOutput: (id: string) => Promise<boolean> }).validateSessionHasOutput = async () => true
    ;(manager as unknown as { checkSessionTodos: (id: string) => Promise<boolean> }).checkSessionTodos = async () => false
    ;(manager as unknown as { tryCompleteTask: (task: BackgroundTask, reason: string) => Promise<void> }).tryCompleteTask = async (taskToComplete) => {
      completedTasks.push(taskToComplete.id)
    }

    //#when
    await (manager as unknown as { pollRunningTasks: () => Promise<void> }).pollRunningTasks()
    manager.shutdown()

    //#then
    expect(completedTasks).toEqual([task.id])
  })

  test("completes when session status is idle", async () => {
    //#given
    const sessionID = "idle-session"
    const manager = createManagerWithClient({
      session: {
        status: async () => ({ data: { [sessionID]: { type: "idle" } } }),
      },
    })
    const task = createRunningTask({ sessionID })
    injectTask(manager, task)

    const completedTasks: string[] = []
    ;(manager as unknown as { validateSessionHasOutput: (id: string) => Promise<boolean> }).validateSessionHasOutput = async () => true
    ;(manager as unknown as { checkSessionTodos: (id: string) => Promise<boolean> }).checkSessionTodos = async () => false
    ;(manager as unknown as { tryCompleteTask: (task: BackgroundTask, reason: string) => Promise<void> }).tryCompleteTask = async (taskToComplete) => {
      completedTasks.push(taskToComplete.id)
    }

    //#when
    await (manager as unknown as { pollRunningTasks: () => Promise<void> }).pollRunningTasks()
    manager.shutdown()

    //#then
    expect(completedTasks).toEqual([task.id])
  })

  test("skips completion when session status is busy", async () => {
    //#given
    const sessionID = "busy-session"
    const manager = createManagerWithClient({
      session: {
        status: async () => ({ data: { [sessionID]: { type: "busy" } } }),
      },
    })
    const task = createRunningTask({ sessionID })
    injectTask(manager, task)

    const completedTasks: string[] = []
    ;(manager as unknown as { validateSessionHasOutput: (id: string) => Promise<boolean> }).validateSessionHasOutput = async () => true
    ;(manager as unknown as { checkSessionTodos: (id: string) => Promise<boolean> }).checkSessionTodos = async () => false
    ;(manager as unknown as { tryCompleteTask: (task: BackgroundTask, reason: string) => Promise<void> }).tryCompleteTask = async (taskToComplete) => {
      completedTasks.push(taskToComplete.id)
    }

    //#when
    await (manager as unknown as { pollRunningTasks: () => Promise<void> }).pollRunningTasks()
    manager.shutdown()

    //#then
    expect(completedTasks).toEqual([])
  })
})
