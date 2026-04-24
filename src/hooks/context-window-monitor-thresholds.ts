const DEFAULT_ANTHROPIC_ACTUAL_LIMIT = 200_000
const LABFORGE_NOTICE_THRESHOLD = 0.45
const LABFORGE_FUSE_THRESHOLD = 0.60
const LABFORGE_SEVERE_THRESHOLD = 0.72
// Use 128K as conservative default for unknown models (common for GPT-4 and many modern models)
// This is safer than 200K which may cause issues with models that have smaller context windows
const DEFAULT_MODEL_CONTEXT_LIMIT = 128_000

export const ANTHROPIC_DISPLAY_LIMIT = 1_000_000
export const CONTEXT_WARNING_THRESHOLD = 0.70

export type ModelCacheStateLike = {
  anthropicContext1MEnabled: boolean
  modelContextLimitsCache?: Map<string, number>
}

export interface TokenInfo {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export interface CachedTokenState {
  providerID: string
  modelID?: string
  tokens: TokenInfo
}

export interface CompressionTransformStats {
  removedTokens: number
  removedMessages: number
  compactedToolOutputs: number
}

export interface MessageWithParts {
  info: {
    id?: string
    role?: string
    sessionID?: string
  }
  parts: Array<Record<string, unknown>>
}

export function isAnthropicProvider(providerID: string): boolean {
  return providerID === "anthropic" || providerID === "google-vertex-anthropic"
}

function getAnthropicActualLimit(modelCacheState?: ModelCacheStateLike): number {
  return (modelCacheState?.anthropicContext1MEnabled ?? false) ||
    process.env.ANTHROPIC_1M_CONTEXT === "true" ||
    process.env.VERTEX_ANTHROPIC_1M_CONTEXT === "true"
    ? 1_000_000
    : DEFAULT_ANTHROPIC_ACTUAL_LIMIT
}

export function inferContextLimit(providerID: string, modelID: string | undefined, modelCacheState?: ModelCacheStateLike): number {
  // Priority 1: Use cached context limit from OpenCode provider data (most accurate)
  if (modelID) {
    const cached = modelCacheState?.modelContextLimitsCache?.get(`${providerID}/${modelID}`)
    if (cached && cached > 0) {
      return cached
    }
  }

  // Priority 2: Try to get context window from OpenCode's connected providers cache
  // This is populated by OpenCode when it fetches provider/model information
  if (modelID) {
    try {
      const { getModelContextWindow } = require("../shared/connected-providers-cache")
      const contextFromCache = getModelContextWindow(modelID)
      if (contextFromCache && contextFromCache > 0) {
        return contextFromCache
      }
    } catch {
      // Ignore if module not available or error occurs
    }
  }

  // Priority 3: Check if large context mode is enabled (for Anthropic and other 1M models)
  if (modelCacheState?.anthropicContext1MEnabled) {
    return 1_000_000
  }

  // Priority 4: Provider-specific defaults
  if (isAnthropicProvider(providerID)) {
    return getAnthropicActualLimit(modelCacheState)
  }

  // Priority 5: Model name pattern matching (fallback, less reliable)
  const normalized = `${providerID}/${modelID ?? ""}`.toLowerCase()

  // 1M models
  if (normalized.includes("deepseek-v4")) {
    return 1_000_000
  }
  if (normalized.includes("gemini-3") || normalized.includes("gemini-2.5-pro")) {
    return 1_000_000
  }
  if (normalized.includes("gpt-5.4") || normalized.includes("gpt-5-4")) {
    return 1_000_000
  }
  if (normalized.includes("claude") && (normalized.includes("opus") || normalized.includes("sonnet"))) {
    // Modern Claude models typically have 200K context
    return 200_000
  }

  // 400K models
  if (normalized.includes("gpt-5.3") || normalized.includes("gpt-5-3")) {
    return 400_000
  }

  // 256K models
  if (normalized.includes("kimi") || normalized.includes("k2.5")) {
    return 256_000
  }

  // 200K models
  if (normalized.includes("gemini-2.0") || normalized.includes("gemini-1.5")) {
    return 200_000
  }

  // 128K models (common default for many models)
  if (normalized.includes("gpt-4") || normalized.includes("gpt-3.5")) {
    return 128_000
  }

  // Priority 6: Conservative default (128K is safer than 200K for unknown models)
  return DEFAULT_MODEL_CONTEXT_LIMIT
}

export function getNoticeLevel(ratio: number, totalTokens: number, contextLimit: number): 0 | 1 | 2 | 3 {
  // Align with OpenCode's 50% threshold - don't warn too early
  // OpenCode shows context usage at 50%, we should be conservative

  // 1M+ models (>= 800K)
  if (contextLimit >= 800_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3  // 75%
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2  // 65%
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1  // 55%
    return 0
  }

  // 400K-800K models (includes 400K, 512K, etc.)
  if (contextLimit >= 350_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1
    return 0
  }

  // 256K models (Kimi, etc.)
  if (contextLimit >= 240_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1
    return 0
  }

  // 200K models
  if (contextLimit >= 180_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1
    return 0
  }

  // 173K models (GitHub Copilot Gemini, etc.)
  if (contextLimit >= 160_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1
    return 0
  }

  // 128K models (GPT-4, etc.)
  if (contextLimit >= 120_000) {
    if (ratio >= 0.75 || totalTokens >= contextLimit * 0.75) return 3
    if (ratio >= 0.65 || totalTokens >= contextLimit * 0.65) return 2
    if (ratio >= 0.55 || totalTokens >= contextLimit * 0.55) return 1
    return 0
  }

  // Smaller models (< 128K) - be more conservative
  if (ratio >= 0.72) return 3
  if (ratio >= 0.60) return 2
  if (ratio >= 0.50) return 1
  return 0
}

export function formatCompactTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`
  return String(tokens)
}

export function buildProgressBar(ratio: number): string {
  const width = 30
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)))
  return `${"#".repeat(filled)}${".".repeat(width - filled)}`
}

export function estimateTokensFromText(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function looksLikeCompressionNotice(text: string): boolean {
  const normalized = text.trim()
  return normalized.includes("▣ DCP |") ||
    normalized.includes("Compression #") ||
    normalized.includes("▣ Labforge |") ||
    normalized.includes("Compression guard L")
}
