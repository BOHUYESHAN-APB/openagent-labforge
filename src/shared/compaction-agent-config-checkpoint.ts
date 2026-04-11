export type PromptConfigCheckpoint = {
  agent?: string
  model?: { providerID: string; modelID: string; variant?: string }
  tools?: Record<string, boolean>
}

const compactionAgentConfigCheckpointMap = new Map<string, PromptConfigCheckpoint>()

export function setCompactionAgentConfigCheckpoint(
  sessionID: string,
  checkpoint: PromptConfigCheckpoint,
): void {
  compactionAgentConfigCheckpointMap.set(sessionID, checkpoint)
}

export function getCompactionAgentConfigCheckpoint(
  sessionID: string,
): PromptConfigCheckpoint | undefined {
  return compactionAgentConfigCheckpointMap.get(sessionID)
}

export function clearCompactionAgentConfigCheckpoint(sessionID: string): void {
  compactionAgentConfigCheckpointMap.delete(sessionID)
}

export function resetCompactionAgentConfigCheckpointForTesting(): void {
  compactionAgentConfigCheckpointMap.clear()
}
