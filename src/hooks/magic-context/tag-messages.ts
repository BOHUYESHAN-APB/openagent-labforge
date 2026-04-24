import type { PluginInput } from "@opencode-ai/plugin"
import type { OhMyOpenCodeConfig } from "../../config"
import { createMessageTag, formatTag } from "../../features/magic-context/tagger"
import { log } from "../../shared/logger"

type MessageWithParts = {
  info: {
    id?: string
    role?: string
    sessionID?: string
  }
  parts: Array<{
    type?: string
    text?: string
    [key: string]: unknown
  }>
}

/**
 * Hook to inject tags into messages
 */
export function createTagMessagesHook(
  ctx: PluginInput,
  pluginConfig: OhMyOpenCodeConfig,
) {
  const tagSystemEnabled = pluginConfig.experimental?.magic_context?.tag_system_enabled ?? true
  const magicContextEnabled = pluginConfig.experimental?.magic_context?.enabled ?? false

  if (!magicContextEnabled || !tagSystemEnabled) {
    return {}
  }

  const messagesTransform = async (
    _input: Record<string, never>,
    output: { messages: MessageWithParts[] },
  ): Promise<void> => {
    const { messages } = output
    if (messages.length === 0) return

    // Find session ID from messages
    let sessionID: string | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      const candidate = messages[i].info.sessionID
      if (candidate) {
        sessionID = candidate
        break
      }
    }

    if (!sessionID) return

    // Tag user and assistant messages
    for (const message of messages) {
      const role = message.info.role
      if (role !== "user" && role !== "assistant") continue

      const messageId = message.info.id
      if (!messageId) continue

      // Check if already tagged
      const textParts = message.parts.filter(p => p.type === "text" && typeof p.text === "string")
      if (textParts.length === 0) continue

      const firstTextPart = textParts[0]
      const text = firstTextPart.text as string

      // Skip if already tagged
      if (text.startsWith("§") && /^§\d+§/.test(text)) {
        continue
      }

      // Create tag and inject
      try {
        const tag = createMessageTag(ctx.directory, sessionID, messageId, text)
        const taggedText = `${formatTag(tag.tagNumber)} ${text}`
        firstTextPart.text = taggedText

        log("[magic-context] Tagged message", {
          sessionID,
          messageId,
          tagNumber: tag.tagNumber,
          role,
        })
      } catch (error) {
        log("[magic-context] Failed to tag message", {
          sessionID,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  return {
    "experimental.chat.messages.transform": messagesTransform,
  }
}
