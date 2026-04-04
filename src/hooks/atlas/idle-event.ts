import type { PluginInput } from "@opencode-ai/plugin"
import { getSessionAgent, isAgentRegistered } from "../../features/claude-code-session-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { injectBoulderContinuation } from "./boulder-continuation-injector"
import { HOOK_NAME } from "./hook-name"
import { getLastAgentFromSession } from "./session-last-agent"
import { resolveActiveBoulderSession } from "./resolve-active-boulder-session"
import type { AtlasHookOptions, SessionState } from "./types"

const CONTINUATION_COOLDOWN_MS = 5000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const RETRY_DELAY_MS = CONTINUATION_COOLDOWN_MS + 1000

function hasRunningBackgroundTasks(sessionID: string, options?: AtlasHookOptions): boolean {
  const backgroundManager = options?.backgroundManager
  return backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false
}

async function injectContinuation(input: {
  ctx: PluginInput
  sessionID: string
  sessionState: SessionState
  options?: AtlasHookOptions
  planName: string
  progress: { total: number; completed: number }
  agent?: string
  worktreePath?: string
}): Promise<void> {
  const remaining = input.progress.total - input.progress.completed
  input.sessionState.lastContinuationInjectedAt = Date.now()

  try {
    await injectBoulderContinuation({
      ctx: input.ctx,
      sessionID: input.sessionID,
      planName: input.planName,
      remaining,
      total: input.progress.total,
      agent: input.agent,
      worktreePath: input.worktreePath,
      backgroundManager: input.options?.backgroundManager,
      sessionState: input.sessionState,
    })
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to inject boulder continuation`, { sessionID: input.sessionID, error })
    input.sessionState.promptFailureCount += 1
  }
}

function scheduleRetry(input: {
  ctx: PluginInput
  sessionID: string
  sessionState: SessionState
  options?: AtlasHookOptions
}): void {
  const { ctx, sessionID, sessionState, options } = input
  if (sessionState.pendingRetryTimer) {
    return
  }

  sessionState.pendingRetryTimer = setTimeout(async () => {
    sessionState.pendingRetryTimer = undefined

    if (sessionState.promptFailureCount >= 2) return

    const currentBoulder = await resolveActiveBoulderSession({
      client: ctx.client,
      directory: ctx.directory,
      sessionID,
    })
    if (!currentBoulder) return
    if (currentBoulder.progress.isComplete) return
    if (options?.isContinuationStopped?.(sessionID)) return
    if (hasRunningBackgroundTasks(sessionID, options)) return

    await injectContinuation({
      ctx,
      sessionID,
      sessionState,
      options,
      planName: currentBoulder.boulderState.plan_name,
      progress: currentBoulder.progress,
      agent: currentBoulder.boulderState.agent,
      worktreePath: currentBoulder.boulderState.worktree_path,
    })
  }, RETRY_DELAY_MS)
}

export async function handleAtlasSessionIdle(input: {
  ctx: PluginInput
  options?: AtlasHookOptions
  getState: (sessionID: string) => SessionState
  sessionID: string
}): Promise<void> {
  const { ctx, options, getState, sessionID } = input

  log(`[${HOOK_NAME}] session.idle`, { sessionID })

  const activeBoulderSession = await resolveActiveBoulderSession({
    client: ctx.client,
    directory: ctx.directory,
    sessionID,
  })
  if (!activeBoulderSession) {
    log(`[${HOOK_NAME}] Skipped: not boulder or background task session`, { sessionID })
    return
  }

  const { boulderState, progress } = activeBoulderSession
  if (progress.isComplete) {
    log(`[${HOOK_NAME}] Boulder complete`, { sessionID, plan: boulderState.plan_name })
    return
  }

  const sessionState = getState(sessionID)
  const now = Date.now()

  if (sessionState.lastEventWasAbortError) {
    sessionState.lastEventWasAbortError = false
    log(`[${HOOK_NAME}] Skipped: abort error immediately before idle`, { sessionID })
    return
  }

  if (sessionState.promptFailureCount >= 2) {
    const timeSinceLastFailure =
      sessionState.lastFailureAt !== undefined ? now - sessionState.lastFailureAt : Number.POSITIVE_INFINITY
    if (timeSinceLastFailure < FAILURE_BACKOFF_MS) {
      log(`[${HOOK_NAME}] Skipped: continuation in backoff after repeated failures`, {
        sessionID,
        promptFailureCount: sessionState.promptFailureCount,
        backoffRemaining: FAILURE_BACKOFF_MS - timeSinceLastFailure,
      })
      return
    }

    sessionState.promptFailureCount = 0
    sessionState.lastFailureAt = undefined
  }

  if (hasRunningBackgroundTasks(sessionID, options)) {
    log(`[${HOOK_NAME}] Skipped: background tasks running`, { sessionID })
    return
  }

  if (options?.isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped: continuation stopped for session`, { sessionID })
    return
  }

  const sessionAgent = getSessionAgent(sessionID)
  const lastAgent = await getLastAgentFromSession(sessionID, ctx.client)
  const effectiveAgent = sessionAgent ?? lastAgent
  const lastAgentKey = getAgentConfigKey(effectiveAgent ?? "")
  const configuredBoulderAgent = boulderState.agent
  const requiredAgentName = configuredBoulderAgent
    ?? (isAgentRegistered("atlas") ? "atlas" : undefined)
  if (!requiredAgentName) {
    log(`[${HOOK_NAME}] Skipped: boulder agent is unavailable for continuation`, {
      sessionID,
      requiredAgent: requiredAgentName ?? "unknown",
    })
    return
  }
  if (!configuredBoulderAgent && !isAgentRegistered(requiredAgentName)) {
    log(`[${HOOK_NAME}] Skipped: implicit boulder agent is unavailable for continuation`, {
      sessionID,
      requiredAgent: requiredAgentName,
    })
    return
  }

  const requiredAgent = getAgentConfigKey(requiredAgentName)
  const lastAgentMatchesRequired = lastAgentKey === requiredAgent
  const boulderAgentDefaultsToAtlas = requiredAgent === "atlas"
  const lastAgentIsSisyphus = lastAgentKey === "sisyphus"
  const allowSisyphusForAtlasBoulder = boulderAgentDefaultsToAtlas && lastAgentIsSisyphus
  const agentMatches = lastAgentMatchesRequired || allowSisyphusForAtlasBoulder
  if (!agentMatches) {
    log(`[${HOOK_NAME}] Skipped: last agent does not match boulder agent`, {
      sessionID,
      lastAgent: effectiveAgent ?? "unknown",
      requiredAgent,
    })
    return
  }

  if (sessionState.lastContinuationInjectedAt && now - sessionState.lastContinuationInjectedAt < CONTINUATION_COOLDOWN_MS) {
    scheduleRetry({ ctx, sessionID, sessionState, options })
    log(`[${HOOK_NAME}] Skipped: continuation cooldown active`, {
      sessionID,
      cooldownRemaining: CONTINUATION_COOLDOWN_MS - (now - sessionState.lastContinuationInjectedAt),
      pendingRetry: !!sessionState.pendingRetryTimer,
    })
    return
  }

  await injectContinuation({
    ctx,
    sessionID,
    sessionState,
    options,
    planName: boulderState.plan_name,
    progress,
    agent: boulderState.agent,
    worktreePath: boulderState.worktree_path,
  })
}
