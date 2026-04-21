import { log } from "../shared/logger"
import type { OhMyOpenCodeConfig } from "../config"
import { getSessionAgent } from "../features/claude-code-session-state"
import { getAgentConfigKey } from "../shared/agent-display-names"
import {
  getContextGuardPreemptiveThreshold,
  resolveContextGuardProfile,
  type ContextGuardProfile,
} from "./context-guard-threshold-profile"
import { isTokenLimitError } from "../shared/token-limit-error-detector"

import { resolveCompactionModel } from "./shared/compaction-model-resolver"
const DEFAULT_ACTUAL_LIMIT = 200_000
const PREEMPTIVE_COMPACTION_TIMEOUT_MS = 120_000

type ModelCacheStateLike = {
  anthropicContext1MEnabled: boolean
  modelContextLimitsCache?: Map<string, number>
}

function getAnthropicActualLimit(modelCacheState?: ModelCacheStateLike): number {
  return (modelCacheState?.anthropicContext1MEnabled ?? false) ||
    process.env.ANTHROPIC_1M_CONTEXT === "true" ||
    process.env.VERTEX_ANTHROPIC_1M_CONTEXT === "true"
    ? 1_000_000
    : DEFAULT_ACTUAL_LIMIT
}

interface TokenInfo {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

interface CachedCompactionState {
  providerID: string
  modelID: string
  tokens: TokenInfo
}

function formatCompactTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

function withTimeout<TValue>(
  promise: Promise<TValue>,
  timeoutMs: number,
  errorMessage: string,
): Promise<TValue> {
  let timeoutID: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutID = setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutID !== undefined) {
      clearTimeout(timeoutID)
    }
  })
}

function isAnthropicProvider(providerID: string): boolean {
  return providerID === "anthropic" || providerID === "google-vertex-anthropic"
}

function inferContextLimit(providerID: string, modelID: string, modelCacheState?: ModelCacheStateLike): number {
  if (modelID) {
    const cached = modelCacheState?.modelContextLimitsCache?.get(`${providerID}/${modelID}`)
    if (cached && cached > 0) return cached
  }
  if (isAnthropicProvider(providerID)) {
    return getAnthropicActualLimit(modelCacheState)
  }

  const normalized = `${providerID}/${modelID}`.toLowerCase()
  if (normalized.includes("gpt-5.4") || normalized.includes("gemini-2.5-pro") || normalized.includes("gemini-3")) {
    return 1_000_000
  }
  if (normalized.includes("gpt-5.3") || normalized.includes("claude-sonnet-4.6")) {
    return 400_000
  }
  return DEFAULT_ACTUAL_LIMIT
}

function isBioSession(sessionID: string): boolean {
  const agent = getSessionAgent(sessionID)
  const key = getAgentConfigKey(agent ?? "")
  return key === "bio-autopilot" ||
    key === "bio-orchestrator" ||
    key === "bio-planner" ||
    key === "bio-methodologist" ||
    key === "bio-pipeline-operator" ||
    key === "paper-evidence-synthesizer" ||
    key === "wet-lab-designer"
}

function getPreemptiveCompactionThreshold(args: {
  sessionID: string
  actualLimit: number
  profile: ContextGuardProfile
  overrides?: {
    one_million?: {
      l1_tokens?: number
      l2_tokens?: number
      l3_tokens?: number
    }
    four_hundred_k?: {
      l1_tokens?: number
      l2_tokens?: number
      l3_tokens?: number
    }
  }
}): number {
  const { sessionID, actualLimit, profile, overrides } = args
  return getContextGuardPreemptiveThreshold({
    actualLimit,
    isBioSession: isBioSession(sessionID),
    profile,
    overrides,
  })
}

type PluginInput = {
  client: {
    session: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: (...args: any[]) => any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summarize: (...args: any[]) => any
    }
    tui: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      showToast: (...args: any[]) => any
    }
  }
  directory: string
}

export function createPreemptiveCompactionHook(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
  modelCacheState?: ModelCacheStateLike,
) {
  const contextGuardProfile = resolveContextGuardProfile(
    pluginConfig.experimental?.context_guard_profile,
  )
  const contextGuardThresholdOverrides = pluginConfig.experimental?.context_guard_thresholds
  const compactionInProgress = new Set<string>()
  const compactedSessions = new Set<string>()
  const tokenCache = new Map<string, CachedCompactionState>()

  const toolExecuteAfter = async (
    input: { tool: string; sessionID: string; callID: string },
    _output: { title: string; output: string; metadata: unknown }
  ) => {
    const { sessionID } = input
    if (compactedSessions.has(sessionID) || compactionInProgress.has(sessionID)) return

    const cached = tokenCache.get(sessionID)
    if (!cached) return

    const actualLimit = inferContextLimit(cached.providerID, cached.modelID, modelCacheState)

    const lastTokens = cached.tokens
    const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)
    const usageRatio = totalInputTokens / actualLimit
    const threshold = getPreemptiveCompactionThreshold({
      sessionID,
      actualLimit,
      profile: contextGuardProfile,
      overrides: contextGuardThresholdOverrides,
    })

    if (usageRatio < threshold) return

    const modelID = cached.modelID
    if (!modelID) return

    compactionInProgress.add(sessionID)

    try {
      const { providerID: targetProviderID, modelID: targetModelID } = resolveCompactionModel(
        pluginConfig,
        sessionID,
        cached.providerID,
        modelID
      )

      await ctx.client.tui
        .showToast({
          body: {
            title: "Auto Compact",
            message: `Summarizing session to reduce context debt (${formatCompactTokens(totalInputTokens)}/${formatCompactTokens(actualLimit)})...`,
            variant: "warning",
            duration: 3000,
          },
        })
        .catch(() => {})

      await withTimeout(
        ctx.client.session.summarize({
          path: { id: sessionID },
          body: { providerID: targetProviderID, modelID: targetModelID, auto: true } as never,
          query: { directory: ctx.directory },
        }),
        PREEMPTIVE_COMPACTION_TIMEOUT_MS,
        `Compaction summarize timed out after ${PREEMPTIVE_COMPACTION_TIMEOUT_MS}ms`,
      )

      compactedSessions.add(sessionID)

      log("[preemptive-compaction] Native session summarize requested", {
        sessionID,
        sourceProviderID: cached.providerID,
        sourceModelID: modelID,
        targetProviderID,
        targetModelID,
        totalInputTokens,
        actualLimit,
        usageRatio,
        threshold,
        thresholdProfile: contextGuardProfile,
      })

      await ctx.client.tui
        .showToast({
          body: {
            title: "Auto Compact",
            message: `Session summarized (${targetProviderID}/${targetModelID}). Context counter should drop now.`,
            variant: "success",
            duration: 5000,
          },
        })
        .catch(() => {})
    } catch (error) {
      // Mark as compacted even on failure to prevent infinite retry loop
      compactedSessions.add(sessionID)

      const errorMessage = String(error)
      log("[preemptive-compaction] Compaction failed", { sessionID, error: errorMessage })

      // Provide specific guidance for token limit errors
      if (isTokenLimitError(error)) {
        await ctx.client.tui
          .showToast({
            body: {
              title: "Auto Compact Failed - Token Limit",
              message: "Context window limit exceeded. Use /ol-checkpoint to save progress and start fresh, or /ol-checkpoint-resume to continue from a previous checkpoint.",
              variant: "error",
              duration: 10000,
            },
          })
          .catch(() => {})
      } else {
        await ctx.client.tui
          .showToast({
            body: {
              title: "Auto Compact Failed",
              message: "Compaction failed. Keep working from the current context or switch to a fresh session with /ol-checkpoint-resume.",
              variant: "error",
              duration: 7000,
            },
          })
          .catch(() => {})
      }
    } finally {
      compactionInProgress.delete(sessionID)
    }
  }

  const eventHandler = async ({ event }: { event: { type: string; properties?: unknown } }) => {
    const props = event.properties as Record<string, unknown> | undefined

    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        compactionInProgress.delete(sessionInfo.id)
        compactedSessions.delete(sessionInfo.id)
        tokenCache.delete(sessionInfo.id)
      }
      return
    }

    if (event.type === "message.updated") {
      const info = props?.info as {
        role?: string
        sessionID?: string
        providerID?: string
        modelID?: string
        finish?: boolean
        tokens?: TokenInfo
      } | undefined

      if (!info || info.role !== "assistant" || !info.finish) return
      if (!info.sessionID || !info.providerID || !info.tokens) return

      tokenCache.set(info.sessionID, {
        providerID: info.providerID,
        modelID: info.modelID ?? "",
        tokens: info.tokens,
      })
      compactedSessions.delete(info.sessionID)
    }
  }

  return {
    "tool.execute.after": toolExecuteAfter,
    event: eventHandler,
  }
}
