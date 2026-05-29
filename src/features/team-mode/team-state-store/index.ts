// Team state store
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { RuntimeState } from "../types"
import { RuntimeStateSchema } from "../types"
import { getTeamStatePath } from "../team-registry/paths"

export async function loadRuntimeState(teamName: string): Promise<RuntimeState | null> {
  try {
    const statePath = getTeamStatePath(teamName)
    const content = await readFile(statePath, "utf-8")
    const data = JSON.parse(content)
    return RuntimeStateSchema.parse(data)
  } catch {
    return null
  }
}

export async function saveRuntimeState(teamName: string, state: RuntimeState): Promise<void> {
  const statePath = getTeamStatePath(teamName)
  const dir = dirname(statePath)
  await mkdir(dir, { recursive: true })
  await writeFile(statePath, JSON.stringify(state, null, 2))
}

export async function deleteRuntimeState(teamName: string): Promise<void> {
  try {
    const { unlink } = await import("node:fs/promises")
    const statePath = getTeamStatePath(teamName)
    await unlink(statePath)
  } catch {
    // Ignore if file doesn't exist
  }
}
