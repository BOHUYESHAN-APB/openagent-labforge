// Team runtime status
import type { RuntimeState } from "../types"
import { loadRuntimeState } from "../team-state-store/index"

export async function aggregateStatus(teamName: string): Promise<RuntimeState | null> {
  return loadRuntimeState(teamName)
}
