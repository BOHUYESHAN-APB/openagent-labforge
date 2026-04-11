import type { OhMyOpenCodeConfig } from "../config"
import type { PluginContext } from "./types"

import { hasConnectedProvidersCache } from "../shared"
import { contextCollector } from "../features/context-injector"
import { loadSoulRules, selectSoulContent } from "../shared/soul-rules"
import { isAutoModelSelection } from "../shared/model-normalization"
import { detectFreshRepositoryBootstrap } from "../shared/repo-bootstrap-detection"
import {
  clearSessionAutoModelRouting,
  clearSessionForcedModel,
  clearSessionModelLock,
  getSessionForcedModel,
  getSessionModel,
  getSessionModelLock,
  setSessionAutoModelRouting,
  setSessionForcedModel,
  setSessionModel,
  setSessionModelLock,
  isSessionAutoModelRoutingEnabled,
} from "../shared/session-model-state"
import { OMO_INTERNAL_INITIATOR_MARKER } from "../shared/internal-initiator-marker"
import { isForkedSession } from "../shared/forked-session-state"
import { log } from "../shared/logger"
import {
  markRuntimeWorkflowPromptRehydrated,
  readRepoBootstrapSelection,
  readRuntimeWorkflowState,
  reopenRuntimeWorkflowAfterApprovedBatch,
  updateRuntimeWorkflowManualBoundaries,
  writeRepoBootstrapSelection,
} from "../features/boulder-state"
import { parseBootstrapModeSelection } from "./bootstrap-mode"
import {
  buildAutonomousUserDirectiveContext,
  buildAutonomousReentryContext,
  buildFreshRepoBootstrapContext,
  buildStageManagedPromptContext,
} from "./stage-managed-prompt"
import {
  clearAutonomousUserTurnState,
  getSessionBootstrapMode,
  getSessionAgent,
  isAutonomousSessionAgent,
  recordAutonomousUserTurn,
  setSessionBootstrapMode,
  setSessionAgent,
  setUltraworkAutonomousSession,
  updateSessionAgent,
} from "../features/claude-code-session-state"
import { getAgentConfigKey } from "../shared/agent-display-names"
import { applyUltraworkModelOverrideOnMessage } from "./ultrawork-model-override"
import { parseRalphLoopArguments } from "../hooks/ralph-loop/command-arguments"
import { clearPendingModelFallback, clearSessionFallbackChain } from "../hooks/model-fallback/hook"

import type { CreatedHooks } from "../create-hooks"

type FirstMessageVariantGate = {
  shouldOverride: (sessionID: string) => boolean
  markApplied: (sessionID: string) => void
}

type ChatMessagePart = { type: string; text?: string; [key: string]: unknown }
export type ChatMessageHandlerOutput = { message: Record<string, unknown>; parts: ChatMessagePart[] }
export type ChatMessageInput = {
  sessionID: string
  agent?: string
  model?: { providerID: string; modelID: string }
  forceAgentModelRouting?: boolean
}
type StartWorkHookOutput = { parts: Array<{ type: string; text?: string }> }
const recoveryModelToastSessions = new Set<string>()

function isStartWorkHookOutput(value: unknown): value is StartWorkHookOutput {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  const partsValue = record["parts"]
  if (!Array.isArray(partsValue)) return false
  return partsValue.every((part) => {
    if (typeof part !== "object" || part === null) return false
    const partRecord = part as Record<string, unknown>
    return typeof partRecord["type"] === "string"
  })
}

function hasExplicitAgentModelOverride(
  agent: string | undefined,
  pluginConfig: OhMyOpenCodeConfig,
): boolean {
  const configuredAgents = pluginConfig.agents
  if (!agent || !configuredAgents) {
    return false
  }

  const agentKey = getAgentConfigKey(agent)
  const configuredAgent = configuredAgents[agentKey as keyof typeof configuredAgents]
  const configuredModel = configuredAgent?.model
  return typeof configuredModel === "string" && configuredModel.trim().length > 0
}

function isOpenCodeNativeLightweightAgent(agent: string | undefined): boolean {
  const agentKey = getAgentConfigKey(agent ?? "")
  return agentKey === "plan" || agentKey === "build"
}

function isBioAutonomousAgent(agent: string | undefined): boolean {
  const agentKey = getAgentConfigKey(agent ?? "")
  return agentKey === "bio-autopilot" || agentKey === "bio-orchestrator"
}

function isStageManagedAutonomousAgent(agent: string | undefined): boolean {
  return isAutonomousSessionAgent(agent) || isBioAutonomousAgent(agent)
}

function chooseStageManagedPromptMode(args: {
  internalInitiatedPromptDetected: boolean
  isStageManagedAutonomousSession: boolean
  runtimeState: ReturnType<typeof readRuntimeWorkflowState>
}): "full-anchor" | "capsule" | "delta" {
  const { internalInitiatedPromptDetected, isStageManagedAutonomousSession, runtimeState } = args
  if (!isStageManagedAutonomousSession || !internalInitiatedPromptDetected) {
    return "full-anchor"
  }

  const updatedAt = runtimeState?.updated_at ? Date.parse(runtimeState.updated_at) : undefined
  const lastFullAnchorAt = runtimeState?.last_full_anchor_at ? Date.parse(runtimeState.last_full_anchor_at) : undefined
  const lastCapsuleAt = runtimeState?.last_capsule_at ? Date.parse(runtimeState.last_capsule_at) : undefined
  const lastCompactionAt = runtimeState?.last_compaction_at ? Date.parse(runtimeState.last_compaction_at) : undefined

  if (
    runtimeState?.rehydration_level === "capsule" &&
    (
      lastCapsuleAt === undefined ||
      (lastCompactionAt !== undefined && lastCapsuleAt < lastCompactionAt) ||
      (updatedAt !== undefined && lastCapsuleAt < updatedAt)
    )
  ) {
    return "capsule"
  }

  if (
    runtimeState?.rehydration_level === "full-anchor" &&
    (
      lastFullAnchorAt === undefined ||
      (updatedAt !== undefined && lastFullAnchorAt < updatedAt)
    )
  ) {
    return "full-anchor"
  }

  return "delta"
}

function extractManualBoundaryNotes(promptText: string): string[] {
  const normalized = promptText
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const matches = normalized.filter((line) => {
    return (
      /(?:由我|我来|我自己|我手动).{0,20}(?:处理|下载|安装|上传|提交|推送|运行|拉取|执行)/u.test(line) ||
      /(?:下载|安装|上传|提交|推送|运行|拉取|执行).{0,20}(?:由我|我来|我自己|我手动)/u.test(line) ||
      /(?:不要|先别).{0,24}(?:做|处理|下载|安装|推送|提交).{0,12}(?:我|由我|我来|我手动)/u.test(line)
    )
  })

  return Array.from(new Set(matches))
}

export function createChatMessageHandler(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  firstMessageVariantGate: FirstMessageVariantGate
  hooks: CreatedHooks
}): (
  input: ChatMessageInput,
  output: ChatMessageHandlerOutput
) => Promise<void> {
  const { ctx, pluginConfig, firstMessageVariantGate, hooks } = args
  const soulInjectedSessions = new Set<string>()
  const pluginContext = ctx as {
    client: {
      tui: {
        showToast: (input: {
          body: {
            title: string
            message: string
            variant: "warning"
            duration: number
          }
        }) => Promise<unknown>
      }
    }
  }
  const isRuntimeFallbackEnabled =
    hooks.runtimeFallback !== null &&
    hooks.runtimeFallback !== undefined &&
    (typeof pluginConfig.runtime_fallback === "boolean"
      ? pluginConfig.runtime_fallback
      : (pluginConfig.runtime_fallback?.enabled ?? false))
  const isModelFallbackEnabled =
    hooks.modelFallback !== null &&
    hooks.modelFallback !== undefined &&
    (pluginConfig.model_fallback ?? true)

  return async (
    input: ChatMessageInput,
    output: ChatMessageHandlerOutput
  ): Promise<void> => {
    const isFirstUserTurn = firstMessageVariantGate.shouldOverride(input.sessionID)
    const rememberedSessionAgent = getSessionAgent(input.sessionID)

    const outputText = output.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("\n")
    const internalInitiatedPromptDetected = outputText.includes(OMO_INTERNAL_INITIATOR_MARKER)

    const previousSessionModel = getSessionModel(input.sessionID)
    const currentInputModel = input.model
    const manualModelChangeDetected =
      currentInputModel !== undefined &&
      previousSessionModel !== undefined &&
      (currentInputModel.providerID !== previousSessionModel.providerID ||
        currentInputModel.modelID !== previousSessionModel.modelID)

    if (manualModelChangeDetected) {
      clearPendingModelFallback(input.sessionID)
      clearSessionFallbackChain(input.sessionID)
    }

    const strictUserModelPriority = pluginConfig.experimental?.strict_user_model_priority ?? true
    const lockedModel = getSessionModelLock(input.sessionID)
    const forcedModel = getSessionForcedModel(input.sessionID)
    const rawInputModel = input.model
    const rawInputModelId = modelToString(rawInputModel)
    const activeAgent = input.agent ?? rememberedSessionAgent
    const explicitAgentSwitchDetected =
      input.agent !== undefined &&
      rememberedSessionAgent !== undefined &&
      getAgentConfigKey(input.agent) !== getAgentConfigKey(rememberedSessionAgent)
    const isNativeLightweightAgent = isOpenCodeNativeLightweightAgent(activeAgent)
    const isForkedSessionLoad = isForkedSession(input.sessionID)
    const isStageManagedAutonomousSession = isStageManagedAutonomousAgent(activeAgent)
    const switchedFromAutoToManual =
      explicitAgentSwitchDetected &&
      isStageManagedAutonomousAgent(rememberedSessionAgent) &&
      !isStageManagedAutonomousAgent(input.agent)
    const switchedFromManualToAuto =
      explicitAgentSwitchDetected &&
      !isStageManagedAutonomousAgent(rememberedSessionAgent) &&
      isStageManagedAutonomousAgent(input.agent)
    const runtimeWorkflowState = readRuntimeWorkflowState(ctx.directory, input.sessionID)
    const repoBootstrapSelection = readRepoBootstrapSelection(ctx.directory)
    const existingBootstrapMode = getSessionBootstrapMode(input.sessionID)
    const parsedBootstrapMode =
      !internalInitiatedPromptDetected &&
      isStageManagedAutonomousSession &&
      !existingBootstrapMode &&
      !repoBootstrapSelection
        ? parseBootstrapModeSelection(activeAgent, outputText)
        : null
    if (parsedBootstrapMode) {
      setSessionBootstrapMode(input.sessionID, parsedBootstrapMode)
      writeRepoBootstrapSelection({
        directory: ctx.directory,
        sessionId: input.sessionID,
        selection: parsedBootstrapMode,
      })
    }
    const manualBoundaryNotes =
      !internalInitiatedPromptDetected && outputText.trim().length > 0
        ? extractManualBoundaryNotes(outputText)
        : []
    if (manualBoundaryNotes.length > 0 && runtimeWorkflowState) {
      updateRuntimeWorkflowManualBoundaries({
        directory: ctx.directory,
        sessionId: input.sessionID,
        boundaries: manualBoundaryNotes,
        note: "Recorded explicit user-owned/manual-handled boundary from the latest user guidance.",
      })
    }
    const reopenedApprovedBatchState =
      !internalInitiatedPromptDetected &&
      isStageManagedAutonomousSession &&
      reopenRuntimeWorkflowAfterApprovedBatch({
        directory: ctx.directory,
        sessionId: input.sessionID,
        note: "Fresh user guidance arrived after an approved batch. Reopen execution only for the next explicit user-driven wave.",
      })
    const reopenedApprovedBatch = reopenedApprovedBatchState !== null && reopenedApprovedBatchState !== false
    const agentHasExplicitModelOverride = hasExplicitAgentModelOverride(activeAgent, pluginConfig)
    const shouldBypassStickyLockForAgent =
      agentHasExplicitModelOverride &&
      (rawInputModel === undefined || isAutoModelSelection(rawInputModelId))
    const internalExplicitModelShouldHonorLock =
      strictUserModelPriority &&
      internalInitiatedPromptDetected &&
      lockedModel !== undefined &&
      rawInputModel !== undefined &&
      !isAutoModelSelection(rawInputModelId) &&
      !sameModel(rawInputModel, lockedModel) &&
      !shouldBypassStickyLockForAgent
    let shouldShowRecoveryModelToast = false

    if (strictUserModelPriority && lockedModel && !shouldBypassStickyLockForAgent) {
      shouldShowRecoveryModelToast = !rawInputModel || isAutoModelSelection(rawInputModelId)
      if (!rawInputModel) {
        input.model = lockedModel
      } else if (isAutoModelSelection(rawInputModelId)) {
        input.model = lockedModel
        clearSessionAutoModelRouting(input.sessionID)
      } else if (internalExplicitModelShouldHonorLock) {
        input.model = lockedModel
        clearSessionAutoModelRouting(input.sessionID)
        log("[chat-message] Restored locked model for internal prompt carrying stale explicit model", {
          sessionID: input.sessionID,
          lockedModel: `${lockedModel.providerID}/${lockedModel.modelID}`,
          rawInputModel: `${rawInputModel.providerID}/${rawInputModel.modelID}`,
        })
      } else if (!sameModel(rawInputModel, lockedModel)) {
        if (forcedModel && sameModel(rawInputModel, forcedModel) && !manualModelChangeDetected) {
          input.model = lockedModel
        }
      }
    }

    const soulRules = loadSoulRules({ directory: ctx.directory, pluginConfig })
    const injectOnce = pluginConfig.soul?.inject_once ?? true
    const alreadyInjected = soulInjectedSessions.has(input.sessionID)

    if (soulRules.content && (!injectOnce || !alreadyInjected)) {
      const promptText = output.parts
        .filter((part) => part.type === "text" && part.text)
        .map((part) => part.text ?? "")
        .join("\n")

      const mode = pluginConfig.soul?.mode ?? "dynamic"
      let content = selectSoulContent({
        content: soulRules.content,
        prompt: promptText,
        mode,
      })

      const maxChars = pluginConfig.soul?.max_chars
      if (typeof maxChars === "number" && maxChars > 0 && content.length > maxChars) {
        content = `${content.slice(0, maxChars)}\n\n[SOUL truncated to max_chars]`
      }

      contextCollector.register(input.sessionID, {
        id: "soul-rules",
        source: "custom",
        content,
        priority: pluginConfig.soul?.priority ?? "high",
        metadata: { source: soulRules.source },
      })

      if (injectOnce) {
        soulInjectedSessions.add(input.sessionID)
      }
    }

    if (switchedFromAutoToManual || switchedFromManualToAuto) {
      clearAutonomousUserTurnState(input.sessionID)
    }

    if (input.agent) {
      if (rememberedSessionAgent === undefined) {
        setSessionAgent(input.sessionID, input.agent)
      } else {
        updateSessionAgent(input.sessionID, input.agent)
      }
      if (isStageManagedAutonomousAgent(input.agent)) {
        setUltraworkAutonomousSession(input.sessionID, true)
      }
    } else if (activeAgent && isStageManagedAutonomousAgent(activeAgent)) {
      setUltraworkAutonomousSession(input.sessionID, true)
    }

    const autonomousReentryContext =
      !internalInitiatedPromptDetected &&
      switchedFromManualToAuto
        ? buildAutonomousReentryContext({
            agent: activeAgent,
          })
        : null
    if (autonomousReentryContext) {
      contextCollector.register(input.sessionID, {
        id: "autonomous-reentry",
        source: "custom",
        content: autonomousReentryContext,
        priority: "high",
      })
      markRuntimeWorkflowPromptRehydrated({
        directory: ctx.directory,
        sessionId: input.sessionID,
        level: "full-anchor",
        reason: "manual-auto-reentry",
      })
    }

    const stageManagedPromptMode = chooseStageManagedPromptMode({
      internalInitiatedPromptDetected,
      isStageManagedAutonomousSession,
      runtimeState: runtimeWorkflowState,
    })
    const stageManagedContext = buildStageManagedPromptContext({
      directory: ctx.directory,
      sessionID: input.sessionID,
      agent: activeAgent,
      promptMode: stageManagedPromptMode,
    })
    if (stageManagedContext) {
      contextCollector.register(input.sessionID, {
        id: "stage-managed-prompt",
        source: "custom",
        content: stageManagedContext,
        priority: "high",
      })
      markRuntimeWorkflowPromptRehydrated({
        directory: ctx.directory,
        sessionId: input.sessionID,
        level:
          stageManagedPromptMode === "delta"
            ? "none"
            : stageManagedPromptMode,
        reason:
          stageManagedPromptMode === "delta"
            ? "internal-continuation-delta"
            : internalInitiatedPromptDetected
              ? "internal-continuation"
              : "chat-message",
      })
    }

    if (
      isFirstUserTurn &&
      !internalInitiatedPromptDetected &&
      isStageManagedAutonomousSession &&
      !isForkedSessionLoad &&
      !existingBootstrapMode &&
      !repoBootstrapSelection &&
      !parsedBootstrapMode
    ) {
      const freshRepo = detectFreshRepositoryBootstrap(ctx.directory)
      if (freshRepo.isFresh) {
        const bootstrapContext = buildFreshRepoBootstrapContext({
          agent: activeAgent,
          promptText: outputText,
          detectionReason: freshRepo.reason,
        })
        if (bootstrapContext) {
          contextCollector.register(input.sessionID, {
            id: "fresh-repo-bootstrap",
            source: "custom",
            content: bootstrapContext,
            priority: "high",
          })
        }
      }
    }

    const userDirectiveContext = internalInitiatedPromptDetected
      ? null
      : (() => {
          const autonomousTurnAssessment = isStageManagedAutonomousSession && outputText.trim()
            ? recordAutonomousUserTurn({
                sessionID: input.sessionID,
                promptText: outputText,
              })
            : undefined

          return buildAutonomousUserDirectiveContext({
            agent: activeAgent,
            promptText: outputText,
            guidanceMode: autonomousTurnAssessment?.mode,
            promptChanged: autonomousTurnAssessment?.promptChanged,
            likelyUndoFailed: autonomousTurnAssessment?.likelyUndoFailed,
            approvedBatchCarryover: reopenedApprovedBatch,
          })
        })()
    if (userDirectiveContext) {
      contextCollector.register(input.sessionID, {
        id: "autonomous-user-update",
        source: "custom",
        content: userDirectiveContext,
        priority: "high",
      })
    }

    if (shouldShowRecoveryModelToast && lockedModel && !recoveryModelToastSessions.has(input.sessionID)) {
      recoveryModelToastSessions.add(input.sessionID)
      log("[chat-message] Restored locked model after auto/empty input", {
        sessionID: input.sessionID,
        lockedModel: `${lockedModel.providerID}/${lockedModel.modelID}`,
        rawInputModel: rawInputModel ? `${rawInputModel.providerID}/${rawInputModel.modelID}` : "(none)",
      })
      pluginContext.client.tui
        .showToast({
          body: {
            title: "Model lock restored",
            message: `Using locked model ${lockedModel.providerID}/${lockedModel.modelID}`,
            variant: "warning" as const,
            duration: 2600,
          },
        })
        .catch(() => {})
    }

    if (isFirstUserTurn) {
      firstMessageVariantGate.markApplied(input.sessionID)
    }

    if (!isRuntimeFallbackEnabled && isModelFallbackEnabled) {
      await hooks.modelFallback?.["chat.message"]?.(input, output)
    }
    await hooks.stopContinuationGuard?.["chat.message"]?.(input)
    await hooks.backgroundNotificationHook?.["chat.message"]?.(input, output)
    await hooks.runtimeFallback?.["chat.message"]?.(input, output)
    if (!isNativeLightweightAgent && !isForkedSessionLoad && !isStageManagedAutonomousSession) {
      await hooks.keywordDetector?.["chat.message"]?.(input, output)
      await hooks.thinkMode?.["chat.message"]?.(input, output)
      await hooks.claudeCodeHooks?.["chat.message"]?.(input, output)
    } else {
      log("[chat-message] Skipping heavy prompt injections", {
        sessionID: input.sessionID,
        agent: activeAgent,
        nativeLightweight: isNativeLightweightAgent,
        forkedSession: isForkedSessionLoad,
        stageManagedAutonomous: isStageManagedAutonomousSession,
      })
    }
    await hooks.autoSlashCommand?.["chat.message"]?.(input, output)
    const forceAgentModelRouting =
      pluginConfig.sisyphus_agent?.force_agent_model_routing ?? false
    input.forceAgentModelRouting = forceAgentModelRouting
    if (!isNativeLightweightAgent) {
      await hooks.noSisyphusGpt?.["chat.message"]?.(input, output)
      await hooks.noHephaestusNonGpt?.["chat.message"]?.(input, output)
    }
    if (!isNativeLightweightAgent && hooks.startWork && isStartWorkHookOutput(output)) {
      await hooks.startWork["chat.message"]?.(input, output)
    }

    if (!hasConnectedProvidersCache()) {
      pluginContext.client.tui
        .showToast({
          body: {
            title: "⚠️ Provider Cache Missing",
            message:
              "Model filtering disabled. RESTART OpenCode to enable full functionality.",
            variant: "warning" as const,
            duration: 6000,
          },
        })
        .catch(() => {})
    }

    if (hooks.ralphLoop) {
      const parts = output.parts
      const promptText =
        parts
          ?.filter((p) => p.type === "text" && p.text)
          .map((p) => p.text)
          .join("\n")
          .trim() || ""

      const isRalphLoopTemplate =
        promptText.includes("You are starting a Ralph Loop") &&
        promptText.includes("<user-task>")
      const isUlwLoopTemplate =
        promptText.includes("You are starting an ULTRAWORK Loop") &&
        promptText.includes("<user-task>")
      const isCancelRalphTemplate = promptText.includes(
        "Cancel the currently active Ralph Loop",
      )

      if (isRalphLoopTemplate || isUlwLoopTemplate) {
        const taskMatch = promptText.match(/<user-task>\s*([\s\S]*?)\s*<\/user-task>/i)
        const rawTask = taskMatch?.[1]?.trim() || ""
        const parsedArguments = parseRalphLoopArguments(rawTask)

        hooks.ralphLoop.startLoop(input.sessionID, parsedArguments.prompt, {
          ultrawork: isUlwLoopTemplate,
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        })
      } else if (isCancelRalphTemplate) {
        hooks.ralphLoop.cancelLoop(input.sessionID)
      }
    }

    const currentRequestedModel = input.model
    const currentRequestedModelId = modelToString(currentRequestedModel)
    const explicitNonAutoModelRequested =
      currentRequestedModel !== undefined &&
      !isAutoModelSelection(currentRequestedModelId)
    const canApplyPluginAutoOverride =
      !explicitNonAutoModelRequested && (
        currentRequestedModel === undefined ||
        isAutoModelSelection(currentRequestedModelId) ||
        isSessionAutoModelRoutingEnabled(input.sessionID)
      )

    if (canApplyPluginAutoOverride) {
      applyUltraworkModelOverrideOnMessage(
        pluginConfig,
        input.agent,
        output,
        pluginContext.client.tui,
        input.sessionID,
        manualModelChangeDetected,
        internalInitiatedPromptDetected,
        Boolean(getSessionModelLock(input.sessionID)),
      )
    }

    const requestedModel = input.model
    const requestedModelId = modelToString(requestedModel)
    const userRequestedModel = rawInputModel
    const userRequestedModelId = rawInputModelId
    const shouldRefreshLockFromUserSelection =
      strictUserModelPriority &&
      !internalInitiatedPromptDetected &&
      userRequestedModel !== undefined &&
      !isAutoModelSelection(userRequestedModelId)
    const shouldEnforceLockedOutput =
      strictUserModelPriority &&
      requestedModel !== undefined &&
      !isAutoModelSelection(requestedModelId) &&
      (!shouldBypassStickyLockForAgent || shouldRefreshLockFromUserSelection)

    const modelBeforeUserLock =
      output.message["model"] &&
      typeof output.message["model"] === "object" &&
      "providerID" in (output.message["model"] as Record<string, unknown>) &&
      "modelID" in (output.message["model"] as Record<string, unknown>)
        ? {
            providerID: (output.message["model"] as { providerID?: string }).providerID ?? "",
            modelID: (output.message["model"] as { modelID?: string }).modelID ?? "",
          }
        : undefined

    if (requestedModel !== undefined && isAutoModelSelection(requestedModelId)) {
      if (lockedModel) {
        input.model = lockedModel
        output.message["model"] = lockedModel
        clearSessionAutoModelRouting(input.sessionID)
      } else if (!internalInitiatedPromptDetected) {
        setSessionAutoModelRouting(input.sessionID, true)
      }
    } else if (shouldRefreshLockFromUserSelection) {
      recoveryModelToastSessions.delete(input.sessionID)
      log("[chat-message] Refreshed session model lock from explicit user selection", {
        sessionID: input.sessionID,
        selectedModel: `${userRequestedModel.providerID}/${userRequestedModel.modelID}`,
      })
      clearSessionAutoModelRouting(input.sessionID)
      setSessionModelLock(input.sessionID, userRequestedModel)
      if (
        modelBeforeUserLock &&
        modelBeforeUserLock.providerID.length > 0 &&
        modelBeforeUserLock.modelID.length > 0 &&
        !sameModel(modelBeforeUserLock, userRequestedModel)
      ) {
        setSessionForcedModel(input.sessionID, modelBeforeUserLock)
      } else {
        clearSessionForcedModel(input.sessionID)
      }
    }

    if (shouldEnforceLockedOutput) {
      output.message["model"] = requestedModel
    }

    const finalOutputModel = output.message["model"]
    if (
      finalOutputModel &&
      typeof finalOutputModel === "object" &&
      "providerID" in finalOutputModel &&
      "modelID" in finalOutputModel
    ) {
      const providerID = (finalOutputModel as { providerID?: string }).providerID
      const modelID = (finalOutputModel as { modelID?: string }).modelID
      if (typeof providerID === "string" && typeof modelID === "string") {
        setSessionModel(input.sessionID, { providerID, modelID })
      }
    } else if (requestedModel) {
      setSessionModel(input.sessionID, requestedModel)
    }
  }
}

function modelToString(model?: { providerID: string; modelID: string }): string | undefined {
  if (!model) return undefined
  return `${model.providerID}/${model.modelID}`
}

function sameModel(
  left?: { providerID: string; modelID: string },
  right?: { providerID: string; modelID: string },
): boolean {
  if (!left || !right) return false
  return left.providerID === right.providerID && left.modelID === right.modelID
}
