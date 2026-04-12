import type { RuntimeWorkflowStage, RuntimeWorkflowVerdict } from "./types"

export interface ParsedReviewOutcome {
  verdict: RuntimeWorkflowVerdict
  blockingFindings: string[]
  nextStage?: RuntimeWorkflowStage
  signature: string
}

export interface ParsedReviewBlocker {
  messageId?: string
  reason: string
  signature: string
}

const REJECT_PATTERN = /\[REJECT\]/i
const APPROVE_PATTERN = /\[APPROVE\]/i
const REVIEW_BLOCKER_AGENT_PATTERN =
  /\bacceptance-review(?:er)?\b|验收|acceptance review|review delegation/iu
const REVIEW_BLOCKER_UNAVAILABLE_PATTERN =
  /\bunavailable\b|\bnot available\b|\bfailed to run\b|\btool .* unavailable\b|不可用|阻塞|blocked/iu
const NUMBERED_FINDING_PATTERN = /^\s*\d+\.\s+(.+)$/gm
const BULLET_FINDING_PATTERN = /^\s*[-*]\s+(.+)$/gm

export function parseAcceptanceReviewOutcome(text: string): ParsedReviewOutcome | null {
  if (!text) return null

  if (REJECT_PATTERN.test(text)) {
    const numbered = Array.from(text.matchAll(NUMBERED_FINDING_PATTERN)).map((match) => match[1].trim())
    const bullet = Array.from(text.matchAll(BULLET_FINDING_PATTERN)).map((match) => match[1].trim())
    const blockingFindings = Array.from(new Set([...numbered, ...bullet])).filter(Boolean)

    const lower = text.toLowerCase()
    const nextStage =
      /\b(plan|re-plan|replan|planning|design)\b/.test(lower)
        ? "plan"
        : "build"

    return {
      verdict: "reject",
      blockingFindings,
      nextStage,
      signature: JSON.stringify({
        verdict: "reject",
        blockingFindings,
        nextStage,
      }),
    }
  }

  if (APPROVE_PATTERN.test(text)) {
    return {
      verdict: "approve",
      blockingFindings: [],
      signature: JSON.stringify({
        verdict: "approve",
        blockingFindings: [],
      }),
    }
  }

  return null
}

export function parseAcceptanceReviewBlocker(
  text: string,
): ParsedReviewBlocker | null {
  if (!text) return null
  if (
    !REVIEW_BLOCKER_AGENT_PATTERN.test(text) ||
    !REVIEW_BLOCKER_UNAVAILABLE_PATTERN.test(text)
  ) {
    return null
  }

  const normalized = text.replace(/\s+/g, " ").trim().slice(0, 600)
  return {
    reason: normalized,
    signature: JSON.stringify({
      kind: "review-blocker",
      reason: normalized,
    }),
  }
}

interface MessagePart {
  type: string
  text?: string
}

interface MessageLike {
  info?: { role?: string }
  role?: string
  parts?: MessagePart[]
}

export function parseLatestAcceptanceReviewOutcome(messages: MessageLike[]): ParsedReviewOutcome | null {
  if (!messages || messages.length === 0) return null

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    const role = message.info?.role ?? message.role
    if (role !== "assistant" || !message.parts) continue

    const combinedText = message.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text?.trim() ?? "")
      .join("\n")
      .trim()

    if (!combinedText) continue

    const parsed = parseAcceptanceReviewOutcome(combinedText)
    if (parsed) return parsed
  }

  return null
}

export function parseLatestAcceptanceReviewBlocker(
  messages: MessageLike[],
): ParsedReviewBlocker | null {
  if (!messages || messages.length === 0) return null

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    const role = message.info?.role ?? message.role
    if (role !== "assistant" || !message.parts) continue

    const combinedText = message.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text?.trim() ?? "")
      .join("\n")
      .trim()

    if (!combinedText) continue

    const parsed = parseAcceptanceReviewBlocker(combinedText)
    if (parsed) {
      return {
        ...parsed,
        messageId: (message.info as { id?: string } | undefined)?.id,
      }
    }
  }

  return null
}
