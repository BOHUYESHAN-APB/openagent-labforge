import type { PluginInput } from "@opencode-ai/plugin"

import type { BackgroundManager } from "../../features/background-agent"
import {
  getSessionAgent,
  isAutonomousSessionAgent,
  isUltraworkAutonomousSession,
} from "../../features/claude-code-session-state"
import {
  markRuntimeWorkflowReviewHandled,
  readRuntimeWorkflowState,
  updateRuntimeWorkflowStage,
} from "../../features/boulder-state"
import {
  createInternalAgentTextPart,
  normalizeSDKResponse,
  resolveInheritedPromptTools,
} from "../../shared"
import { getSessionModelLock } from "../../shared/session-model-state"
import {
  findNearestMessageWithFields,
  findNearestMessageWithFieldsFromSDK,
  type ToolPermission,
} from "../../features/hook-message-injector"
import { log } from "../../shared/logger"
import { isSqliteBackend } from "../../shared/opencode-storage-detection"
import { getAgentConfigKey, getAgentDisplayName } from "../../shared/agent-display-names"

import {
  AUTONOMOUS_BACKLOG_EXPANSION_PROMPT,
  AUTONOMOUS_REVIEW_REWORK_PROMPT,
  CONTINUATION_REPLAN_PROMPT,
  AUTONOMOUS_COMPLETION_AUDIT_PROMPT,
  AUTONOMOUS_CONTINUATION_PROMPT,
  CONTINUATION_PROMPT,
  DEFAULT_SKIP_AGENTS,
  HOOK_NAME,
} from "./constants"
import { isCompactionGuardActive } from "./compaction-guard"
import { getMessageDir } from "./message-directory"
import { getIncompleteCount } from "./todo"
import type { ResolvedMessageInfo, Todo } from "./types"
import type { SessionStateStore } from "./session-state"

function hasWritePermission(tools: Record<string, ToolPermission> | undefined): boolean {
  const editPermission = tools?.edit
  const writePermission = tools?.write
  return (
    !tools ||
    (editPermission !== false && editPermission !== "deny" && writePermission !== false && writePermission !== "deny")
  )
}

function buildWorkflowModeContext(args: {
  directory: string
  sessionID: string
  fallbackAutoModeLevel?: "light" | "heavy"
  fallbackInteractionMode?: "batch" | "continuous"
}): string {
  const {
    directory,
    sessionID,
    fallbackAutoModeLevel,
    fallbackInteractionMode,
  } = args
  const runtimeState = readRuntimeWorkflowState(directory, sessionID)
  const autoModeLevel = runtimeState?.auto_mode_level ?? fallbackAutoModeLevel
  const interactionMode = runtimeState?.interaction_mode ?? fallbackInteractionMode
  if (!autoModeLevel || !interactionMode) return ""

  const lines = [
    `[Auto mode: ${autoModeLevel}]`,
    `[Interaction mode: ${interactionMode}]`,
  ]

  if (interactionMode === "batch") {
    lines.push("- This session is operating in batch mode: finish the current reviewed wave cleanly before inventing a brand-new wave.")
  } else {
    lines.push("- This session is operating in continuous mode: if obvious work remains after the current wave, continue into the next wave instead of pausing.")
  }

  if (autoModeLevel === "light") {
    lines.push("- This session is in light autonomous mode: do not inflate the backlog unnecessarily; keep the current batch tight and reviewable.")
  } else if (autoModeLevel === "heavy") {
    lines.push("- This session is in heavy autonomous mode: maintain a durable backlog and keep the multi-wave execution graph explicit.")
  }

  return lines.join("\n")
}

function toRuntimeAgentName(agentName: string | undefined): string | undefined {
  if (!agentName) return undefined
  return getAgentDisplayName(getAgentConfigKey(agentName))
}

function preferSessionLockedModel(
  sessionID: string,
  model?: { providerID: string; modelID: string; variant?: string },
): { providerID: string; modelID: string; variant?: string } | undefined {
  const lockedModel = getSessionModelLock(sessionID)
  if (!lockedModel) {
    return model
  }

  if (
    model &&
    model.providerID === lockedModel.providerID &&
    model.modelID === lockedModel.modelID
  ) {
    return model
  }

  return {
    providerID: lockedModel.providerID,
    modelID: lockedModel.modelID,
  }
}

export async function injectContinuation(args: {
  ctx: PluginInput
  sessionID: string
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    isContinuationStopped,
  } = args

  const state = sessionStateStore.getExistingState(sessionID)
  if (state?.isRecovering) {
    log(`[${HOOK_NAME}] Skipped injection: in recovery`, { sessionID })
    return
  }

  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped injection: continuation stopped for session`, { sessionID })
    return
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped injection: background tasks running`, { sessionID })
    return
  }

  let todos: Todo[] = []
  try {
    const response = await ctx.client.session.todo({ path: { id: sessionID } })
    todos = normalizeSDKResponse(response, [] as Todo[], { preferResponseOnMissingData: true })
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to fetch todos`, { sessionID, error: String(error) })
    return
  }

  const freshIncompleteCount = getIncompleteCount(todos)
  if (freshIncompleteCount === 0) {
    log(`[${HOOK_NAME}] Skipped injection: no incomplete todos`, { sessionID })
    return
  }

  let agentName = resolvedInfo?.agent ?? getSessionAgent(sessionID)
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    let previousMessage = null
    if (isSqliteBackend()) {
      previousMessage = await findNearestMessageWithFieldsFromSDK(ctx.client, sessionID)
    } else {
      const messageDir = getMessageDir(sessionID)
      previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    }
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant
              ? { variant: previousMessage.model.variant }
              : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }
  model = preferSessionLockedModel(sessionID, model)

  if (agentName && skipAgents.some(s => getAgentConfigKey(s) === getAgentConfigKey(agentName))) {
    log(`[${HOOK_NAME}] Skipped: agent in skipAgents list`, { sessionID, agent: agentName })
    return
  }

  if (!agentName) {
    const compactionState = sessionStateStore.getExistingState(sessionID)
    if (compactionState && isCompactionGuardActive(compactionState, Date.now())) {
      log(`[${HOOK_NAME}] Skipped: agent unknown after compaction`, { sessionID })
      return
    }
  }

  if (!hasWritePermission(tools)) {
    log(`[${HOOK_NAME}] Skipped: agent lacks write permission`, { sessionID, agent: agentName })
    return
  }

  const incompleteTodos = todos.filter((todo) => todo.status !== "completed" && todo.status !== "cancelled")
  const todoList = incompleteTodos.map((todo) => `- [${todo.status}] ${todo.content}`).join("\n")
  const isAutonomous =
    isUltraworkAutonomousSession(sessionID) ||
    isAutonomousSessionAgent(agentName)
  const workflowModeContext = isAutonomous
    ? buildWorkflowModeContext({
        directory: ctx.directory,
        sessionID,
        fallbackAutoModeLevel: "light",
        fallbackInteractionMode: "batch",
      })
    : ""
  const basePrompt = isAutonomous ? AUTONOMOUS_CONTINUATION_PROMPT : CONTINUATION_PROMPT

  const prompt = `${basePrompt}

${workflowModeContext ? `${workflowModeContext}\n` : ""}

[Status: ${todos.length - freshIncompleteCount}/${todos.length} completed, ${freshIncompleteCount} remaining]

Remaining tasks:
${todoList}`

  const injectionState = sessionStateStore.getExistingState(sessionID)
  if (injectionState) {
    injectionState.inFlight = true
  }
  const runtimeAgentName = toRuntimeAgentName(agentName)

  try {
    const internalPromptAt = Date.now()
    if (injectionState) {
      injectionState.lastInternalPromptAt = internalPromptAt
    }
    log(`[${HOOK_NAME}] Injecting continuation`, {
      sessionID,
      agent: agentName,
      model,
      incompleteCount: freshIncompleteCount,
    })
    updateRuntimeWorkflowStage({
      directory: ctx.directory,
      sessionId: sessionID,
      currentStage: "build",
      note: `Continuation injected with ${freshIncompleteCount} incomplete todo item(s) still remaining.`,
    })

    const inheritedTools = resolveInheritedPromptTools(sessionID, tools)

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        ...(runtimeAgentName ? { agent: runtimeAgentName } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(inheritedTools ? { tools: inheritedTools } : {}),
        parts: [createInternalAgentTextPart(prompt)],
      },
      query: { directory: ctx.directory },
    })

    log(`[${HOOK_NAME}] Injection successful`, { sessionID })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = internalPromptAt
      injectionState.awaitingPostInjectionProgressCheck = true
      injectionState.consecutiveFailures = 0
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Injection failed`, { sessionID, error: String(error) })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = Date.now()
      injectionState.consecutiveFailures = (injectionState.consecutiveFailures ?? 0) + 1
    }
  }
}

export async function injectContinuationReplan(args: {
  ctx: PluginInput
  sessionID: string
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    isContinuationStopped,
  } = args

  const state = sessionStateStore.getExistingState(sessionID)
  if (state?.isRecovering) {
    log(`[${HOOK_NAME}] Skipped replan injection: in recovery`, { sessionID })
    return
  }

  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped replan injection: continuation stopped for session`, { sessionID })
    return
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped replan injection: background tasks running`, { sessionID })
    return
  }

  let agentName = resolvedInfo?.agent ?? getSessionAgent(sessionID)
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    let previousMessage = null
    if (isSqliteBackend()) {
      previousMessage = await findNearestMessageWithFieldsFromSDK(ctx.client, sessionID)
    } else {
      const messageDir = getMessageDir(sessionID)
      previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    }
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant
              ? { variant: previousMessage.model.variant }
              : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }
  model = preferSessionLockedModel(sessionID, model)

  if (agentName && skipAgents.some((agent) => getAgentConfigKey(agent) === getAgentConfigKey(agentName))) {
    log(`[${HOOK_NAME}] Skipped replan injection: agent in skipAgents list`, { sessionID, agent: agentName })
    return
  }

  if (!hasWritePermission(tools)) {
    log(`[${HOOK_NAME}] Skipped replan injection: agent lacks write permission`, { sessionID, agent: agentName })
    return
  }

  const injectionState = sessionStateStore.getExistingState(sessionID)
  if (injectionState) {
    injectionState.inFlight = true
  }
  const runtimeAgentName = toRuntimeAgentName(agentName)

  try {
    const internalPromptAt = Date.now()
    if (injectionState) {
      injectionState.lastInternalPromptAt = internalPromptAt
    }
    log(`[${HOOK_NAME}] Injecting continuation replan`, {
      sessionID,
      agent: agentName,
      model,
    })
    updateRuntimeWorkflowStage({
      directory: ctx.directory,
      sessionId: sessionID,
      currentStage: "plan",
      note: "Continuation replan injected because the session signaled remaining work without a sufficient backlog.",
    })

    const inheritedTools = resolveInheritedPromptTools(sessionID, tools)
    const prompt = `${CONTINUATION_REPLAN_PROMPT}

${buildWorkflowModeContext({
      directory: ctx.directory,
      sessionID,
      fallbackAutoModeLevel: "light",
      fallbackInteractionMode: "batch",
    })}`

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        ...(runtimeAgentName ? { agent: runtimeAgentName } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(inheritedTools ? { tools: inheritedTools } : {}),
        parts: [createInternalAgentTextPart(prompt.trim())],
      },
      query: { directory: ctx.directory },
    })

    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = internalPromptAt
      injectionState.awaitingPostInjectionProgressCheck = true
      injectionState.consecutiveFailures = 0
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Replan injection failed`, { sessionID, error: String(error) })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = Date.now()
      injectionState.consecutiveFailures = (injectionState.consecutiveFailures ?? 0) + 1
    }
  }
}

export async function injectAutonomousCompletionAudit(args: {
  ctx: PluginInput
  sessionID: string
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    isContinuationStopped,
  } = args

  const state = sessionStateStore.getExistingState(sessionID)
  if (state?.isRecovering) {
    log(`[${HOOK_NAME}] Skipped completion audit: in recovery`, { sessionID })
    return
  }

  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped completion audit: continuation stopped for session`, { sessionID })
    return
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped completion audit: background tasks running`, { sessionID })
    return
  }

  let agentName = resolvedInfo?.agent ?? getSessionAgent(sessionID)
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    let previousMessage = null
    if (isSqliteBackend()) {
      previousMessage = await findNearestMessageWithFieldsFromSDK(ctx.client, sessionID)
    } else {
      const messageDir = getMessageDir(sessionID)
      previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    }
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant ? { variant: previousMessage.model.variant } : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }
  model = preferSessionLockedModel(sessionID, model)

  if (agentName && skipAgents.some((agent) => getAgentConfigKey(agent) === getAgentConfigKey(agentName))) {
    log(`[${HOOK_NAME}] Skipped completion audit: agent in skipAgents list`, { sessionID, agent: agentName })
    return
  }

  if (!hasWritePermission(tools)) {
    log(`[${HOOK_NAME}] Skipped completion audit: agent lacks write permission`, { sessionID, agent: agentName })
    return
  }

  const injectionState = sessionStateStore.getExistingState(sessionID)
  if (injectionState) {
    injectionState.inFlight = true
    injectionState.completionAuditCount = (injectionState.completionAuditCount ?? 0) + 1
  }
  const runtimeAgentName = toRuntimeAgentName(agentName)

  try {
    const internalPromptAt = Date.now()
    if (injectionState) {
      injectionState.lastInternalPromptAt = internalPromptAt
    }
    log(`[${HOOK_NAME}] Injecting autonomous completion audit`, {
      sessionID,
      agent: agentName,
      model,
    })
    updateRuntimeWorkflowStage({
      directory: ctx.directory,
      sessionId: sessionID,
      currentStage: "review",
      note: "Autonomous completion audit started. Final claims and verification evidence must now be reviewed before completion.",
    })

    const inheritedTools = resolveInheritedPromptTools(sessionID, tools)
    const prompt = `${AUTONOMOUS_COMPLETION_AUDIT_PROMPT}

${buildWorkflowModeContext({
      directory: ctx.directory,
      sessionID,
      fallbackAutoModeLevel: "light",
      fallbackInteractionMode: "batch",
    })}`

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        ...(runtimeAgentName ? { agent: runtimeAgentName } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(inheritedTools ? { tools: inheritedTools } : {}),
        parts: [createInternalAgentTextPart(prompt.trim())],
      },
      query: { directory: ctx.directory },
    })

    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = internalPromptAt
      injectionState.awaitingPostInjectionProgressCheck = true
      injectionState.consecutiveFailures = 0
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Autonomous completion audit failed`, { sessionID, error: String(error) })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = Date.now()
      injectionState.consecutiveFailures = (injectionState.consecutiveFailures ?? 0) + 1
    }
  }
}

export async function injectAutonomousBacklogExpansion(args: {
  ctx: PluginInput
  sessionID: string
  currentTodoCount: number
  incompleteCount: number
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    currentTodoCount,
    incompleteCount,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    isContinuationStopped,
  } = args

  const state = sessionStateStore.getExistingState(sessionID)
  if (state?.isRecovering) {
    log(`[${HOOK_NAME}] Skipped backlog expansion: in recovery`, { sessionID })
    return
  }

  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped backlog expansion: continuation stopped for session`, { sessionID })
    return
  }

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false

  if (hasRunningBgTasks) {
    log(`[${HOOK_NAME}] Skipped backlog expansion: background tasks running`, { sessionID })
    return
  }

  let agentName = resolvedInfo?.agent ?? getSessionAgent(sessionID)
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    let previousMessage = null
    if (isSqliteBackend()) {
      previousMessage = await findNearestMessageWithFieldsFromSDK(ctx.client, sessionID)
    } else {
      const messageDir = getMessageDir(sessionID)
      previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    }
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant ? { variant: previousMessage.model.variant } : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }
  model = preferSessionLockedModel(sessionID, model)

  if (agentName && skipAgents.some((agent) => getAgentConfigKey(agent) === getAgentConfigKey(agentName))) {
    log(`[${HOOK_NAME}] Skipped backlog expansion: agent in skipAgents list`, { sessionID, agent: agentName })
    return
  }

  if (!hasWritePermission(tools)) {
    log(`[${HOOK_NAME}] Skipped backlog expansion: agent lacks write permission`, { sessionID, agent: agentName })
    return
  }

  const injectionState = sessionStateStore.getExistingState(sessionID)
  if (injectionState) {
    injectionState.inFlight = true
    injectionState.backlogExpansionCount = (injectionState.backlogExpansionCount ?? 0) + 1
    injectionState.lastBacklogExpansionTodoCount = currentTodoCount
  }
  const runtimeAgentName = toRuntimeAgentName(agentName)

  try {
    const internalPromptAt = Date.now()
    if (injectionState) {
      injectionState.lastInternalPromptAt = internalPromptAt
    }
    log(`[${HOOK_NAME}] Injecting autonomous backlog expansion`, {
      sessionID,
      agent: agentName,
      model,
      currentTodoCount,
      incompleteCount,
    })
    updateRuntimeWorkflowStage({
      directory: ctx.directory,
      sessionId: sessionID,
      currentStage: "plan",
      note: `Backlog expansion injected because the autonomous todo graph was too shallow (${currentTodoCount} total / ${incompleteCount} incomplete).`,
    })

    const inheritedTools = resolveInheritedPromptTools(sessionID, tools)
    const prompt = `${AUTONOMOUS_BACKLOG_EXPANSION_PROMPT}

${buildWorkflowModeContext({
      directory: ctx.directory,
      sessionID,
      fallbackAutoModeLevel: "light",
      fallbackInteractionMode: "batch",
    })}

[Current todo count: ${currentTodoCount}]
[Current incomplete count: ${incompleteCount}]`

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        ...(runtimeAgentName ? { agent: runtimeAgentName } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(inheritedTools ? { tools: inheritedTools } : {}),
        parts: [createInternalAgentTextPart(prompt)],
      },
      query: { directory: ctx.directory },
    })

    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = internalPromptAt
      injectionState.awaitingPostInjectionProgressCheck = true
      injectionState.consecutiveFailures = 0
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Autonomous backlog expansion failed`, { sessionID, error: String(error) })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = Date.now()
      injectionState.consecutiveFailures = (injectionState.consecutiveFailures ?? 0) + 1
    }
  }
}

export async function injectAutonomousReviewRework(args: {
  ctx: PluginInput
  sessionID: string
  nextStage: "plan" | "build"
  blockingFindings: string[]
  reviewSignature: string
  backgroundManager?: BackgroundManager
  skipAgents?: string[]
  resolvedInfo?: ResolvedMessageInfo
  sessionStateStore: SessionStateStore
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const {
    ctx,
    sessionID,
    nextStage,
    blockingFindings,
    reviewSignature,
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    resolvedInfo,
    sessionStateStore,
    isContinuationStopped,
  } = args

  const state = sessionStateStore.getExistingState(sessionID)
  if (state?.isRecovering) return
  if (isContinuationStopped?.(sessionID)) return

  const hasRunningBgTasks = backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false
  if (hasRunningBgTasks) return

  let agentName = resolvedInfo?.agent ?? getSessionAgent(sessionID)
  let model = resolvedInfo?.model
  let tools = resolvedInfo?.tools

  if (!agentName || !model) {
    let previousMessage = null
    if (isSqliteBackend()) {
      previousMessage = await findNearestMessageWithFieldsFromSDK(ctx.client, sessionID)
    } else {
      const messageDir = getMessageDir(sessionID)
      previousMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    }
    agentName = agentName ?? previousMessage?.agent
    model =
      model ??
      (previousMessage?.model?.providerID && previousMessage?.model?.modelID
        ? {
            providerID: previousMessage.model.providerID,
            modelID: previousMessage.model.modelID,
            ...(previousMessage.model.variant ? { variant: previousMessage.model.variant } : {}),
          }
        : undefined)
    tools = tools ?? previousMessage?.tools
  }
  model = preferSessionLockedModel(sessionID, model)

  if (agentName && skipAgents.some((agent) => getAgentConfigKey(agent) === getAgentConfigKey(agentName))) return
  if (!hasWritePermission(tools)) return

  const injectionState = sessionStateStore.getExistingState(sessionID)
  if (injectionState) {
    injectionState.inFlight = true
  }
  const runtimeAgentName = toRuntimeAgentName(agentName)

  try {
    const internalPromptAt = Date.now()
    if (injectionState) {
      injectionState.lastInternalPromptAt = internalPromptAt
    }
    const findingsBlock = blockingFindings.length > 0
      ? blockingFindings.map((finding) => `- ${finding}`).join("\n")
      : "- reviewer rejected the work but did not provide structured blocking findings"

    const prompt = `${AUTONOMOUS_REVIEW_REWORK_PROMPT}

${buildWorkflowModeContext({
      directory: ctx.directory,
      sessionID,
      fallbackAutoModeLevel: "light",
      fallbackInteractionMode: "batch",
    })}

[Next stage: ${nextStage.toUpperCase()}]
[Blocking findings]
${findingsBlock}`

    const inheritedTools = resolveInheritedPromptTools(sessionID, tools)

    await ctx.client.session.promptAsync({
      path: { id: sessionID },
      body: {
        ...(runtimeAgentName ? { agent: runtimeAgentName } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(inheritedTools ? { tools: inheritedTools } : {}),
        parts: [createInternalAgentTextPart(prompt)],
      },
      query: { directory: ctx.directory },
    })

    markRuntimeWorkflowReviewHandled({
      directory: ctx.directory,
      sessionId: sessionID,
      signature: reviewSignature,
      nextStage,
      note: `Acceptance review rejected the prior result. Routed automatically to ${nextStage.toUpperCase()} with ${blockingFindings.length} blocking finding(s).`,
    })

    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = internalPromptAt
      injectionState.awaitingPostInjectionProgressCheck = true
      injectionState.consecutiveFailures = 0
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Autonomous review rework failed`, { sessionID, error: String(error) })
    if (injectionState) {
      injectionState.inFlight = false
      injectionState.lastInjectedAt = Date.now()
      injectionState.consecutiveFailures = (injectionState.consecutiveFailures ?? 0) + 1
    }
  }
}
