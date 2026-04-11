import { existsSync, readFileSync } from "node:fs"
import type { BackgroundManager } from "../../features/background-agent"
import { getRuntimeWorkflowPaths, readRuntimeWorkflowState } from "../../features/boulder-state"
import {
  clearCompactionAgentConfigCheckpoint,
  setCompactionAgentConfigCheckpoint,
} from "../../shared/compaction-agent-config-checkpoint"
import { log } from "../../shared/logger"
import { normalizePromptTools } from "../../shared"
import {
  findNearestMessageWithFields,
  findNearestMessageWithFieldsFromSDK,
} from "../../features/hook-message-injector"
import { isSqliteBackend } from "../../shared/opencode-storage-detection"
import { getMessageDir } from "../todo-continuation-enforcer/message-directory"
import { COMPACTION_CONTEXT_PROMPT } from "./compaction-context-prompt"
import { createRecoveryLogic } from "./recovery"
import { resolveSessionPromptConfig } from "./session-prompt-config-resolver"
import { resolveSessionID } from "./session-id"
import {
  finalizeTrackedAssistantMessage,
  shouldTreatAssistantPartAsOutput,
  trackAssistantOutput,
  type TailMonitorState,
} from "./tail-monitor"
import type { CompactionContextClient } from "./types"

function buildRuntimeWorkflowCompactionContext(
  directory: string | undefined,
  sessionID: string | undefined,
): string {
  if (!directory || !sessionID) return ""

  const state = readRuntimeWorkflowState(directory, sessionID)
  if (!state) return ""

  const paths = getRuntimeWorkflowPaths(directory, sessionID)
  const lines = [
    "## 9. Runtime Workflow Anchor",
    `- Stage: \`${state.current_stage}\``,
    `- Wave: \`${String(state.current_wave ?? 1).padStart(3, "0")}\``,
    `- Auto mode: \`${state.auto_mode_level ?? "light"}\``,
    `- Interaction mode: \`${state.interaction_mode ?? "batch"}\``,
    `- Rehydration level: \`${state.rehydration_level ?? "full-anchor"}\``,
    `- Anchor epoch: \`${state.stage_anchor_epoch ?? 1}\``,
    ...(state.artifact_root
      ? [`- Artifact root: \`${state.artifact_root}\``]
      : []),
    ...(state.active_work_item
      ? [`- Active work item: ${state.active_work_item}`]
      : []),
    ...(state.last_rehydration_reason
      ? [`- Last rehydration reason: ${state.last_rehydration_reason}`]
      : []),
  ]

  if (existsSync(paths.stageCapsuleFile)) {
    const capsule = readFileSync(paths.stageCapsuleFile, "utf-8").trim()
    if (capsule.length > 0) {
      lines.push("", "### Stage Capsule", capsule)
    }
  }

  return `\n${lines.join("\n")}\n`
}

export function createCompactionContextInjector(
  backgroundManager?: BackgroundManager,
  directory?: string,
) {
  const tailStates = new Map<string, TailMonitorState>()

  const getTailState = (sessionID: string): TailMonitorState => {
    const existing = tailStates.get(sessionID)
    if (existing) {
      return existing
    }

    const created: TailMonitorState = {
      currentHasOutput: false,
      consecutiveNoTextMessages: 0,
    }
    tailStates.set(sessionID, created)
    return created
  }

  const resolveRecoveryContext = (
    ctx?: {
      client: {
        session: {
          messages: (args: {
            path: { id: string }
          }) => Promise<unknown>
          promptAsync: (args: unknown) => Promise<unknown>
        }
      }
    },
  ): CompactionContextClient | undefined => {
    if (!directory || !ctx?.client) {
      return undefined
    }

    return {
      client: ctx.client,
      directory,
    }
  }

  const injector = ((sessionID?: string): string => {
    let prompt = COMPACTION_CONTEXT_PROMPT

    if (backgroundManager && sessionID) {
      const history = backgroundManager.taskHistory.formatForCompaction(sessionID)
      if (history) {
        prompt += `\n### Active/Recent Delegated Sessions\n${history}\n`
      }
    }

    prompt += buildRuntimeWorkflowCompactionContext(directory, sessionID)

    return prompt
  }) as ((sessionID?: string) => string) & {
    capture?: (
      sessionID: string,
      client?: {
        session: {
          messages: (args: {
            path: { id: string }
          }) => Promise<unknown>
        }
      },
    ) => Promise<void>
    event?: (
      input: { event: { type: string; properties?: unknown } },
      ctx?: {
        client: {
          session: {
            messages: (args: {
              path: { id: string }
            }) => Promise<unknown>
            promptAsync: (args: unknown) => Promise<unknown>
          }
        }
      },
    ) => Promise<void>
  }

  injector.capture = async (sessionID, client): Promise<void> => {
    if (!sessionID) return

    const recoveryContext =
      client && directory
        ? {
            client,
            directory,
          }
        : undefined
    const resolved = recoveryContext
      ? await resolveSessionPromptConfig(recoveryContext, sessionID)
      : {}

    let stored: Awaited<ReturnType<typeof findNearestMessageWithFieldsFromSDK>> | null =
      null
    if (!resolved.agent || !resolved.model || !resolved.tools) {
      if (client && isSqliteBackend()) {
        stored = await findNearestMessageWithFieldsFromSDK(
          client as never,
          sessionID,
        )
      } else {
        const messageDir = getMessageDir(sessionID)
        stored = messageDir ? findNearestMessageWithFields(messageDir) : null
      }
    }

    const checkpoint = {
      ...(resolved.agent
        ? { agent: resolved.agent }
        : stored?.agent
          ? { agent: stored.agent }
          : {}),
      ...(resolved.model?.providerID && resolved.model?.modelID
        ? { model: resolved.model }
        : stored?.model?.providerID && stored.model?.modelID
          ? {
              model: {
                providerID: stored.model.providerID,
                modelID: stored.model.modelID,
                ...(stored.model.variant
                  ? { variant: stored.model.variant }
                  : {}),
              },
            }
          : {}),
      ...(resolved.tools
        ? { tools: resolved.tools }
        : stored?.tools
          ? { tools: normalizePromptTools(stored.tools) }
          : {}),
    }

    if (!checkpoint.agent && !checkpoint.model && !checkpoint.tools) {
      return
    }

    setCompactionAgentConfigCheckpoint(sessionID, checkpoint)
    log("[compaction-context-injector] Captured agent checkpoint before compaction", {
      sessionID,
      agent: checkpoint.agent,
      model: checkpoint.model,
      hasTools: !!checkpoint.tools,
    })
  }

  injector.event = async ({ event }, ctx): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined
    const sessionID = resolveSessionID(props)
    if (!sessionID) {
      return
    }

    const recoveryContext = resolveRecoveryContext(ctx)
    const { recoverCheckpointedAgentConfig, maybeWarnAboutNoTextTail } =
      createRecoveryLogic(recoveryContext, getTailState)

    if (event.type === "session.deleted") {
      clearCompactionAgentConfigCheckpoint(sessionID)
      tailStates.delete(sessionID)
      return
    }

    if (event.type === "session.idle") {
      const noTextCount = finalizeTrackedAssistantMessage(getTailState(sessionID))
      if (noTextCount > 0) {
        await maybeWarnAboutNoTextTail(sessionID)
      }
      return
    }

    if (event.type === "session.compacted") {
      const tailState = getTailState(sessionID)
      finalizeTrackedAssistantMessage(tailState)
      tailState.lastCompactedAt = Date.now()
      await maybeWarnAboutNoTextTail(sessionID)
      await recoverCheckpointedAgentConfig(sessionID, "session.compacted")
      return
    }

    if (event.type === "message.updated") {
      const info = props?.info as {
        id?: string
        role?: string
        sessionID?: string
      } | undefined

      if (!info?.sessionID || info.role !== "assistant" || !info.id) {
        return
      }

      const tailState = getTailState(info.sessionID)
      if (
        tailState.currentMessageID &&
        tailState.currentMessageID !== info.id
      ) {
        finalizeTrackedAssistantMessage(tailState)
        await maybeWarnAboutNoTextTail(info.sessionID)
      }

      if (tailState.currentMessageID !== info.id) {
        tailState.currentMessageID = info.id
        tailState.currentHasOutput = false
      }
      return
    }

    if (event.type === "message.part.delta") {
      const deltaSessionID = props?.sessionID as string | undefined
      const messageID = props?.messageID as string | undefined
      const field = props?.field as string | undefined
      const delta = props?.delta as string | undefined

      if (!deltaSessionID || field !== "text" || !delta?.trim()) {
        return
      }

      trackAssistantOutput(getTailState(deltaSessionID), messageID)
      return
    }

    if (event.type === "message.part.updated") {
      const part = props?.part as {
        messageID?: string
        sessionID?: string
        type?: string
        text?: string
      } | undefined

      if (!part?.sessionID || !shouldTreatAssistantPartAsOutput(part)) {
        return
      }

      trackAssistantOutput(getTailState(part.sessionID), part.messageID)
    }
  }

  return injector
}
