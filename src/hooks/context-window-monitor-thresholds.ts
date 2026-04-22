const DEFAULT_ANTHROPIC_ACTUAL_LIMIT = 200_000
const LABFORGE_NOTICE_THRESHOLD = 0.45
const LABFORGE_FUSE_THRESHOLD = 0.60
const LABFORGE_SEVERE_THRESHOLD = 0.72
const DEFAULT_MODEL_CONTEXT_LIMIT = 200_000

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
  if (modelID) {
    const cached = modelCacheState?.modelContextLimitsCache?.get(`${providerID}/${modelID}`)
    if (cached && cached > 0) return cached
  }
  if (isAnthropicProvider(providerID)) {
    return getAnthropicActualLimit(modelCacheState)
  }

  const normalized = `${providerID}/${modelID ?? ""}`.toLowerCase()
  if (normalized.includes("gpt-5.4") || normalized.includes("gemini-2.5-pro") || normalized.includes("gemini-3")) {
    return 1_000_000
  }
  if (normalized.includes("gpt-5.3") || normalized.includes("claude-sonnet-4.6")) {
    return 400_000
  }
  return DEFAULT_MODEL_CONTEXT_LIMIT
}

export function getNoticeLevel(ratio: number, totalTokens: number, contextLimit: number): 0 | 1 | 2 | 3 {
  // 1M 档位 (>= 600K)
  if (contextLimit >= 600_000) {
    if (totalTokens >= 550_000 || ratio >= LABFORGE_SEVERE_THRESHOLD) return 3
    if (totalTokens >= 320_000 || ratio >= LABFORGE_FUSE_THRESHOLD) return 2
    if (totalTokens >= 220_000 || ratio >= LABFORGE_NOTICE_THRESHOLD) return 1
    return 0
  }
  // 400K 档位 (300K - 600K, 覆盖 256K=262144 和 400K)
  if (contextLimit >= 300_000) {
    if (totalTokens >= 300_000 || ratio >= LABFORGE_SEVERE_THRESHOLD) return 3
    if (totalTokens >= 220_000 || ratio >= LABFORGE_FUSE_THRESHOLD) return 2
    if (totalTokens >= 150_000 || ratio >= LABFORGE_NOTICE_THRESHOLD) return 1
    return 0
  }
  // 200K 档位 (180K - 300K)
  if (contextLimit >= 180_000) {
    if (totalTokens >= 150_000 || ratio >= LABFORGE_SEVERE_THRESHOLD) return 3
    if (totalTokens >= 130_000 || ratio >= LABFORGE_FUSE_THRESHOLD) return 2
    if (totalTokens >= 100_000 || ratio >= LABFORGE_NOTICE_THRESHOLD) return 1
    return 0
  }
  // 默认档位 (< 180K)
  if (ratio >= LABFORGE_SEVERE_THRESHOLD) return 3
  if (ratio >= LABFORGE_FUSE_THRESHOLD) return 2
  if (ratio >= LABFORGE_NOTICE_THRESHOLD) return 1
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
