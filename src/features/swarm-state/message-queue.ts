/*
 * SWARM SYSTEM - TEMPORARILY DISABLED
 *
 * This file is part of the swarm parallel coordination system.
 * Disabled because OpenCode doesn't officially support execution-type parallel agents yet.
 *
 * Preserved for future use when OpenCode adds official parallel support.
 * Date disabled: 2026-04-23
 */

import { join } from "path"
import { existsSync, readdirSync, readFileSync } from "fs"
import { writeJSONAtomically } from "../../shared/write-file-atomically"

export interface SwarmMessage {
  from: string
  to: string
  type: "task_complete" | "question" | "status_update" | "error"
  content: string
  timestamp: string
}

function getMessagesDir(swarmId: string): string {
  return join(process.cwd(), ".opencode", "openagent-labforge", "swarm", swarmId, "messages")
}

function generateMessageFileName(message: SwarmMessage): string {
  // Format: {timestamp}-{from}-to-{to}.json
  // Use ISO timestamp without colons for filesystem compatibility
  const timestamp = message.timestamp.replace(/:/g, "-").replace(/\./g, "-")
  return `${timestamp}-${message.from}-to-${message.to}.json`
}

export async function sendMessage(swarmId: string, message: SwarmMessage): Promise<void> {
  const messagesDir = getMessagesDir(swarmId)

  if (!existsSync(messagesDir)) {
    throw new Error(`Swarm ${swarmId} messages directory not found`)
  }

  const fileName = generateMessageFileName(message)
  const filePath = join(messagesDir, fileName)

  // Append-only write, no locking needed
  writeJSONAtomically(filePath, message)
}

export async function readMessages(
  swarmId: string,
  recipient: string,
  since?: string
): Promise<SwarmMessage[]> {
  const messagesDir = getMessagesDir(swarmId)

  if (!existsSync(messagesDir)) {
    return []
  }

  try {
    const files = readdirSync(messagesDir)
      .filter((f) => f.endsWith(".json"))
      .filter((f) => f.includes(`-to-${recipient}.json`))

    const messages: SwarmMessage[] = []

    for (const file of files) {
      const filePath = join(messagesDir, file)
      const content = readFileSync(filePath, "utf-8")
      const message = JSON.parse(content) as SwarmMessage

      // Filter by timestamp if provided
      if (since && message.timestamp <= since) {
        continue
      }

      messages.push(message)
    }

    // Sort by timestamp (ascending)
    messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    return messages
  } catch (error) {
    console.error(`Failed to read messages for swarm ${swarmId}:`, error)
    return []
  }
}

export async function readAllMessages(swarmId: string): Promise<SwarmMessage[]> {
  const messagesDir = getMessagesDir(swarmId)

  if (!existsSync(messagesDir)) {
    return []
  }

  try {
    const files = readdirSync(messagesDir).filter((f) => f.endsWith(".json"))

    const messages: SwarmMessage[] = []

    for (const file of files) {
      const filePath = join(messagesDir, file)
      const content = readFileSync(filePath, "utf-8")
      const message = JSON.parse(content) as SwarmMessage
      messages.push(message)
    }

    // Sort by timestamp (ascending)
    messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    return messages
  } catch (error) {
    console.error(`Failed to read all messages for swarm ${swarmId}:`, error)
    return []
  }
}

export async function clearMessages(swarmId: string): Promise<void> {
  const messagesDir = getMessagesDir(swarmId)

  if (!existsSync(messagesDir)) {
    return
  }

  try {
    const files = readdirSync(messagesDir).filter((f) => f.endsWith(".json"))

    for (const file of files) {
      const filePath = join(messagesDir, file)
      const fs = await import("fs")
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`Failed to clear messages for swarm ${swarmId}:`, error)
  }
}

/*
 * END OF SWARM SYSTEM - TEMPORARILY DISABLED
 */
