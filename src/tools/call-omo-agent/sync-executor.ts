import type { CallOmoAgentArgs } from "./types"
import type { PluginInput } from "@opencode-ai/plugin"
import { subagentSessions, syncSubagentSessions } from "../../features/claude-code-session-state"
import { getAgentToolRestrictions, log } from "../../shared"
import { applySessionPromptParams } from "../../shared/session-prompt-params-helpers"
import type { DelegatedModelConfig } from "../../shared/model-resolution-types"
import type { FallbackEntry } from "../../shared/model-requirements"
import { stripAgentListSortPrefix } from "../../shared/agent-display-names"
import { RetryableSubagentError, getRetryDelay } from "../../shared/subagent-error-handler"
import { createOrGetSession } from "./session-creator"
import { waitForCompletion } from "./completion-poller"
import { processMessages } from "./message-processor"

type SessionWithPromptAsync = {
  promptAsync: (opts: { path: { id: string }; body: Record<string, unknown> }) => Promise<unknown>
}

type ExecuteSyncDeps = {
  createOrGetSession: typeof createOrGetSession
  waitForCompletion: typeof waitForCompletion
  processMessages: typeof processMessages
  setSessionFallbackChain: (sessionID: string, fallbackChain: FallbackEntry[] | undefined) => void
  clearSessionFallbackChain: (sessionID: string) => void
}

const defaultDeps: ExecuteSyncDeps = {
  createOrGetSession,
  waitForCompletion,
  processMessages,
  setSessionFallbackChain: () => {},
  clearSessionFallbackChain: () => {},
}

const MAX_RETRIES = 3

type SpawnReservation = {
  commit: () => void
  rollback: () => void
}

function buildPromptGenerationParams(model: DelegatedModelConfig | undefined): Record<string, unknown> {
  if (!model) {
    return {}
  }

  const promptOptions: Record<string, unknown> = {
    ...(model.reasoningEffort ? { reasoningEffort: model.reasoningEffort } : {}),
    ...(model.thinking ? { thinking: model.thinking } : {}),
  }

  return {
    ...(model.temperature !== undefined ? { temperature: model.temperature } : {}),
    ...(model.top_p !== undefined ? { topP: model.top_p } : {}),
    ...(model.maxTokens !== undefined ? { maxOutputTokens: model.maxTokens } : {}),
    ...(Object.keys(promptOptions).length > 0 ? { options: promptOptions } : {}),
  }
}

export async function executeSync(
  args: CallOmoAgentArgs,
  toolContext: {
    sessionID: string
    messageID: string
    agent: string
    abort: AbortSignal
    metadata?: (input: { title?: string; metadata?: Record<string, unknown> }) => void
  },
  ctx: PluginInput,
  deps: ExecuteSyncDeps = defaultDeps,
  fallbackChain?: FallbackEntry[],
  spawnReservation?: SpawnReservation,
  model?: DelegatedModelConfig,
): Promise<string> {
  let sessionID: string | undefined
  let createdSessionForExecution = false
  let appliedFallbackChain = false
  let lastSessionID = ""
  let attempt = 0

  while (true) {
    try {
      const session = await deps.createOrGetSession(args, toolContext, ctx)
      sessionID = session.sessionID
      createdSessionForExecution = session.isNew
      lastSessionID = sessionID
      subagentSessions.add(sessionID)
      syncSubagentSessions.add(sessionID)

      if (session.isNew) {
        spawnReservation?.commit()
      }

      if (attempt > 0) {
        log(`[call_omo_agent] Retry attempt ${attempt}/${MAX_RETRIES} with new session ${sessionID}`)
      }

      if (fallbackChain && fallbackChain.length > 0) {
        deps.setSessionFallbackChain(sessionID, fallbackChain)
        appliedFallbackChain = true
      }

      applySessionPromptParams(sessionID, model)

      await toolContext.metadata?.({
        title: args.description,
        metadata: { sessionId: sessionID },
      })

      log(`[call_omo_agent] Sending prompt to session ${sessionID}`)
      log(`[call_omo_agent] Prompt text:`, args.prompt.substring(0, 100))
      const normalizedSubagentType = stripAgentListSortPrefix(args.subagent_type)

      try {
        await (ctx.client.session as unknown as SessionWithPromptAsync).promptAsync({
          path: { id: sessionID },
          body: {
            agent: normalizedSubagentType,
            tools: {
              ...getAgentToolRestrictions(normalizedSubagentType),
              task: false,
              question: false,
            },
            parts: [{ type: "text", text: args.prompt }],
            ...(model ? { model: { providerID: model.providerID, modelID: model.modelID } } : {}),
            ...(model?.variant ? { variant: model.variant } : {}),
            ...buildPromptGenerationParams(model),
          },
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        log(`[call_omo_agent] Prompt error:`, errorMessage)

        if (errorMessage.includes("agent.name") || errorMessage.includes("undefined")) {
          return `Error: Agent "${normalizedSubagentType}" not found. Make sure the agent is registered in your opencode.json or provided by a plugin.\n\n<task_metadata>\nsession_id: ${sessionID}\n</task_metadata>`
        }

        if (
          errorMessage.includes("rate") ||
          errorMessage.includes("429") ||
          errorMessage.includes("503") ||
          errorMessage.includes("502") ||
          errorMessage.includes("504") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("unavailable") ||
          errorMessage.includes("overloaded")
        ) {
          attempt++
          if (attempt > MAX_RETRIES) {
            return `Error: Subagent failed after ${MAX_RETRIES + 1} attempts due to service unavailability.\n\nLast error: ${errorMessage}\n\n<task_metadata>\nsession_id: ${sessionID}\n</task_metadata>`
          }
          const delay = getRetryDelay(attempt - 1)
          log(`[call_omo_agent] Retryable prompt error, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        return `Error: Failed to send prompt: ${errorMessage}\n\n<task_metadata>\nsession_id: ${sessionID}\n</task_metadata>`
      }

      try {
        await deps.waitForCompletion(sessionID, toolContext, ctx)
      } catch (error) {
        if (error instanceof RetryableSubagentError) {
          log(`[call_omo_agent] Retryable poll error: ${error.reason}`)
          attempt++
          if (attempt > MAX_RETRIES) {
            return `Error: Subagent failed after ${MAX_RETRIES + 1} attempts.\n\nLast error: ${error.message}\n\n<task_metadata>\nsession_id: ${sessionID}\n</task_metadata>`
          }
          const delay = getRetryDelay(attempt - 1)
          log(`[call_omo_agent] Retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        throw error
      }

      const responseText = await deps.processMessages(sessionID, ctx)

      const output = responseText + "\n\n" + ["<task_metadata>", `session_id: ${sessionID}`, "</task_metadata>"].join("\n")

      if (attempt > 0) {
        log(`[call_omo_agent] Succeeded on retry attempt ${attempt}`)
      }

      return output
    } catch (error) {
      spawnReservation?.rollback()
      if (error instanceof RetryableSubagentError) {
        attempt++
        if (attempt > MAX_RETRIES) {
          return `Error: Subagent failed after ${MAX_RETRIES + 1} attempts.\n\nLast error: ${error.message}\n\n<task_metadata>\nsession_id: ${lastSessionID}\n</task_metadata>`
        }
        const delay = getRetryDelay(attempt - 1)
        log(`[call_omo_agent] Retrying outer error in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error
    } finally {
      if (sessionID && appliedFallbackChain) {
        deps.clearSessionFallbackChain(sessionID)
      }

      if (sessionID && createdSessionForExecution) {
        subagentSessions.delete(sessionID)
        syncSubagentSessions.delete(sessionID)
      }
    }
  }
}
