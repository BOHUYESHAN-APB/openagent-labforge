// Team tools query
import type { RuntimeState } from "../types"
import { aggregateStatus } from "../team-runtime/status"
import { listTeams } from "../team-registry/loader"

export async function teamStatus(teamName: string): Promise<RuntimeState | null> {
  return aggregateStatus(teamName)
}

export async function teamList(): Promise<string[]> {
  return listTeams()
}
