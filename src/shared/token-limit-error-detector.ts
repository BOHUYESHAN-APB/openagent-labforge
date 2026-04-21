/**
 * Detect if an error is related to token/context limits.
 *
 * This function checks if an error message indicates that the request exceeded
 * the model's token or context window limits. This is useful for:
 * - Preventing infinite retry loops when compression is needed
 * - Providing better error messages to users
 * - Triggering automatic compression when appropriate
 *
 * @param error - The error to check (can be Error, string, or any object)
 * @returns true if the error is related to token limits, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await sendPrompt(...)
 * } catch (error) {
 *   if (isTokenLimitError(error)) {
 *     // Suggest compression or checkpoint
 *     console.log("Context too large, please compress or create checkpoint")
 *   } else {
 *     // Handle other errors
 *     throw error
 *   }
 * }
 * ```
 */
export function isTokenLimitError(error: unknown): boolean {
  if (!error) return false

  const message = String(error).toLowerCase()

  return (
    message.includes("token limit") ||
    message.includes("context length") ||
    message.includes("maximum context") ||
    message.includes("context window") ||
    message.includes("too many tokens") ||
    message.includes("context_length_exceeded") ||
    message.includes("tokens exceed") ||
    (message.includes("exceeds") && message.includes("token"))
  )
}

/**
 * Detect if an API response contains a token limit error.
 *
 * Convenience function for checking API response objects that have
 * an error field with a message property.
 *
 * @param response - API response object with optional error field
 * @returns true if the response contains a token limit error
 *
 * @example
 * ```typescript
 * const response = await apiCall(...)
 * if (isTokenLimitErrorFromResponse(response)) {
 *   // Handle token limit error
 * }
 * ```
 */
export function isTokenLimitErrorFromResponse(response: { error?: { message?: string } }): boolean {
  return isTokenLimitError(response.error?.message)
}

/**
 * Extract a user-friendly message from a token limit error.
 *
 * @param error - The token limit error
 * @returns A user-friendly error message with suggestions
 */
export function getTokenLimitErrorMessage(error: unknown): string {
  const baseMessage = "Context window limit exceeded."
  const suggestions = [
    "Try one of these options:",
    "1. Run /ol-compress-context to compress the current session",
    "2. Run /ol-checkpoint to save progress and start fresh",
    "3. Use /ol-checkpoint-resume to continue from a previous checkpoint",
  ]

  return `${baseMessage}\n\n${suggestions.join("\n")}`
}
