import { join } from "path"
import { existsSync, mkdirSync, readdirSync, rmSync } from "fs"
import { writeJSONAtomically } from "../../shared/write-file-atomically"
import { readFileSync } from "fs"
import { acquireLock } from "../claude-tasks/storage"

export interface SwarmState {
  swarm_id: string
  coordinator_session_id: string
  status: "initializing" | "running" | "completed" | "failed"
  members: SwarmMember[]
  created_at: string
  updated_at: string
}

export interface SwarmMember {
  agent_name: string
  session_id: string
  role: "coordinator" | "worker" | "specialist"
  status: "active" | "idle" | "completed" | "failed"
}

function getSwarmDir(swarmId: string): string {
  return join(process.cwd(), ".opencode", "openagent-labforge", "swarm", swarmId)
}

function getSwarmStatePath(swarmId: string): string {
  return join(getSwarmDir(swarmId), "state.json")
}

function ensureSwarmDir(swarmId: string): void {
  const dir = getSwarmDir(swarmId)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

export async function createSwarmState(state: SwarmState): Promise<void> {
  ensureSwarmDir(state.swarm_id)

  const swarmDir = getSwarmDir(state.swarm_id)
  const lock = acquireLock(swarmDir)

  if (!lock.acquired) {
    throw new Error(`Failed to acquire lock for swarm ${state.swarm_id}`)
  }

  try {
    const statePath = getSwarmStatePath(state.swarm_id)
    writeJSONAtomically(statePath, state)

    // Create subdirectories
    mkdirSync(join(swarmDir, "messages"), { recursive: true })
    mkdirSync(join(swarmDir, "results"), { recursive: true })
    mkdirSync(join(swarmDir, "heartbeats"), { recursive: true })
  } finally {
    lock.release()
  }
}

export async function readSwarmState(swarmId: string): Promise<SwarmState | null> {
  const statePath = getSwarmStatePath(swarmId)

  if (!existsSync(statePath)) {
    return null
  }

  try {
    const content = readFileSync(statePath, "utf-8")
    return JSON.parse(content) as SwarmState
  } catch (error) {
    console.error(`Failed to read swarm state for ${swarmId}:`, error)
    return null
  }
}

export async function updateSwarmState(
  swarmId: string,
  updates: Partial<SwarmState>
): Promise<void> {
  const swarmDir = getSwarmDir(swarmId)
  const lock = acquireLock(swarmDir)

  if (!lock.acquired) {
    throw new Error(`Failed to acquire lock for swarm ${swarmId}`)
  }

  try {
    const currentState = await readSwarmState(swarmId)

    if (!currentState) {
      throw new Error(`Swarm ${swarmId} not found`)
    }

    const newState: SwarmState = {
      ...currentState,
      ...updates,
      swarm_id: swarmId, // Prevent ID change
      updated_at: new Date().toISOString(),
    }

    const statePath = getSwarmStatePath(swarmId)
    writeJSONAtomically(statePath, newState)
  } finally {
    lock.release()
  }
}

export async function deleteSwarmState(swarmId: string): Promise<void> {
  const swarmDir = getSwarmDir(swarmId)

  if (!existsSync(swarmDir)) {
    return
  }

  const lock = acquireLock(swarmDir)

  if (!lock.acquired) {
    throw new Error(`Failed to acquire lock for swarm ${swarmId}`)
  }

  try {
    rmSync(swarmDir, { recursive: true, force: true })
  } finally {
    lock.release()
  }
}

export async function listSwarms(): Promise<string[]> {
  const swarmsDir = join(process.cwd(), ".opencode", "openagent-labforge", "swarm")

  if (!existsSync(swarmsDir)) {
    return []
  }

  try {
    return readdirSync(swarmsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
  } catch (error) {
    console.error("Failed to list swarms:", error)
    return []
  }
}
