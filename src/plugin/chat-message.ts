import type { OhMyOpenCodeConfig } from "../config"
import type { PluginContext } from "./types"

import { hasConnectedProvidersCache } from "../shared"
import { contextCollector } from "../features/context-injector"
import { loadSoulRules, selectSoulContent } from "../shared/soul-rules"
import { isAutoModelSelection } from "../shared/model-normalization"
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
} from "../shared/session-model-state"
import { OMO_INTERNAL_INITIATOR_MARKER } from "../shared/internal-initiator-marker"
import { setSessionAgent } from "../features/claude-code-session-state"
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

  return async (
    input: ChatMessageInput,
    output: ChatMessageHandlerOutput
  ): Promise<void> => {
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

    if (strictUserModelPriority && lockedModel) {
      if (!rawInputModel) {
        input.model = lockedModel
      } else if (isAutoModelSelection(rawInputModelId)) {
        if (internalInitiatedPromptDetected) {
          input.model = lockedModel
        } else {
          clearSessionModelLock(input.sessionID)
          clearSessionForcedModel(input.sessionID)
          setSessionAutoModelRouting(input.sessionID, true)
        }
      } else if (!sameModel(rawInputModel, lockedModel)) {
        if (forcedModel && sameModel(rawInputModel, forcedModel)) {
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

    if (input.agent) {
      setSessionAgent(input.sessionID, input.agent)
    }

    if (firstMessageVariantGate.shouldOverride(input.sessionID)) {
      firstMessageVariantGate.markApplied(input.sessionID)
    }

    if (!isRuntimeFallbackEnabled) {
      await hooks.modelFallback?.["chat.message"]?.(input, output)
    }
    await hooks.stopContinuationGuard?.["chat.message"]?.(input)
    await hooks.backgroundNotificationHook?.["chat.message"]?.(input, output)
    await hooks.runtimeFallback?.["chat.message"]?.(input, output)
    await hooks.keywordDetector?.["chat.message"]?.(input, output)
    await hooks.thinkMode?.["chat.message"]?.(input, output)
    await hooks.claudeCodeHooks?.["chat.message"]?.(input, output)
    await hooks.autoSlashCommand?.["chat.message"]?.(input, output)
    const forceAgentModelRouting =
      pluginConfig.sisyphus_agent?.force_agent_model_routing ?? false
    input.forceAgentModelRouting = forceAgentModelRouting
    await hooks.noSisyphusGpt?.["chat.message"]?.(input, output)
    await hooks.noHephaestusNonGpt?.["chat.message"]?.(input, output)
    if (hooks.startWork && isStartWorkHookOutput(output)) {
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

    const requestedModel = input.model
    const requestedModelId = modelToString(requestedModel)
    const shouldLockToRequestedModel =
      strictUserModelPriority &&
      requestedModel !== undefined &&
      !isAutoModelSelection(requestedModelId)

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
      if (internalInitiatedPromptDetected) {
        if (lockedModel) {
          input.model = lockedModel
          output.message["model"] = lockedModel
          clearSessionAutoModelRouting(input.sessionID)
        }
      } else {
        clearSessionModelLock(input.sessionID)
        clearSessionForcedModel(input.sessionID)
        setSessionAutoModelRouting(input.sessionID, true)
      }
    } else if (shouldLockToRequestedModel) {
      clearSessionAutoModelRouting(input.sessionID)
      setSessionModelLock(input.sessionID, requestedModel)
      if (
        modelBeforeUserLock &&
        modelBeforeUserLock.providerID.length > 0 &&
        modelBeforeUserLock.modelID.length > 0 &&
        !sameModel(modelBeforeUserLock, requestedModel)
      ) {
        setSessionForcedModel(input.sessionID, modelBeforeUserLock)
      } else {
        clearSessionForcedModel(input.sessionID)
      }
    }

    if (shouldLockToRequestedModel) {
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
