import { log } from "../shared"
import { normalizeSDKResponse } from "../shared"
import { isCompactionAgent } from "../features/background-agent/compaction-aware-message-resolver"

interface SessionMessage {
  info?: {
    agent?: string
    role?: string
  }
}

type SessionClient = {
  session: {
    messages: (opts: { path: { id: string } }) => Promise<{ data?: SessionMessage[] }>
  }
}

export async function resolveSessionAgent(
  client: SessionClient,
  sessionId: string,
): Promise<string | undefined> {
  try {
    const messagesResp = await client.session.messages({ path: { id: sessionId } })
    const messages = normalizeSDKResponse(messagesResp, [] as SessionMessage[])

    for (let index = messages.length - 1; index >= 0; index--) {
      const agent = messages[index].info?.agent
      if (agent && !isCompactionAgent(agent)) {
        return agent
      }
    }
  } catch (error) {
    log("[session-agent-resolver] Failed to resolve agent from session", {
      sessionId,
      error: String(error),
    })
  }
  return undefined
}
