import type { PromptConfigCheckpoint } from "../../shared/compaction-agent-config-checkpoint"

export type RecoveryPromptConfig = PromptConfigCheckpoint & {
  agent: string
}

function isCompactionAgent(agent: string | undefined): boolean {
  return agent?.trim().toLowerCase() === "compaction"
}

function matchesExpectedModel(
  actualModel: PromptConfigCheckpoint["model"],
  expectedModel: PromptConfigCheckpoint["model"],
): boolean {
  if (!expectedModel) {
    return true
  }

  return (
    actualModel?.providerID === expectedModel.providerID &&
    actualModel.modelID === expectedModel.modelID
  )
}

function matchesExpectedTools(
  actualTools: PromptConfigCheckpoint["tools"],
  expectedTools: PromptConfigCheckpoint["tools"],
): boolean {
  if (!expectedTools) {
    return true
  }

  if (!actualTools) {
    return false
  }

  const expectedEntries = Object.entries(expectedTools)
  if (expectedEntries.length !== Object.keys(actualTools).length) {
    return false
  }

  return expectedEntries.every(
    ([toolName, isAllowed]) => actualTools[toolName] === isAllowed,
  )
}

export function createExpectedRecoveryPromptConfig(
  checkpoint: Pick<RecoveryPromptConfig, "agent"> & PromptConfigCheckpoint,
  currentPromptConfig: PromptConfigCheckpoint,
): RecoveryPromptConfig {
  const model = checkpoint.model ?? currentPromptConfig.model
  const tools = checkpoint.tools ?? currentPromptConfig.tools

  return {
    agent: checkpoint.agent,
    ...(model ? { model } : {}),
    ...(tools ? { tools } : {}),
  }
}

export function isPromptConfigRecovered(
  actualPromptConfig: PromptConfigCheckpoint,
  expectedPromptConfig: RecoveryPromptConfig,
): boolean {
  const actualAgent = actualPromptConfig.agent
  const agentMatches =
    typeof actualAgent === "string" &&
    !isCompactionAgent(actualAgent) &&
    actualAgent.toLowerCase() === expectedPromptConfig.agent.toLowerCase()

  return (
    agentMatches &&
    matchesExpectedModel(
      actualPromptConfig.model,
      expectedPromptConfig.model,
    ) &&
    matchesExpectedTools(
      actualPromptConfig.tools,
      expectedPromptConfig.tools,
    )
  )
}
