import { describe, expect, test } from "bun:test"
import { shouldSuppressStaleTodoSnapshot } from "./stale-todo-guard"

describe("shouldSuppressStaleTodoSnapshot", () => {
  test("suppresses stale ordinary main-session todos without tracked workflow", () => {
    const result = shouldSuppressStaleTodoSnapshot({
      state: {
        stagnationCount: 0,
        consecutiveFailures: 0,
      },
      currentTodoSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      hasContinuationIntent: false,
      hasTrackedRuntimeWorkflow: false,
      isMainSession: true,
      isAutonomous: false,
      lastRealUserAgent: "总调度器 (超脑)",
    })

    expect(result).toEqual({
      suppress: true,
      reason: "ordinary-main-session-with-stale-todos",
    })
  })

  test("suppresses unchanged todo graph after a fresh user-assistant wave", () => {
    const result = shouldSuppressStaleTodoSnapshot({
      state: {
        stagnationCount: 0,
        consecutiveFailures: 0,
        lastUserActivityAt: 200,
        lastAssistantActivityAt: 300,
        lastTodoGraphTouchAt: 100,
        lastTodoBaselineSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      },
      currentTodoSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      hasContinuationIntent: false,
      hasTrackedRuntimeWorkflow: false,
      isMainSession: true,
      isAutonomous: true,
      lastRealUserAgent: "bio-autopilot",
    })

    expect(result).toEqual({
      suppress: true,
      reason: "new-conversation-wave-left-todo-graph-unchanged",
    })
  })

  test("does not suppress tracked autonomous workflow when latest user is still autonomous", () => {
    const result = shouldSuppressStaleTodoSnapshot({
      state: {
        stagnationCount: 0,
        consecutiveFailures: 0,
        lastUserActivityAt: 200,
        lastAssistantActivityAt: 300,
        lastTodoGraphTouchAt: 100,
        lastTodoBaselineSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      },
      currentTodoSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      hasContinuationIntent: false,
      hasTrackedRuntimeWorkflow: true,
      isMainSession: true,
      isAutonomous: true,
      lastRealUserAgent: "bio-autopilot",
    })

    expect(result).toEqual({ suppress: false })
  })

  test("suppresses tracked autonomous workflow when fresh user guidance left the todo graph unchanged", () => {
    const result = shouldSuppressStaleTodoSnapshot({
      state: {
        stagnationCount: 0,
        consecutiveFailures: 0,
        lastUserActivityAt: 200,
        lastUserGuidanceAt: 200,
        lastAssistantActivityAt: 320,
        lastTodoGraphTouchAt: 100,
        lastTodoBaselineSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
        awaitingUserGuidanceReconcile: true,
      },
      currentTodoSnapshot: '[{"id":"1","content":"old","priority":"high","status":"pending"}]',
      hasContinuationIntent: false,
      hasTrackedRuntimeWorkflow: true,
      isMainSession: true,
      isAutonomous: true,
      lastRealUserAgent: "bio-autopilot",
    })

    expect(result).toEqual({
      suppress: true,
      reason: "fresh-user-guidance-left-todo-graph-unchanged",
    })
  })
})
