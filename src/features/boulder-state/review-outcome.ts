import type { RuntimeWorkflowStage, RuntimeWorkflowVerdict } from "./types"

export interface ParsedReviewOutcome {
  verdict: RuntimeWorkflowVerdict
  blockingFindings: string[]
  nextStage?: RuntimeWorkflowStage
  signature: string
}

const REJECT_PATTERN = /\[REJECT\]/i
const APPROVE_PATTERN = /\[APPROVE\]/i
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
