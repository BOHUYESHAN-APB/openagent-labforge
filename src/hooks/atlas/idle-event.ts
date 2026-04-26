import type { PluginInput } from "@opencode-ai/plugin"
import { getSessionAgent, isAgentRegistered } from "../../features/claude-code-session-state"
import { readBoulderState } from "../../features/boulder-state"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { normalizeSDKResponse } from "../../shared"
import { log } from "../../shared/logger"
import { injectBoulderContinuation } from "./boulder-continuation-injector"
import { HOOK_NAME } from "./hook-name"
import { isSessionInBoulderLineage } from "./boulder-session-lineage"
import { getLastAgentFromSession } from "./session-last-agent"
import { resolveActiveBoulderSession } from "./resolve-active-boulder-session"
import { detectUserIntent, shouldSkipContinuation, explainIntent } from "../todo-continuation-enforcer/user-intent-detector"
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
    const currentBoulder = readBoulderState(input.ctx.directory)
    if (!currentBoulder) {
      return
    }

    const canContinueSession = await canContinueTrackedBoulderSession({
      client: input.ctx.client,
      sessionID: input.sessionID,
      sessionOrigin: currentBoulder.session_origins?.[input.sessionID],
      boulderSessionIDs: currentBoulder.session_ids,
      requiredAgent: currentBoulder.agent,
    })
    if (!canContinueSession) {
      log(`[${HOOK_NAME}] Skipped: tracked descendant agent does not match boulder agent`, {
        sessionID: input.sessionID,
        requiredAgent: currentBoulder.agent ?? "atlas",
      })
      return
    }

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

  // Early user intent detection - check if user explicitly asked to stop
  try {
    const messagesResp = await ctx.client.session.messages({
      path: { id: sessionID },
      query: { directory: ctx.directory },
    })
    const messages = normalizeSDKResponse(messagesResp, [] as Array<{ info?: { role?: string }; parts?: Array<{ type?: string; text?: string }> }>)
    
    // Find the most recent user message
    let latestUserMessageText: string | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message.info?.role === "user") {
        const parts = message.parts || []
        for (const part of parts) {
          if (part?.type === "text" && part?.text) {
            latestUserMessageText = part.text
            break
          }
        }
        if (latestUserMessageText) break
      }
    }
    
    if (latestUserMessageText) {
      const userIntent = detectUserIntent(latestUserMessageText)
      if (shouldSkipContinuation(userIntent)) {
        log(`[${HOOK_NAME}] Skipped: user intent detected (early check)`, {
          sessionID,
          intent: userIntent.type,
          explanation: explainIntent(userIntent)
        })
        return
      }
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to fetch messages for intent detection`, { sessionID, error: String(error) })
  }

  // Check if user has cancelled (ESC) recently
  if (sessionState.lastEventWasAbortError) {
    sessionState.lastEventWasAbortError = false
    sessionState.userCancelledAt = now
    sessionState.userCancelCount = (sessionState.userCancelCount || 0) + 1
    log(`[${HOOK_NAME}] User cancelled (ESC), respecting user intent`, { 
      sessionID,
      cancelCount: sessionState.userCancelCount 
    })
    return
  }

  // If user has cancelled multiple times in the last 5 minutes, stop auto-continuation
  if (sessionState.userCancelledAt && sessionState.userCancelCount && sessionState.userCancelCount >= 2) {
    const timeSinceCancel = now - sessionState.userCancelledAt
    const CANCEL_RESPECT_WINDOW = 5 * 60 * 1000 // 5 minutes
    
    if (timeSinceCancel < CANCEL_RESPECT_WINDOW) {
      log(`[${HOOK_NAME}] Skipped: user has cancelled ${sessionState.userCancelCount} times, respecting user intent`, {
        sessionID,
        cancelCount: sessionState.userCancelCount,
        timeSinceCancel,
      })
      return
    }
    
    // Reset after 5 minutes
    sessionState.userCancelledAt = undefined
    sessionState.userCancelCount = 0
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

  const canContinueSession = await canContinueTrackedBoulderSession({
    client: ctx.client,
    sessionID,
    sessionOrigin: boulderState.session_origins?.[sessionID],
    boulderSessionIDs: boulderState.session_ids,
    requiredAgent: boulderState.agent,
  })
  if (!canContinueSession) {
    log(`[${HOOK_NAME}] Skipped: tracked descendant agent does not match boulder agent`, {
      sessionID,
      requiredAgent: boulderState.agent ?? "atlas",
    })
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

async function canContinueTrackedBoulderSession(input: {
  client: PluginInput["client"]
  sessionID: string
  sessionOrigin?: "direct" | "appended"
  boulderSessionIDs: string[]
  requiredAgent?: string
}): Promise<boolean> {
  const ancestorSessionIDs = input.boulderSessionIDs.filter((trackedSessionID) => trackedSessionID !== input.sessionID)
  if (ancestorSessionIDs.length === 0) {
    return true
  }

  if (input.sessionOrigin === "direct") {
    return true
  }

  const isTrackedDescendant = await isSessionInBoulderLineage({
    client: input.client,
    sessionID: input.sessionID,
    boulderSessionIDs: ancestorSessionIDs,
  })
  if (!isTrackedDescendant) {
    return false
  }

  const sessionAgent = await getLastAgentFromSession(input.sessionID, input.client)
    ?? getSessionAgent(input.sessionID)
  if (!sessionAgent) {
    return false
  }

  const requiredAgentKey = getAgentConfigKey(input.requiredAgent ?? "atlas")
  const sessionAgentKey = getAgentConfigKey(sessionAgent)
  return sessionAgentKey === requiredAgentKey
    || (requiredAgentKey === getAgentConfigKey("atlas") && sessionAgentKey === getAgentConfigKey("sisyphus"))
}
