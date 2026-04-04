import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isAnyFallbackModelAvailable } from "../../shared"
import { applyEnvironmentContext } from "./environment-context"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"
import { createSisyphusAgent } from "../sisyphus"
import { createWaseAgent } from "../wase"

export function maybeCreateSisyphusConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem: boolean
  disableOmoEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv = false,
  } = input

  const sisyphusOverride = agentOverrides["sisyphus"]
  const sisyphusRequirement = AGENT_MODEL_REQUIREMENTS["sisyphus"]
  const hasSisyphusExplicitConfig = sisyphusOverride !== undefined
  const meetsSisyphusAnyModelRequirement =
    !sisyphusRequirement?.requiresAnyModel ||
    hasSisyphusExplicitConfig ||
    isFirstRunNoCache ||
    isAnyFallbackModelAvailable(sisyphusRequirement.fallbackChain, availableModels)

  if (disabledAgents.includes("sisyphus") || !meetsSisyphusAnyModelRequirement) return undefined

  let sisyphusResolution = applyModelResolution({
    uiSelectedModel: sisyphusOverride?.model ? undefined : uiSelectedModel,
    userModel: sisyphusOverride?.model,
    requirement: sisyphusRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !sisyphusOverride?.model && !uiSelectedModel) {
    sisyphusResolution = getFirstFallbackModel(sisyphusRequirement)
  }

  if (!sisyphusResolution) return undefined
  const { model: sisyphusModel, variant: sisyphusResolvedVariant } = sisyphusResolution

  let sisyphusConfig = createSisyphusAgent(
    sisyphusModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  if (sisyphusResolvedVariant) {
    sisyphusConfig = { ...sisyphusConfig, variant: sisyphusResolvedVariant }
  }

  sisyphusConfig = applyOverrides(sisyphusConfig, sisyphusOverride, mergedCategories, directory)
  sisyphusConfig = applyEnvironmentContext(sisyphusConfig, directory, {
    disableOmoEnv,
  })

  return sisyphusConfig
}

export function maybeCreateWaseConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem: boolean
  disableOmoEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv = false,
  } = input

  const waseOverride = agentOverrides["wase"]
  const waseRequirement = AGENT_MODEL_REQUIREMENTS["wase"]
  const hasWaseExplicitConfig = waseOverride !== undefined
  const meetsWaseAnyModelRequirement =
    !waseRequirement?.requiresAnyModel ||
    hasWaseExplicitConfig ||
    isFirstRunNoCache ||
    isAnyFallbackModelAvailable(waseRequirement.fallbackChain, availableModels)

  if (disabledAgents.includes("wase") || !meetsWaseAnyModelRequirement) return undefined

  let waseResolution = applyModelResolution({
    uiSelectedModel: waseOverride?.model ? undefined : uiSelectedModel,
    userModel: waseOverride?.model,
    requirement: waseRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !waseOverride?.model && !uiSelectedModel) {
    waseResolution = getFirstFallbackModel(waseRequirement)
  }

  if (!waseResolution) return undefined
  const { model: waseModel, variant: waseResolvedVariant } = waseResolution

  let waseConfig = createWaseAgent(
    waseModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  if (waseResolvedVariant) {
    waseConfig = { ...waseConfig, variant: waseResolvedVariant }
  }

  waseConfig = applyOverrides(waseConfig, waseOverride, mergedCategories, directory)
  waseConfig = applyEnvironmentContext(waseConfig, directory, {
    disableOmoEnv,
  })

  return waseConfig
}
