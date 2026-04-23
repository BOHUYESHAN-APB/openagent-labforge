import type { ContextCollector } from "./collector"
import type { Message, Part } from "@opencode-ai/sdk"
import { log } from "../../shared"
import { getMainSessionID } from "../claude-code-session-state"

interface OutputPart {
  type: string
  text?: string
  [key: string]: unknown
}

interface InjectionResult {
  injected: boolean
  contextLength: number
}

/**
 * Removes paste placeholder text that leaks from the frontend.
 * Pattern: [Pasted ~N lines] or [Pasted N lines]
 */
function cleanPastePlaceholders(text: string): string {
  return text.replace(/\[Pasted ~?\d+ lines?\]\s*/gi, "").trim()
}

/**
 * Strips previously injected context that uses the separator pattern.
 * This handles undo/replay scenarios where old injections need to be removed.
 */
function stripInjectedContext(text: string): string {
  const separator = "\n\n---\n\n"
  const separatorIndex = text.indexOf(separator)

  if (separatorIndex === -1) {
    return text
  }

  // Check if there's content before the separator (likely injected)
  const beforeSeparator = text.slice(0, separatorIndex).trim()
  const afterSeparator = text.slice(separatorIndex + separator.length)

  // If the content before separator looks like injected content, strip it
  // Injected content typically has tags or structured format
  if (beforeSeparator.length > 0 && (
    beforeSeparator.includes("[") ||
    beforeSeparator.includes("<") ||
    beforeSeparator.includes("MODE") ||
    beforeSeparator.length > 500 // Long structured content
  )) {
    return afterSeparator
  }

  return text
}

export function injectPendingContext(
  collector: ContextCollector,
  sessionID: string,
  parts: OutputPart[]
): InjectionResult {
  if (!collector.hasPending(sessionID)) {
    return { injected: false, contextLength: 0 }
  }

  const textPartIndex = parts.findIndex((p) => p.type === "text" && p.text !== undefined)
  if (textPartIndex === -1) {
    return { injected: false, contextLength: 0 }
  }

  const pending = collector.consume(sessionID)
  let originalText = parts[textPartIndex].text ?? ""

  // Clean paste placeholders and strip old injections (for undo/replay)
  originalText = cleanPastePlaceholders(originalText)
  originalText = stripInjectedContext(originalText)

  parts[textPartIndex].text = `${pending.merged}\n\n---\n\n${originalText}`

  return {
    injected: true,
    contextLength: pending.merged.length,
  }
}

interface ChatMessageInput {
  sessionID: string
  agent?: string
  model?: { providerID: string; modelID: string }
  messageID?: string
}

interface ChatMessageOutput {
  message: Record<string, unknown>
  parts: OutputPart[]
}

export function createContextInjectorHook(collector: ContextCollector) {
  return {
    "chat.message": async (
      input: ChatMessageInput,
      output: ChatMessageOutput
    ): Promise<void> => {
      const result = injectPendingContext(collector, input.sessionID, output.parts)
      if (result.injected) {
        log("[context-injector] Injected pending context via chat.message", {
          sessionID: input.sessionID,
          contextLength: result.contextLength,
        })
      }
    },
  }
}

interface MessageWithParts {
  info: Message
  parts: Part[]
}

type MessagesTransformHook = {
  "experimental.chat.messages.transform"?: (
    input: Record<string, never>,
    output: { messages: MessageWithParts[] }
  ) => Promise<void>
}

/**
 * Removes previously injected synthetic parts to prevent duplication on undo/replay.
 */
function removeSyntheticParts(parts: Part[]): void {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i] as { synthetic?: boolean }
    if (part.synthetic === true) {
      parts.splice(i, 1)
      log("[context-injector] Removed stale synthetic part on replay", { partIndex: i })
    }
  }
}

/**
 * Cleans paste placeholders from all text parts in the message.
 */
function cleanTextParts(parts: Part[]): void {
  for (const part of parts) {
    if (part.type === "text" && (part as { text?: string }).text) {
      const textPart = part as { text: string }
      const cleaned = cleanPastePlaceholders(textPart.text)
      if (cleaned !== textPart.text) {
        log("[context-injector] Cleaned paste placeholder from text part", {
          before: textPart.text.slice(0, 100),
          after: cleaned.slice(0, 100),
        })
        textPart.text = cleaned
      }
    }
  }
}

export function createContextInjectorMessagesTransformHook(
  collector: ContextCollector
): MessagesTransformHook {
  return {
    "experimental.chat.messages.transform": async (_input, output) => {
      const startedAt = performance.now()
      const { messages } = output
      log("[DEBUG] experimental.chat.messages.transform called", {
        messageCount: messages.length,
      })
      if (messages.length === 0) {
        return
      }

      let lastUserMessageIndex = -1
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].info.role === "user") {
          lastUserMessageIndex = i
          break
        }
      }

      if (lastUserMessageIndex === -1) {
        log("[DEBUG] No user message found in messages")
        return
      }

      const lastUserMessage = messages[lastUserMessageIndex]

      // Remove stale synthetic parts from previous injections (undo/replay scenario)
      removeSyntheticParts(lastUserMessage.parts)

      // Clean paste placeholders from all text parts
      cleanTextParts(lastUserMessage.parts)
      // Try message.info.sessionID first, fallback to mainSessionID
      const messageSessionID = (lastUserMessage.info as unknown as { sessionID?: string }).sessionID
      const sessionID = messageSessionID ?? getMainSessionID()
      log("[DEBUG] Extracted sessionID", {
        messageSessionID,
        mainSessionID: getMainSessionID(),
        sessionID,
        infoKeys: Object.keys(lastUserMessage.info),
      })
      if (!sessionID) {
        log("[DEBUG] sessionID is undefined (both message.info and mainSessionID are empty)")
        return
      }

      const hasPending = collector.hasPending(sessionID)
      log("[DEBUG] Checking hasPending", {
        sessionID,
        hasPending,
      })
      if (!hasPending) {
        return
      }

      const pending = collector.consume(sessionID)
      if (!pending.hasContent) {
        return
      }

      const textPartIndex = lastUserMessage.parts.findIndex(
        (p) => p.type === "text" && (p as { text?: string }).text
      )

      if (textPartIndex === -1) {
        log("[context-injector] No text part found in last user message, skipping injection", {
          sessionID,
          partsCount: lastUserMessage.parts.length,
        })
        return
      }

      // synthetic part pattern (minimal fields)
      const syntheticPart = {
        id: `synthetic_hook_${sessionID}`,
        messageID: lastUserMessage.info.id,
        sessionID: (lastUserMessage.info as { sessionID?: string }).sessionID ?? "",
        type: "text" as const,
        text: pending.merged,
        synthetic: true,  // hidden in UI
      }

      lastUserMessage.parts.splice(textPartIndex, 0, syntheticPart as Part)

      log("[context-injector] Inserted synthetic part with hook content", {
        sessionID,
        contentLength: pending.merged.length,
        elapsedMs: Math.round(performance.now() - startedAt),
      })

      log("[perf] context-injector.messages-transform", {
        sessionID,
        messageCount: messages.length,
        contextLength: pending.merged.length,
        elapsedMs: Math.round(performance.now() - startedAt),
      })
    },
  }
}
