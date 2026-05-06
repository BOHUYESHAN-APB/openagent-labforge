import { log } from "./logger"

/**
 * Error thrown when a subagent session encounters a retryable issue
 * such as rate limiting, network errors, or provider interruptions.
 */
export class RetryableSubagentError extends Error {
  public readonly reason: string
  public readonly sessionID: string

  constructor(message: string, sessionID: string, reason: string) {
    super(message)
    this.name = "RetryableSubagentError"
    this.sessionID = sessionID
    this.reason = reason
  }
}

const RETRYABLE_ERROR_PATTERNS = [
  "rate_limit",
  "rate limit",
  "too many requests",
  "overloaded",
  "service unavailable",
  "bad gateway",
  "internal server error",
  "connection error",
  "network error",
  "timeout",
  "429",
  "503",
  "502",
  "504",
  "interrupted",
  "aborted",
  "throttle",
  "quota exceeded",
]

const NON_RETRYABLE_PATTERNS = [
  "permission denied",
  "unauthorized",
  "forbidden",
  "not found",
  "invalid api key",
  "authentication",
  "context length",
  "token limit exceeded",
]

interface SDKMessage {
  info?: { role?: string; time?: { created?: number } }
  parts?: Array<{ type: string; text?: string; content?: string | Array<{ type: string; text?: string }> }>
}

/**
 * Check if a set of session messages indicate a retryable error.
 */
export function isSessionErrorRetryable(messages: SDKMessage[]): { retryable: boolean; reason: string } {
  if (!messages || messages.length === 0) {
    return { retryable: false, reason: "" }
  }

  const errorTexts: string[] = []

  for (const msg of messages) {
    for (const part of msg.parts ?? []) {
      if (part.type === "text" && part.text) {
        errorTexts.push(part.text)
      } else if ((part.type as string) === "tool_result") {
        const content = part.content
        if (typeof content === "string") {
          errorTexts.push(content)
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if ((block.type === "text" || block.type === "reasoning") && block.text) {
              errorTexts.push(block.text)
            }
          }
        }
      }
    }
  }

  const combined = errorTexts.join(" ").toLowerCase()

  // Check non-retryable first
  for (const pattern of NON_RETRYABLE_PATTERNS) {
    if (combined.includes(pattern)) {
      return { retryable: false, reason: `non-retryable pattern: ${pattern}` }
    }
  }

  // Check retryable
  for (const pattern of RETRYABLE_ERROR_PATTERNS) {
    if (combined.includes(pattern)) {
      return { retryable: true, reason: `retryable pattern: ${pattern}` }
    }
  }

  return { retryable: false, reason: "" }
}

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  MAX_DELAY_MS: 30000,
} as const

/**
 * Calculate exponential backoff delay.
 */
export function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt)
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS)
}

/**
 * Execute a function with retry logic for subagent operations.
 */
export async function withRetry<T>(
  sessionID: string,
  label: string,
  fn: (attempt: number) => Promise<T>,
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1)
        log(`[subagent-retry] ${label}: attempt ${attempt}/${RETRY_CONFIG.MAX_RETRIES}, waiting ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      const result = await fn(attempt)
      if (attempt > 0) {
        log(`[subagent-retry] ${label}: succeeded on attempt ${attempt}`)
      }
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (error instanceof RetryableSubagentError) {
        log(`[subagent-retry] ${label}: retryable error on attempt ${attempt}: ${error.reason}`)
        if (attempt >= RETRY_CONFIG.MAX_RETRIES) {
          log(`[subagent-retry] ${label}: all retries exhausted`)
          throw new Error(
            `Subagent failed after ${RETRY_CONFIG.MAX_RETRIES + 1} attempts: ${lastError.message}`,
          )
        }
        continue
      }

      // Non-retryable error - throw immediately
      log(`[subagent-retry] ${label}: non-retryable error on attempt ${attempt}: ${lastError.message}`)
      throw lastError
    }
  }

  throw lastError ?? new Error("Unknown retry error")
}
