import type { PromptConfigCheckpoint } from "../../shared/compaction-agent-config-checkpoint"
import { isCompactionAgent } from "./session-id"

type PromptConfigInfo = {
  agent?: string
  model?: {
    providerID?: string
    modelID?: string
    variant?: string
  }
  providerID?: string
  modelID?: string
}

export function resolveValidatedModel(
  info: PromptConfigInfo | undefined,
): PromptConfigCheckpoint["model"] | undefined {
  if (isCompactionAgent(info?.agent)) {
    return undefined
  }

  const providerID = info?.model?.providerID ?? info?.providerID
  const modelID = info?.model?.modelID ?? info?.modelID
  const variant = info?.model?.variant

  if (!providerID || !modelID) {
    return undefined
  }

  return {
    providerID,
    modelID,
    ...(variant ? { variant } : {}),
  }
}

export function validateCheckpointModel(
  checkpointModel: PromptConfigCheckpoint["model"],
  currentModel: PromptConfigCheckpoint["model"],
): PromptConfigCheckpoint["model"] | undefined {
  if (!checkpointModel) {
    return undefined
  }

  if (!currentModel) {
    return checkpointModel
  }

  return checkpointModel.providerID === currentModel.providerID &&
    checkpointModel.modelID === currentModel.modelID
    ? checkpointModel
    : undefined
}
