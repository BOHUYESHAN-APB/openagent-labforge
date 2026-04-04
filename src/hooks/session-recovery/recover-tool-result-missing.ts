import type { createOpencodeClient } from "@opencode-ai/sdk"
import type { MessageData } from "./types"
import { readParts } from "./storage"
import { isSqliteBackend } from "../../shared/opencode-storage-detection"
import { normalizeSDKResponse } from "../../shared"
import { collectMissingToolUseIds } from "./tool-pairing"
import { log } from "../../shared/logger"

type Client = ReturnType<typeof createOpencodeClient>
type ClientWithPromptAsync = {
  session: {
    promptAsync: (opts: { path: { id: string }; body: Record<string, unknown> }) => Promise<unknown>
  }
}


interface MessagePart {
  type: string
  id?: string
  tool_use_id?: string
}

async function readPartsFromSDKFallback(
  client: Client,
  sessionID: string,
  messageID: string
): Promise<MessagePart[]> {
  try {
    const response = await client.session.messages({ path: { id: sessionID } })
    const messages = normalizeSDKResponse(response, [] as MessageData[], { preferResponseOnMissingData: true })
    const target = messages.find((m) => m.info?.id === messageID)
    if (!target?.parts) return []

    return target.parts.map((part) => ({
      type: part.type === "tool" ? "tool_use" : part.type,
      id: "callID" in part ? (part as { callID?: string }).callID : part.id,
    }))
  } catch {
    return []
  }
}

export async function recoverToolResultMissing(
  client: Client,
  sessionID: string,
  failedAssistantMsg: MessageData
): Promise<boolean> {
  let parts = failedAssistantMsg.parts || []
  if (parts.length === 0 && failedAssistantMsg.info?.id) {
    if (isSqliteBackend()) {
      parts = await readPartsFromSDKFallback(client, sessionID, failedAssistantMsg.info.id)
    } else {
      const storedParts = readParts(failedAssistantMsg.info.id)
      parts = storedParts.map((part) => ({
        type: part.type === "tool" ? "tool_use" : part.type,
        id: "callID" in part ? (part as { callID?: string }).callID : part.id,
      }))
    }
  }

  const toolUseIds = collectMissingToolUseIds(parts)
  if (toolUseIds.length === 0) {
    log("[session-recovery] tool_result_missing detected but no missing tool_use IDs found", {
      sessionID,
      failedMessageID: failedAssistantMsg.info?.id,
    })
    return false
  }

  const toolResultParts = toolUseIds.map((id) => ({
    type: "tool_result" as const,
    tool_use_id: id,
    content: "Operation cancelled by user (ESC pressed)",
  }))

  const promptInput = {
    path: { id: sessionID },
    body: { parts: toolResultParts },
  }

  try {
    log("[session-recovery] injecting synthetic tool_result parts", {
      sessionID,
      failedMessageID: failedAssistantMsg.info?.id,
      missingToolUseIds: toolUseIds,
    })
    await (client as unknown as ClientWithPromptAsync).session.promptAsync(promptInput)

    return true
  } catch {
    return false
  }
}
