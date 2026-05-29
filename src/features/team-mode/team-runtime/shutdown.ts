// Team runtime shutdown
import type { RuntimeState } from "../types"
import { loadRuntimeState, saveRuntimeState, deleteRuntimeState } from "../team-state-store/index"

export async function deleteTeam(teamName: string): Promise<void> {
  await deleteRuntimeState(teamName)
}

export async function requestShutdown(
  teamName: string,
  memberId: string,
  requesterName: string
): Promise<RuntimeState | null> {
  const state = await loadRuntimeState(teamName)
  if (!state) return null
  
  state.shutdownRequests.push({
    memberId,
    requesterName,
    requestedAt: Date.now(),
  })
  
  state.status = "shutdown_requested"
  await saveRuntimeState(teamName, state)
  return state
}

export async function approveShutdown(
  teamName: string,
  memberId: string
): Promise<RuntimeState | null> {
  const state = await loadRuntimeState(teamName)
  if (!state) return null
  
  const request = state.shutdownRequests.find(r => r.memberId === memberId)
  if (request) {
    request.approvedAt = Date.now()
  }
  
  await saveRuntimeState(teamName, state)
  return state
}

export async function rejectShutdown(
  teamName: string,
  memberId: string,
  reason: string
): Promise<RuntimeState | null> {
  const state = await loadRuntimeState(teamName)
  if (!state) return null
  
  const request = state.shutdownRequests.find(r => r.memberId === memberId)
  if (request) {
    request.rejectedReason = reason
    request.rejectedAt = Date.now()
  }
  
  await saveRuntimeState(teamName, state)
  return state
}
