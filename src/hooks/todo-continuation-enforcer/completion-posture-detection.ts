interface MessagePart {
  type?: string
  text?: string
}

interface MessageLike {
  info?: { role?: string; id?: string }
  role?: string
  parts?: MessagePart[]
}

export interface CompletionPosture {
  kind: "none" | "terminal_complete" | "pseudo_complete"
  signature?: string
  messageId?: string
  blockingFindings: string[]
}

const COMPLETION_MARKER_PATTERNS = [
  /reviewed wave.*已完成/u,
  /current reviewed wave.*已完成/u,
  /这(?:一|本)(?:小)?波.*完成了/u,
  /这轮.*(?:已完成|完成了|可以收口|可以结束)/u,
  /这一轮.*(?:已完成|完成了|可以收口|可以结束)/u,
  /本批次.*(?:已完成|完成了|可以结束|可以收口)/u,
  /当前.*(?:已完成|完成了|可以结束|可以收口)/u,
  /\b(?:this|current) (?:reviewed )?wave is complete\b/i,
  /\bthis batch (?:is )?complete\b/i,
  /\bcan (?:cleanly )?(?:stop|finish|close out)\b/i,
  /\bno (?:same-wave |same batch )?(?:substantial )?(?:work|deliverables?|tasks?) remain\b/i,
]

const OPTIONAL_RETURN_PATTERNS = [
  /后续如果(?:你)?(?:继续|还想|需要)/u,
  /如果你(?:后续)?(?:继续|还想|想要|需要)/u,
  /如果后续(?:还)?(?:要|想|需要)/u,
  /if you (?:later )?(?:continue|want|would like|need)/i,
  /if further edits? (?:are )?needed/i,
]

const CONCRETE_REMAINING_PATTERNS = [
  /下一最小波/u,
  /下一波范围/u,
  /下一轮/u,
  /下一步.{0,24}(先|就|继续|专门)/u,
  /还值得继续/u,
  /最值得继续/u,
  /锁好(?:了)?下一/u,
  /继续补/u,
  /\bnext (?:minimal )?wave\b/i,
  /\bnext round\b/i,
  /\bnext step\b/i,
  /\bstill worth continuing\b/i,
  /\block(?:ed)? the next wave\b/i,
]

const LIST_SIGNAL_PATTERN = /(^|\n)\s*(?:[-*•]\s+|\d+\.\s+)/m

function buildCompletionSignature(args: {
  messageId?: string
  text: string
  kind: "terminal_complete" | "pseudo_complete"
}): string {
  const normalized = args.text.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 400)
  return JSON.stringify({
    kind: args.kind,
    messageId: args.messageId ?? null,
    text: normalized,
  })
}

export function detectLatestAssistantCompletionPosture(messages: MessageLike[]): CompletionPosture {
  if (!messages || messages.length === 0) {
    return { kind: "none", blockingFindings: [] }
  }

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

    const hasCompletionMarker = COMPLETION_MARKER_PATTERNS.some((pattern) => pattern.test(combinedText))
    if (!hasCompletionMarker) {
      return { kind: "none", blockingFindings: [] }
    }

    const hasOptionalReturn = OPTIONAL_RETURN_PATTERNS.some((pattern) => pattern.test(combinedText))
    const hasConcreteRemaining = CONCRETE_REMAINING_PATTERNS.some((pattern) => pattern.test(combinedText))
    const hasList = LIST_SIGNAL_PATTERN.test(combinedText)

    if (hasConcreteRemaining || (hasOptionalReturn && hasList)) {
      return {
        kind: "pseudo_complete",
        messageId: message.info?.id,
        signature: buildCompletionSignature({
          messageId: message.info?.id,
          text: combinedText,
          kind: "pseudo_complete",
        }),
        blockingFindings: [
          "Completion claim conflicts with explicitly declared remaining work in the same response.",
          "Convert the declared next-step work into a fresh todo wave instead of ending with a conditional follow-up list.",
        ],
      }
    }

    return {
      kind: "terminal_complete",
      messageId: message.info?.id,
      signature: buildCompletionSignature({
        messageId: message.info?.id,
        text: combinedText,
        kind: "terminal_complete",
      }),
      blockingFindings: [],
    }
  }

  return { kind: "none", blockingFindings: [] }
}
