import type { PluginInput } from "@opencode-ai/plugin"

import type { BackgroundManager } from "../../features/background-agent"
import {
  clearUltraworkAutonomousSession,
  getMainSessionID,
  getSessionAgent,
  isAutonomousSessionAgent,
  isUltraworkAutonomousSession,
  setUltraworkAutonomousSession,
  updateSessionAgent,
  isAgentRegistered,
} from "../../features/claude-code-session-state"
import type { ToolPermission } from "../../features/hook-message-injector"
import {
  markRuntimeWorkflowTerminalMessageHandled,
  reconcileRuntimeWorkflowTodoGraph,
  readBoulderState,
  createBoulderState,
  writeBoulderState,
  parseLatestAcceptanceReviewBlocker,
  parseLatestAcceptanceReviewOutcome,
  readRuntimeWorkflowState,
  updateRuntimeWorkflowReviewOutcome,
} from "../../features/boulder-state"
import { normalizeSDKResponse } from "../../shared"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { OMO_INTERNAL_INITIATOR_MARKER } from "../../shared/internal-initiator-marker"
import { log } from "../../shared/logger"

import {
  AUTONOMOUS_MAX_BACKLOG_EXPANSIONS_PER_COUNT,
  AUTONOMOUS_MIN_TODO_COUNT,
  ABORT_WINDOW_MS,
  AUTONOMOUS_CONTINUATION_COOLDOWN_MS,
  AUTONOMOUS_MAX_CONSECUTIVE_FAILURES,
  CONTINUATION_COOLDOWN_MS,
  DEFAULT_SKIP_AGENTS,
  FAILURE_RESET_WINDOW_MS,
  HOOK_NAME,
  MAX_CONSECUTIVE_FAILURES,
} from "./constants"
import { isLastAssistantMessageAborted } from "./abort-detection"
import { acknowledgeCompactionGuard, isCompactionGuardActive } from "./compaction-guard"
import { detectLatestAssistantCompletionPosture } from "./completion-posture-detection"
import { startCountdown } from "./countdown"
import { hasContinuationIntent } from "./continuation-intent-detection"
import { hasUnansweredQuestion } from "./pending-question-detection"
import { resolveLatestMessageInfo } from "./resolve-message-info"
import type { MessageInfo, ResolvedMessageInfo, Todo } from "./types"
import type { SessionStateStore } from "./session-state"
import { shouldStopForStagnation } from "./stagnation-detection"
import { shouldSuppressStaleTodoSnapshot } from "./stale-todo-guard"
import { getActiveStructuredTodos, getAgentOwnedStructuredTodoCount, getIncompleteCount, getTodoSnapshot } from "./todo"
import { injectContinuationReplan } from "./continuation-injection"
import { injectAutonomousBacklogExpansion } from "./continuation-injection"
import { injectAutonomousCompletionAudit } from "./continuation-injection"
import { injectAutonomousReviewRework } from "./continuation-injection"
import { injectAutonomousHeavyPlanBootstrap } from "./continuation-injection"

function extractLastRealUserAgent(messages: Array<{ info?: MessageInfo; parts?: Array<{ type?: string; text?: string }> }>): string | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message.info?.role !== "user") continue

    const combinedText = (message.parts ?? [])
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("\n")

    if (combinedText.includes(OMO_INTERNAL_INITIATOR_MARKER)) {
      continue
    }
    if (combinedText.includes("▣ DCP |") || combinedText.includes("Compression #")) {
      continue
    }

    return message.info?.agent
  }

  return undefined
}

function extractLatestSessionAgent(
  messages: Array<{ info?: MessageInfo; parts?: Array<{ type?: string; text?: string }> }>
): string | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const agent = messages[index].info?.agent
    if (agent === "compaction") {
      continue
    }
    if (typeof agent === "string" && agent.length > 0) {
      return agent
    }
  }

  return undefined
}

function resolveAutoBootstrapAgent(args: {
  rememberedSessionAgent?: string
  latestSessionAgent?: string
  runtimeActiveAgent?: string
  runtimePlanPath?: string
}): string {
  const candidates = [args.latestSessionAgent, args.rememberedSessionAgent, args.runtimeActiveAgent]
  for (const candidate of candidates) {
    if (candidate && isAutonomousSessionAgent(candidate)) {
      const key = getAgentConfigKey(candidate)
      return key === "bio-orchestrator" ? "bio-autopilot" : key
    }
  }

  const scope = `${args.runtimePlanPath ?? ""}`.toLowerCase()
  const looksBio = /bio|bioinformatics|rna|genome|proteomics|wet-lab|生物|生信|组学/u.test(scope)
  if (looksBio && isAgentRegistered("bio-autopilot")) {
    return "bio-autopilot"
  }

  return isAgentRegistered("wase") ? "wase" : "sisyphus"
}

// Follow upstream continuation gating closely: compaction and stagnation are the
// two main protections that keep idle sessions from being re-prompted forever.
// We retain our autonomous cooldown/failure tuning on top of that base flow.
export async function handleSessionIdle(args: {
  ctx: PluginInput
  sessionID: string
  sessionStateStore: SessionStateStore
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    sessionStateStore,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    isContinuationStopped,
  } = args

  log(`[${HOOK_NAME}] session.idle`, { sessionID })

  const state = sessionStateStore.getState(sessionID)
  const observedCompactionEpoch = state.recentCompactionEpoch
  const rememberedSessionAgent = getSessionAgent(sessionID)
  let isAutonomous =
    isUltraworkAutonomousSession(sessionID) ||
    isAutonomousSessionAgent(rememberedSessionAgent)
  let lastRealUserAgent: string | undefined
  let latestSessionAgent: string | undefined
  let latestCompletionPosture = detectLatestAssistantCompletionPosture([])
  let latestReviewBlocker = null as ReturnType<typeof parseLatestAcceptanceReviewBlocker>
  const mainSessionID = getMainSessionID()
  const isMainSession = mainSessionID === sessionID
  const activeBoulderState = readBoulderState(ctx.directory)
  const isTrackedBoulderSession =
    activeBoulderState?.session_ids?.includes(sessionID) === true
  if (state.isRecovering) {
    log(`[${HOOK_NAME}] Skipped: in recovery`, { sessionID })
    return
  }

  if (state.abortDetectedAt) {
    const timeSinceAbort = Date.now() - state.abortDetectedAt
    if (timeSinceAbort < ABORT_WINDOW_MS) {
      log(`[${HOOK_NAME}] Skipped: abort detected via event ${timeSinceAbort}ms ago`, { sessionID })
      state.abortDetectedAt = undefined
      return
    }
    state.abortDetectedAt = undefined
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped: background tasks running`, { sessionID })
    return
  }

  try {
    const messagesResp = await ctx.client.session.messages({
      path: { id: sessionID },
      query: { directory: ctx.directory },
    })
    const messages = normalizeSDKResponse(messagesResp, [] as Array<{ info?: MessageInfo }>)
    if (isLastAssistantMessageAborted(messages)) {
      log(`[${HOOK_NAME}] Skipped: last assistant message was aborted (API fallback)`, { sessionID })
      return
    }
    if (hasUnansweredQuestion(messages)) {
      log(`[${HOOK_NAME}] Skipped: pending question awaiting user response`, { sessionID })
      return
    }
    latestCompletionPosture = detectLatestAssistantCompletionPosture(messages)
    state.hasContinuationIntent = hasContinuationIntent(messages)
    latestSessionAgent = extractLatestSessionAgent(messages)
    if (!isAutonomous && latestSessionAgent && isAutonomousSessionAgent(latestSessionAgent)) {
      updateSessionAgent(sessionID, latestSessionAgent)
      setUltraworkAutonomousSession(sessionID, true)
      isAutonomous = true
    }

    lastRealUserAgent = extractLastRealUserAgent(messages)
    if (lastRealUserAgent && !isAutonomousSessionAgent(lastRealUserAgent)) {
      if (isUltraworkAutonomousSession(sessionID)) {
        clearUltraworkAutonomousSession(sessionID)
      }
      updateSessionAgent(sessionID, lastRealUserAgent)
      isAutonomous = false
    }

    const latestManualNonAutonomousWaveLeftTodoUntouched =
      lastRealUserAgent !== undefined &&
      latestSessionAgent !== undefined &&
      !isAutonomousSessionAgent(lastRealUserAgent) &&
      !isAutonomousSessionAgent(latestSessionAgent) &&
      state.lastUserGuidanceAt !== undefined &&
      (
        state.lastTodoGraphTouchAt === undefined ||
        state.lastTodoGraphTouchAt < state.lastUserGuidanceAt
      )

    if (latestManualNonAutonomousWaveLeftTodoUntouched) {
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Skipped: manual non-autonomous follow-up left the todo graph untouched`, {
        sessionID,
        lastRealUserAgent,
        latestSessionAgent,
      })
      return
    }

    if (
      isMainSession &&
      lastRealUserAgent &&
      !isAutonomous &&
      !isTrackedBoulderSession &&
      !state.hasContinuationIntent
    ) {
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Skipped: ordinary main-session chat without active execution workflow`, {
        sessionID,
      })
      return
    }

    const parsedReviewOutcome = parseLatestAcceptanceReviewOutcome(messages)
    latestReviewBlocker = parseLatestAcceptanceReviewBlocker(messages)
    const runtimeState = readRuntimeWorkflowState(ctx.directory, sessionID)
    if (parsedReviewOutcome && runtimeState) {
      const alreadyRecorded = runtimeState.last_review_signature === parsedReviewOutcome.signature
      if (!alreadyRecorded) {
        updateRuntimeWorkflowReviewOutcome({
          directory: ctx.directory,
          sessionId: sessionID,
          verdict: parsedReviewOutcome.verdict,
          blockingFindings: parsedReviewOutcome.blockingFindings,
          nextStage: parsedReviewOutcome.nextStage,
          signature: parsedReviewOutcome.signature,
          note:
            parsedReviewOutcome.verdict === "approve"
              ? "Acceptance review approved the current delivery."
              : `Acceptance review rejected the current delivery. ${parsedReviewOutcome.blockingFindings.length} blocking finding(s) captured.`,
        })
      }
    }

    const shouldAutoBootstrapStartWork =
      isAutonomous &&
      !isTrackedBoulderSession &&
      runtimeState?.current_stage === "plan" &&
      parsedReviewOutcome?.verdict === "approve" &&
      parsedReviewOutcome.signature !== state.lastAutoStartWorkReviewSignature

    if (shouldAutoBootstrapStartWork && runtimeState?.active_plan) {
      const autoAgent = resolveAutoBootstrapAgent({
        rememberedSessionAgent,
        latestSessionAgent,
        runtimeActiveAgent: runtimeState.active_agent,
        runtimePlanPath: runtimeState.active_plan,
      })

      const bootstrapState = createBoulderState(
        runtimeState.active_plan,
        sessionID,
        autoAgent,
        runtimeState.worktree_path,
      )
      writeBoulderState(ctx.directory, bootstrapState)
      updateSessionAgent(sessionID, autoAgent)
      setUltraworkAutonomousSession(sessionID, true)
      state.lastAutoStartWorkReviewSignature = parsedReviewOutcome.signature

      log(`[${HOOK_NAME}] Auto mode bootstrapped tracked execution after approved planning review`, {
        sessionID,
        activePlan: runtimeState.active_plan,
        autoAgent,
      })

      return
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Messages fetch failed, continuing`, { sessionID, error: String(error) })
  }

  let todos: Todo[] = []
  try {
    const response = await ctx.client.session.todo({ path: { id: sessionID } })
    todos = normalizeSDKResponse(response, [] as Todo[], { preferResponseOnMissingData: true })
  } catch (error) {
    log(`[${HOOK_NAME}] Todo fetch failed`, { sessionID, error: String(error) })
    return
  }

  if (!todos || todos.length === 0) {
    if (state.hasContinuationIntent) {
      await injectContinuationReplan({
        ctx,
        sessionID,
        backgroundManager,
        skipAgents,
        sessionStateStore,
        isContinuationStopped,
      })
      return
    }
    sessionStateStore.resetContinuationProgress(sessionID)
    log(`[${HOOK_NAME}] No todos`, { sessionID })
    return
  }

  const incompleteCount = getIncompleteCount(todos)
  const currentTodoSnapshot = getTodoSnapshot(todos)
  if (
    state.suppressedTodoSnapshot &&
    state.suppressedTodoSnapshot !== currentTodoSnapshot
  ) {
    state.suppressedTodoSnapshot = undefined
  }
  const runtimeState = readRuntimeWorkflowState(ctx.directory, sessionID)
  const reconciledRuntimeState = reconcileRuntimeWorkflowTodoGraph({
    directory: ctx.directory,
    sessionId: sessionID,
    todos,
    note: "Runtime todo graph reconciled from the latest session todo snapshot.",
  }) ?? runtimeState
  const activeStructuredTodos = getActiveStructuredTodos(reconciledRuntimeState?.structured_todos)
  const agentOwnedStructuredTodoCount = getAgentOwnedStructuredTodoCount(reconciledRuntimeState?.structured_todos)
  const autoModeLevel = reconciledRuntimeState?.auto_mode_level ?? (isAutonomous ? "light" : undefined)
  const interactionMode = reconciledRuntimeState?.interaction_mode ?? (isAutonomous ? "batch" : undefined)
  const isHeavyAutonomous = isAutonomous && autoModeLevel !== "light"
  const shouldAutoContinueAcrossWaves = isAutonomous && interactionMode !== "batch"
  const completionAuditLimit = isAutonomous
    ? (isHeavyAutonomous ? 2 : 1)
    : 0
  const hasApprovedAutonomousReview =
    isAutonomous && reconciledRuntimeState?.last_review_verdict === "approve"

  const markBatchTerminalStop = (note: string): void => {
    state.lastApprovedTodoSnapshot = currentTodoSnapshot
    state.lastHandledCompletionSignature = latestCompletionPosture.signature
    if (latestCompletionPosture.signature && reconciledRuntimeState) {
      markRuntimeWorkflowTerminalMessageHandled({
        directory: ctx.directory,
        sessionId: sessionID,
        signature: latestCompletionPosture.signature,
        note,
      })
    }
  }

  if (
    isAutonomous &&
    interactionMode === "batch" &&
    hasApprovedAutonomousReview
  ) {
    markBatchTerminalStop("Batch review already approved. Hold position until explicit user follow-up.")
    sessionStateStore.resetContinuationProgress(sessionID)
    log(`[${HOOK_NAME}] Batch autonomous session already approved; awaiting explicit user follow-up`, {
      sessionID,
      incompleteCount,
      totalTodos: todos.length,
    })
    return
  }

  const staleTodoGuard = shouldSuppressStaleTodoSnapshot({
    state,
    currentTodoSnapshot,
    hasContinuationIntent: state.hasContinuationIntent === true,
    hasTrackedRuntimeWorkflow: isTrackedBoulderSession || reconciledRuntimeState !== null,
    isMainSession,
    isAutonomous,
    lastRealUserAgent,
  })
  if (staleTodoGuard.suppress) {
    state.suppressedTodoSnapshot = currentTodoSnapshot
    sessionStateStore.resetContinuationProgress(sessionID)
    log(`[${HOOK_NAME}] Skipped: stale todo snapshot suppressed`, {
      sessionID,
      reason: staleTodoGuard.reason,
      incompleteCount,
      totalTodos: todos.length,
    })
    return
  }

  if (incompleteCount === 0) {
    if (
      isAutonomous &&
      latestReviewBlocker &&
      latestCompletionPosture.kind !== "pseudo_complete"
    ) {
      const blockerSignature = `${latestCompletionPosture.signature ?? "terminal"}::${latestReviewBlocker.signature}`
      if (
        reconciledRuntimeState?.last_terminal_message_signature === blockerSignature ||
        state.lastHandledCompletionSignature === blockerSignature
      ) {
        sessionStateStore.resetContinuationProgress(sessionID)
        log(`[${HOOK_NAME}] Acceptance-review blocker terminal stop already handled`, {
          sessionID,
          signature: blockerSignature,
        })
        return
      }

      markBatchTerminalStop(
        "Autonomous wave reached a terminal stop with an explicit acceptance-review blocker. Hold position instead of reopening the same work.",
      )
      state.lastHandledCompletionSignature = blockerSignature
      if (reconciledRuntimeState) {
        markRuntimeWorkflowTerminalMessageHandled({
          directory: ctx.directory,
          sessionId: sessionID,
          signature: blockerSignature,
          note: "Autonomous wave stopped because acceptance-review delegation was explicitly unavailable.",
        })
      }
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Autonomous session paused on explicit acceptance-review blocker`, {
        sessionID,
        blockerSignature,
      })
      return
    }

    if (isAutonomous && latestCompletionPosture.kind === "pseudo_complete") {
      const pseudoCompletionAlreadyHandled =
        state.lastHandledCompletionSignature === latestCompletionPosture.signature ||
        reconciledRuntimeState?.last_review_verdict === "reject" &&
        reconciledRuntimeState.last_review_signature === latestCompletionPosture.signature &&
        reconciledRuntimeState.last_review_handled_signature === latestCompletionPosture.signature

      if (pseudoCompletionAlreadyHandled) {
        log(`[${HOOK_NAME}] Pseudo-complete final message already handled; awaiting new execution state`, {
          sessionID,
          signature: latestCompletionPosture.signature,
        })
        return
      }

      if (reconciledRuntimeState && latestCompletionPosture.signature) {
        updateRuntimeWorkflowReviewOutcome({
          directory: ctx.directory,
          sessionId: sessionID,
          verdict: "reject",
          blockingFindings: latestCompletionPosture.blockingFindings,
          nextStage: "plan",
          signature: latestCompletionPosture.signature,
          note: "Completion claim contradicted explicit remaining work in the final assistant message.",
        })
      }

      if (reconciledRuntimeState && latestCompletionPosture.signature) {
        await injectAutonomousReviewRework({
          ctx,
          sessionID,
          nextStage: "plan",
          blockingFindings: latestCompletionPosture.blockingFindings,
          reviewSignature: latestCompletionPosture.signature,
          backgroundManager,
          skipAgents,
          sessionStateStore,
          isContinuationStopped,
        })
      } else {
        state.lastHandledCompletionSignature = latestCompletionPosture.signature
        await injectContinuationReplan({
          ctx,
          sessionID,
          backgroundManager,
          skipAgents,
          sessionStateStore,
          isContinuationStopped,
        })
      }
      return
    }

    if (isAutonomous && latestCompletionPosture.kind === "external_wait") {
      if (
        reconciledRuntimeState?.last_terminal_message_signature === latestCompletionPosture.signature ||
        state.lastHandledCompletionSignature === latestCompletionPosture.signature
      ) {
        sessionStateStore.resetContinuationProgress(sessionID)
        log(`[${HOOK_NAME}] External-wait completion already handled`, {
          sessionID,
          signature: latestCompletionPosture.signature,
        })
        return
      }

      markBatchTerminalStop("Autonomous wave paused because only user-owned or external pending work remains.")
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Autonomous session paused on external/user-owned pending work`, {
        sessionID,
        signature: latestCompletionPosture.signature,
      })
      return
    }

    if (
      isAutonomous &&
      interactionMode === "batch" &&
      latestCompletionPosture.kind === "terminal_complete" &&
      hasApprovedAutonomousReview
    ) {
      if (
        reconciledRuntimeState?.last_terminal_message_signature === latestCompletionPosture.signature ||
        state.lastHandledCompletionSignature === latestCompletionPosture.signature
      ) {
        sessionStateStore.resetContinuationProgress(sessionID)
        log(`[${HOOK_NAME}] Terminal completion already handled for this batch message`, {
          sessionID,
          signature: latestCompletionPosture.signature,
        })
        return
      }

      markBatchTerminalStop("Batch completion was accepted from the terminal assistant message after approved acceptance review.")
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Batch autonomous session reached clean terminal completion after approved review`, {
        sessionID,
        signature: latestCompletionPosture.signature,
      })
      return
    }

    if (
      isAutonomous &&
      reconciledRuntimeState?.last_review_verdict === "reject" &&
      reconciledRuntimeState.last_review_signature &&
      reconciledRuntimeState.last_review_signature !== reconciledRuntimeState.last_review_handled_signature
    ) {
      const nextStage = reconciledRuntimeState.next_stage === "plan" ? "plan" : "build"
      await injectAutonomousReviewRework({
        ctx,
        sessionID,
        nextStage,
        blockingFindings: reconciledRuntimeState.blocking_findings ?? [],
        reviewSignature: reconciledRuntimeState.last_review_signature,
        backgroundManager,
        skipAgents,
        sessionStateStore,
        isContinuationStopped,
      })
      return
    }

    if (hasApprovedAutonomousReview) {
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Autonomous review approved completion`, { sessionID })
      return
    }
    if (
      isAutonomous &&
      activeStructuredTodos.length > 0 &&
      agentOwnedStructuredTodoCount === 0
    ) {
      sessionStateStore.resetContinuationProgress(sessionID)
      log(`[${HOOK_NAME}] Autonomous session paused: only external or user-owned todo items remain`, {
        sessionID,
        activeStructuredTodos: activeStructuredTodos.map((todo) => ({
          kind: todo.kind,
          owner: todo.owner,
          content: todo.content,
          status: todo.status,
        })),
      })
      return
    }

    if (isAutonomous && (state.completionAuditCount ?? 0) < completionAuditLimit) {
      await injectAutonomousCompletionAudit({
        ctx,
        sessionID,
        backgroundManager,
        skipAgents,
        sessionStateStore,
        isContinuationStopped,
      })
      return
    }
    if (isAutonomous) {
      const missingReviewSignature = latestCompletionPosture.signature
        ? `missing-review:${latestCompletionPosture.signature}`
        : `missing-review:${sessionID}:${state.completionAuditCount ?? 0}`
      const missingReviewFindings = [
        "Autonomous execution attempted to stop without a recorded acceptance-reviewer verdict.",
        "Run `task(subagent_type=\"acceptance-reviewer\", run_in_background=false, load_skills=[], prompt=\"Original goal: ... Changed files/artifacts: ... Verification evidence: ... Residual assumptions/risks: ... Return [APPROVE] or [REJECT].\")` before stopping.",
      ]
      const missingReviewAlreadyHandled =
        reconciledRuntimeState?.last_review_verdict === "reject" &&
        reconciledRuntimeState.last_review_signature === missingReviewSignature &&
        reconciledRuntimeState.last_review_handled_signature === missingReviewSignature

      if (missingReviewAlreadyHandled) {
        sessionStateStore.resetContinuationProgress(sessionID)
        log(`[${HOOK_NAME}] Missing-review terminal stop already handled; awaiting new execution state`, {
          sessionID,
          signature: missingReviewSignature,
        })
        return
      }

      if (reconciledRuntimeState) {
        updateRuntimeWorkflowReviewOutcome({
          directory: ctx.directory,
          sessionId: sessionID,
          verdict: "reject",
          blockingFindings: missingReviewFindings,
          nextStage: "build",
          signature: missingReviewSignature,
          note: "Autonomous wave attempted to stop without a recorded acceptance-reviewer verdict.",
        })
        await injectAutonomousReviewRework({
          ctx,
          sessionID,
          nextStage: "build",
          blockingFindings: missingReviewFindings,
          reviewSignature: missingReviewSignature,
          backgroundManager,
          skipAgents,
          sessionStateStore,
          isContinuationStopped,
        })
      } else {
        state.lastHandledCompletionSignature = missingReviewSignature
        await injectContinuationReplan({
          ctx,
          sessionID,
          backgroundManager,
          skipAgents,
          sessionStateStore,
          isContinuationStopped,
        })
      }
      return
    }
    if (state.hasContinuationIntent && (!isAutonomous || shouldAutoContinueAcrossWaves)) {
      await injectContinuationReplan({
        ctx,
        sessionID,
        backgroundManager,
        skipAgents,
        sessionStateStore,
        isContinuationStopped,
      })
      return
    }
    sessionStateStore.resetContinuationProgress(sessionID)
    log(`[${HOOK_NAME}] All todos complete`, { sessionID, total: todos.length })
    return
  }

  state.completionAuditCount = 0

  if (state.inFlight) {
    log(`[${HOOK_NAME}] Skipped: injection in flight`, { sessionID })
    return
  }

  if (
    state.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES
    && state.lastInjectedAt
    && Date.now() - state.lastInjectedAt >= FAILURE_RESET_WINDOW_MS
  ) {
    state.consecutiveFailures = 0
    log(`[${HOOK_NAME}] Reset consecutive failures after recovery window`, {
      sessionID,
      failureResetWindowMs: FAILURE_RESET_WINDOW_MS,
    })
  }

  const maxConsecutiveFailures = isAutonomous
    ? AUTONOMOUS_MAX_CONSECUTIVE_FAILURES
    : MAX_CONSECUTIVE_FAILURES

  if (state.consecutiveFailures >= maxConsecutiveFailures) {
    log(`[${HOOK_NAME}] Skipped: max consecutive failures reached`, {
      sessionID,
      consecutiveFailures: state.consecutiveFailures,
      maxConsecutiveFailures,
      isAutonomous,
    })
    return
  }

  const baseCooldownMs = isAutonomous
    ? AUTONOMOUS_CONTINUATION_COOLDOWN_MS
    : CONTINUATION_COOLDOWN_MS
  const effectiveCooldown = baseCooldownMs * Math.pow(2, Math.min(state.consecutiveFailures, 5))
  if (state.lastInjectedAt && Date.now() - state.lastInjectedAt < effectiveCooldown) {
    log(`[${HOOK_NAME}] Skipped: cooldown active`, {
      sessionID,
      effectiveCooldown,
      baseCooldownMs,
      isAutonomous,
      consecutiveFailures: state.consecutiveFailures,
    })
    return
  }

  let resolvedInfo: ResolvedMessageInfo | undefined
  let encounteredCompaction = false
  try {
    const messageInfoResult = await resolveLatestMessageInfo(ctx, sessionID)
    resolvedInfo = messageInfoResult.resolvedInfo
    encounteredCompaction = messageInfoResult.encounteredCompaction
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to fetch messages for agent check`, { sessionID, error: String(error) })
  }

  if (!resolvedInfo?.agent && rememberedSessionAgent) {
    resolvedInfo = { ...resolvedInfo, agent: rememberedSessionAgent }
  }

  const acknowledgedCompaction = resolvedInfo?.agent
    ? acknowledgeCompactionGuard(state, observedCompactionEpoch)
    : false
  const compactionGuardActive = isCompactionGuardActive(state, Date.now())

  log(`[${HOOK_NAME}] Agent check`, {
    sessionID,
    agentName: resolvedInfo?.agent,
    skipAgents,
    compactionGuardActive,
    observedCompactionEpoch,
    currentCompactionEpoch: state.recentCompactionEpoch,
    acknowledgedCompaction,
  })

  const resolvedAgentName = resolvedInfo?.agent
  if (!isAutonomous && isAutonomousSessionAgent(resolvedAgentName)) {
    isAutonomous = true
    setUltraworkAutonomousSession(sessionID, true)
  }
  if (resolvedAgentName && skipAgents.some((agent) => getAgentConfigKey(agent) === getAgentConfigKey(resolvedAgentName))) {
    log(`[${HOOK_NAME}] Skipped: agent in skipAgents list`, { sessionID, agent: resolvedAgentName })
    return
  }
  if ((compactionGuardActive || encounteredCompaction) && !resolvedInfo?.agent) {
    log(`[${HOOK_NAME}] Skipped: compaction occurred but no agent info resolved`, { sessionID })
    return
  }
  if (compactionGuardActive) {
    log(`[${HOOK_NAME}] Skipped: compaction guard still armed for current epoch`, {
      sessionID,
      observedCompactionEpoch,
      currentCompactionEpoch: state.recentCompactionEpoch,
    })
    return
  }

  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped: continuation stopped for session`, { sessionID })
    return
  }

  if (isHeavyAutonomous) {
    const shouldBootstrapHeavyPlan =
      !state.heavyPlanBootstrapDone
      && (reconciledRuntimeState?.current_stage ?? "plan") === "plan"
    if (shouldBootstrapHeavyPlan) {
      const injected = await injectAutonomousHeavyPlanBootstrap({
        ctx,
        sessionID,
        backgroundManager,
        skipAgents,
        resolvedInfo,
        sessionStateStore,
        isContinuationStopped,
      })
      if (injected) {
        return
      }
    }

    if (todos.length >= AUTONOMOUS_MIN_TODO_COUNT) {
      state.backlogExpansionCount = 0
      state.lastBacklogExpansionTodoCount = todos.length
    } else {
      if (state.lastBacklogExpansionTodoCount !== todos.length) {
        state.backlogExpansionCount = 0
        state.lastBacklogExpansionTodoCount = todos.length
      }

      if ((state.backlogExpansionCount ?? 0) < AUTONOMOUS_MAX_BACKLOG_EXPANSIONS_PER_COUNT) {
        await injectAutonomousBacklogExpansion({
          ctx,
          sessionID,
          currentTodoCount: todos.length,
          incompleteCount,
          backgroundManager,
          skipAgents,
          resolvedInfo,
          sessionStateStore,
          isContinuationStopped,
        })
        return
      }
    }
  }

  // Upstream only increments stagnation after a successful continuation prompt.
  // This prevents false positives on sessions that are merely idle but not yet re-injected.
  const progressUpdate = sessionStateStore.trackContinuationProgress(sessionID, incompleteCount, todos)
  if (shouldStopForStagnation({ sessionID, incompleteCount, progressUpdate })) {
    return
  }

  startCountdown({
    ctx,
    sessionID,
    incompleteCount,
    total: todos.length,
    resolvedInfo,
    backgroundManager,
    skipAgents,
    sessionStateStore,
    isContinuationStopped,
  })
}
