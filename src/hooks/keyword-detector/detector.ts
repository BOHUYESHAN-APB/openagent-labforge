import {
  KEYWORD_DETECTORS,
  CODE_BLOCK_PATTERN,
  INLINE_CODE_PATTERN,
} from "./constants"

export interface DetectedKeyword {
  type: "ultrawork" | "ultrawork-autonomous" | "search" | "analyze"
  message: string
}

const INJECTED_MODE_PREFIX_PATTERNS = [
  "[search-mode]",
  "[analyze-mode]",
  "[semantic-mode-hint]",
  "[ultrawork-autonomous-mode]",
  "<ultrawork-mode>",
]

const INJECTION_SEPARATOR = "\n\n---\n\n"

/**
 * Removes paste placeholder text that leaks from the frontend.
 * Pattern: [Pasted ~N lines] or [Pasted N lines]
 */
function removePastePlaceholders(text: string): string {
  // Remove the placeholder and any surrounding whitespace
  return text.replace(/\[Pasted ~?\d+ lines?\]\s*/gi, "").trim()
}

export function removeCodeBlocks(text: string): string {
  return text.replace(CODE_BLOCK_PATTERN, "").replace(INLINE_CODE_PATTERN, "")
}

export function stripInjectedKeywordPrelude(text: string): string {
  let current = text

  // First, remove any paste placeholders that leaked from the frontend
  current = removePastePlaceholders(current)

  while (true) {
    const trimmed = current.trimStart()
    const hasInjectedPrefix = INJECTED_MODE_PREFIX_PATTERNS.some((prefix) =>
      trimmed.startsWith(prefix),
    )
    if (!hasInjectedPrefix) {
      return current
    }

    const separatorIndex = current.indexOf(INJECTION_SEPARATOR)
    if (separatorIndex === -1) {
      return current
    }

    current = current.slice(separatorIndex + INJECTION_SEPARATOR.length)
  }
}

/**
 * Resolves message to string, handling both static strings and dynamic functions.
 */
function resolveMessage(
  message: string | ((agentName?: string, modelID?: string) => string),
  agentName?: string,
  modelID?: string
): string {
  return typeof message === "function" ? message(agentName, modelID) : message
}

export function detectKeywords(text: string, agentName?: string, modelID?: string): string[] {
  const textWithoutCode = removeCodeBlocks(text)
  return KEYWORD_DETECTORS.filter(({ pattern }) =>
    pattern.test(textWithoutCode)
  ).map(({ message }) => resolveMessage(message, agentName, modelID))
}

export function detectKeywordsWithType(text: string, agentName?: string, modelID?: string): DetectedKeyword[] {
  const textWithoutCode = removeCodeBlocks(text)
  const normalizedLeadingText = textWithoutCode.trim().toLowerCase()
  return KEYWORD_DETECTORS.map(({ pattern, message }) => {
    const resolvedMessage = resolveMessage(message, agentName, modelID)
    let type: DetectedKeyword["type"] = "search"
    if (resolvedMessage === "[ultrawork-autonomous-trigger]") {
      type = "ultrawork-autonomous"
    } else if (resolvedMessage.includes("<ultrawork-mode>")) {
      type = "ultrawork"
    } else if (resolvedMessage.includes("[analyze-mode]")) {
      type = "analyze"
    }

    return {
      matches:
        type === "ultrawork-autonomous"
          ? /^(ultrawork\s+auto|ultrawork\s+autonomous|ultra\s+auto|ultra\s+autonomous|ulw\s+auto|ulw\s+autonomous)\b/i.test(normalizedLeadingText)
          : pattern.test(textWithoutCode),
      type,
      message: resolvedMessage,
    }
  })
    .filter((result) => result.matches)
    .map(({ type, message }) => ({ type, message }))
}

export function extractPromptText(
  parts: Array<{ type: string; text?: string }>
): string {
  const rawText = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text || "")
    .join(" ")

  return removePastePlaceholders(rawText)
}
