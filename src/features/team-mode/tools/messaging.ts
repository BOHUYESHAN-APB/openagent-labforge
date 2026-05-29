// Team tools messaging
import { sendMessage } from "../team-mailbox/send"
import { pollMessages } from "../team-mailbox/poll"
import type { Message } from "../types"

export async function teamSendMessage(
  teamName: string,
  to: string,
  from: string,
  body: string,
  kind: Message["kind"] = "message"
): Promise<Message> {
  return sendMessage(teamName, to, from, body, kind)
}

export async function teamPollMessages(
  teamName: string,
  recipientName: string
): Promise<Message[]> {
  return pollMessages(teamName, recipientName)
}
