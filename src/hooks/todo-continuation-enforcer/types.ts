import type { BackgroundManager } from "../../features/background-agent"
import type { ToolPermission } from "../../features/hook-message-injector"

export interface TodoContinuationEnforcerOptions {
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}

export interface TodoContinuationEnforcer {
  handler: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
  markRecovering: (sessionID: string) => void
  markRecoveryComplete: (sessionID: string) => void
  cancelAllCountdowns: () => void
  dispose?: () => void
}

export interface Todo {
  content: string;
  status: string;
  priority: string;
  id?: string;
}

export interface SessionState {
  countdownTimer?: ReturnType<typeof setTimeout>
  countdownInterval?: ReturnType<typeof setInterval>
  isRecovering?: boolean
  countdownStartedAt?: number
  abortDetectedAt?: number
  lastInternalPromptAt?: number
  lastUserActivityAt?: number
  lastAssistantActivityAt?: number
  lastTodoGraphTouchAt?: number
  lastTodoBaselineSnapshot?: string
  suppressedTodoSnapshot?: string
  lastApprovedTodoSnapshot?: string
  lastHandledCompletionSignature?: string
  awaitingUserGuidanceReconcile?: boolean
  lastUserGuidanceAt?: number
  lastIncompleteCount?: number
  lastInjectedAt?: number
  awaitingPostInjectionProgressCheck?: boolean
  inFlight?: boolean
  stagnationCount: number
  consecutiveFailures: number
  recentCompactionAt?: number
  recentCompactionEpoch?: number
  acknowledgedCompactionEpoch?: number
  hasContinuationIntent?: boolean
  completionAuditCount?: number
  backlogExpansionCount?: number
  lastBacklogExpansionTodoCount?: number
  heavyPlanBootstrapDone?: boolean
  heavyPlanBootstrapAttempts?: number
  lastAutoStartWorkReviewSignature?: string
}

export interface MessageInfo {
  id?: string
  role?: string
  error?: { name?: string; data?: unknown }
  agent?: string
  model?: { providerID: string; modelID: string }
  providerID?: string
  modelID?: string
  tools?: Record<string, ToolPermission>
}

export interface ResolvedMessageInfo {
  agent?: string
  model?: { providerID: string; modelID: string }
  tools?: Record<string, ToolPermission>
}

export interface ResolveLatestMessageInfoResult {
  resolvedInfo?: ResolvedMessageInfo
  encounteredCompaction: boolean
}
