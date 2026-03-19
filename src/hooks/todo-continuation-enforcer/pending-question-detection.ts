import { log } from "../../shared/logger"
import { HOOK_NAME } from "./constants"

interface MessagePart {
  type: string
  name?: string
  toolName?: string
  text?: string
}

interface Message {
  info?: { role?: string }
  role?: string
  parts?: MessagePart[]
}

export function hasUnansweredQuestion(messages: Message[]): boolean {
  if (!messages || messages.length === 0) return false

  const waitPatterns = [
    /请确认/u,
    /请提供/u,
    /是否继续/u,
    /是否要/u,
    /你希望/u,
    /你想要/u,
    /你觉得/u,
    /你怎么看/u,
    /请给(?:我)?意见/u,
    /请反馈/u,
    /测试后(?:告诉我|反馈)/u,
    /跑完测试(?:告诉我|反馈)/u,
    /确认后(?:告诉我|回复我|我再继续)/u,
    /你来决定/u,
    /你决定/u,
    /请(?:选择|选一个)/u,
    /完成后回我/u,
    /重启后告诉我/u,
    /回我一句/u,
    /需要你确认/u,
    /等待(?:你的|用户)(?:确认|反馈|决定|回复|意见)/u,
    /what do you think/iu,
    /any preference/iu,
    /your (?:feedback|input|decision|opinion)/iu,
    /after you (?:test|review)/iu,
    /once you (?:test|review)/iu,
    /please review/iu,
    /review and confirm/iu,
    /should i proceed/iu,
    /would you like me to continue/iu,
    /do you want me to continue/iu,
    /let me know when/iu,
    /which (one|option|path|approach)/iu,
    /would you like/iu,
    /please provide/iu,
    /please confirm/iu,
    /let me know/iu,
  ]

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const role = msg.info?.role ?? msg.role

    if (role === "user") return false

    if (role === "assistant" && msg.parts) {
      const hasQuestion = msg.parts.some(
        (part) =>
          (part.type === "tool_use" || part.type === "tool-invocation") &&
          (part.name === "question" || part.toolName === "question"),
      )
      if (hasQuestion) {
        log(`[${HOOK_NAME}] Detected pending question tool in last assistant message`)
        return true
      }

      const combinedText = msg.parts
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text?.trim() ?? "")
        .join("\n")
      if (combinedText.length > 0) {
        const normalized = combinedText.trim()
        const looksLikeQuestion = /[?？]/.test(normalized)
          || waitPatterns.some((pattern) => pattern.test(normalized))
        if (looksLikeQuestion) {
          log(`[${HOOK_NAME}] Detected textual prompt awaiting user response`)
          return true
        }
      }

      return false
    }
  }

  return false
}
