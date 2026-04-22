import { join } from "path"
import { existsSync, readdirSync, readFileSync } from "fs"
import { writeJSONAtomically } from "../../shared/write-file-atomically"

export interface Heartbeat {
  agent: string
  status: "active" | "idle" | "error"
  last_heartbeat: string
  current_task?: string
}

function getHeartbeatsDir(swarmId: string): string {
  return join(process.cwd(), ".opencode", "openagent-labforge", "swarm", swarmId, "heartbeats")
}

function getHeartbeatPath(swarmId: string, agentName: string): string {
  return join(getHeartbeatsDir(swarmId), `${agentName}.json`)
}

export async function updateHeartbeat(swarmId: string, heartbeat: Heartbeat): Promise<void> {
  const heartbeatsDir = getHeartbeatsDir(swarmId)

  if (!existsSync(heartbeatsDir)) {
    throw new Error(`Swarm ${swarmId} heartbeats directory not found`)
  }

  const heartbeatPath = getHeartbeatPath(swarmId, heartbeat.agent)

  // Single writer per agent, no locking needed
  writeJSONAtomically(heartbeatPath, heartbeat)
}

export async function readHeartbeat(
  swarmId: string,
  agentName: string
): Promise<Heartbeat | null> {
  const heartbeatPath = getHeartbeatPath(swarmId, agentName)

  if (!existsSync(heartbeatPath)) {
    return null
  }

  try {
    const content = readFileSync(heartbeatPath, "utf-8")
    return JSON.parse(content) as Heartbeat
  } catch (error) {
    console.error(`Failed to read heartbeat for agent ${agentName} in swarm ${swarmId}:`, error)
    return null
  }
}

export async function readAllHeartbeats(swarmId: string): Promise<Heartbeat[]> {
  const heartbeatsDir = getHeartbeatsDir(swarmId)

  if (!existsSync(heartbeatsDir)) {
    return []
  }

  try {
    const files = readdirSync(heartbeatsDir).filter((f) => f.endsWith(".json"))

    const heartbeats: Heartbeat[] = []

    for (const file of files) {
      const filePath = join(heartbeatsDir, file)
      const content = readFileSync(filePath, "utf-8")
      const heartbeat = JSON.parse(content) as Heartbeat
      heartbeats.push(heartbeat)
    }

    return heartbeats
  } catch (error) {
    console.error(`Failed to read all heartbeats for swarm ${swarmId}:`, error)
    return []
  }
}

export async function checkStaleHeartbeats(
  swarmId: string,
  timeoutMs: number
): Promise<string[]> {
  const heartbeats = await readAllHeartbeats(swarmId)
  const now = Date.now()
  const staleAgents: string[] = []

  for (const heartbeat of heartbeats) {
    const lastHeartbeatTime = new Date(heartbeat.last_heartbeat).getTime()
    const age = now - lastHeartbeatTime

    if (age > timeoutMs) {
      staleAgents.push(heartbeat.agent)
    }
  }

  return staleAgents
}

export async function deleteHeartbeat(swarmId: string, agentName: string): Promise<void> {
  const heartbeatPath = getHeartbeatPath(swarmId, agentName)

  if (!existsSync(heartbeatPath)) {
    return
  }

  try {
    const fs = await import("fs")
    fs.unlinkSync(heartbeatPath)
  } catch (error) {
    console.error(`Failed to delete heartbeat for agent ${agentName} in swarm ${swarmId}:`, error)
  }
}
