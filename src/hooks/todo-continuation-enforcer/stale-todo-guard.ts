import { isAutonomousSessionAgent } from "../../features/claude-code-session-state"
import type { SessionState } from "./types"

export function shouldSuppressStaleTodoSnapshot(args: {
  state: SessionState
  currentTodoSnapshot: string
  hasContinuationIntent: boolean
  hasTrackedRuntimeWorkflow: boolean
  isMainSession: boolean
  isAutonomous: boolean
  lastRealUserAgent?: string
}): { suppress: boolean; reason?: string } {
  const {
    state,
    currentTodoSnapshot,
    hasContinuationIntent,
    hasTrackedRuntimeWorkflow,
    isMainSession,
    isAutonomous,
    lastRealUserAgent,
  } = args

  if (currentTodoSnapshot.length === 0) {
    return { suppress: false }
  }

  if (state.suppressedTodoSnapshot === currentTodoSnapshot) {
    return {
      suppress: true,
      reason: "todo-snapshot-already-suppressed",
    }
  }

  const latestUserStayedAutonomous =
    lastRealUserAgent !== undefined && isAutonomousSessionAgent(lastRealUserAgent)
  const hasPendingUserGuidanceReconcile =
    state.awaitingUserGuidanceReconcile === true &&
    state.lastUserGuidanceAt !== undefined &&
    state.lastAssistantActivityAt !== undefined &&
    state.lastAssistantActivityAt > state.lastUserGuidanceAt &&
    (
      state.lastTodoGraphTouchAt === undefined ||
      state.lastTodoGraphTouchAt < state.lastUserGuidanceAt
    ) &&
    state.lastTodoBaselineSnapshot === currentTodoSnapshot

  if (
    isMainSession &&
    !isAutonomous &&
    lastRealUserAgent !== undefined &&
    !hasTrackedRuntimeWorkflow &&
    !hasContinuationIntent
  ) {
    return {
      suppress: true,
      reason: "ordinary-main-session-with-stale-todos",
    }
  }

  if (hasPendingUserGuidanceReconcile) {
    return {
      suppress: true,
      reason: "fresh-user-guidance-left-todo-graph-unchanged",
    }
  }

  const hasFreshExternalConversation =
    state.lastUserActivityAt !== undefined &&
    state.lastAssistantActivityAt !== undefined &&
    state.lastAssistantActivityAt > state.lastUserActivityAt

  if (
    hasFreshExternalConversation &&
    !hasContinuationIntent &&
    state.lastUserActivityAt !== undefined &&
    (
      (state.lastTodoGraphTouchAt !== undefined &&
        state.lastUserActivityAt > state.lastTodoGraphTouchAt &&
        state.lastTodoBaselineSnapshot === currentTodoSnapshot) ||
      (state.lastTodoGraphTouchAt === undefined && !hasTrackedRuntimeWorkflow)
    ) &&
    (!hasTrackedRuntimeWorkflow || !latestUserStayedAutonomous)
  ) {
    return {
      suppress: true,
      reason: "new-conversation-wave-left-todo-graph-unchanged",
    }
  }

  return { suppress: false }
}
