import { CONTINUATION_REPLAN_MARKER } from "./constants"

interface MessagePart {
  type: string
  text?: string
}

interface Message {
  info?: { role?: string }
  role?: string
  parts?: MessagePart[]
}

const CONTINUATION_INTENT_PATTERNS = [
  /下一步.{0,24}(继续|推进|处理|完成|优化|改进|拆分|实现|收尾)/u,
  /我(?:会|将).{0,24}(继续|接着|推进|处理|完成|优化|改进|实现)/u,
  /默认继续/u,
  /还剩下.{0,24}(点|项|块|部分|问题|任务)/u,
  /值得继续/u,
  /继续打磨/u,
  /下一轮/u,
  /如果(?:你)?继续/u,
  /后面可以继续/u,
  /\bnext step(?:s)?\b[\s\S]{0,60}\b(continue|proceed|finish|tackle|address|implement|work on|keep working on)\b/i,
  /\bI(?:'ll| will)\b[\s\S]{0,60}\b(continue|proceed|finish|tackle|address|implement|work on|keep working on)\b/i,
  /\bdefault(?:ing)? to continue\b/i,
  /\bremaining (work|items|tasks|issues|points)\b/i,
  /\bworth continuing\b/i,
  /\bnext round\b/i,
  /\bif you continue\b/i,
  /\bfurther improvements?\b/i,
]

const LIST_SIGNAL_PATTERN = /(^|\n)\s*(?:[-*•]\s+|\d+\.\s+)/m

export function hasContinuationIntent(messages: Message[]): boolean {
  if (!messages || messages.length === 0) return false

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const role = msg.info?.role ?? msg.role

    if (role === "user") return false

    if (role === "assistant" && msg.parts) {
      const combinedText = msg.parts
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text?.trim() ?? "")
        .join("\n")
        .trim()

      if (!combinedText) return false

      if (combinedText.includes(CONTINUATION_REPLAN_MARKER)) {
        return true
      }

      const hasIntentPattern = CONTINUATION_INTENT_PATTERNS.some((pattern) => pattern.test(combinedText))
      if (!hasIntentPattern) {
        return false
      }

      const looksLikeBacklogList = LIST_SIGNAL_PATTERN.test(combinedText)
        || /两个点|三件事|两点|三点|two items|three items|two points|three points/i.test(combinedText)

      return looksLikeBacklogList || hasIntentPattern
    }
  }

  return false
}
