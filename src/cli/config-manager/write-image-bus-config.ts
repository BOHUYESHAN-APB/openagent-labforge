import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { parseJsonc } from "../../shared"
import { getPluginConfigPath } from "./config-context"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import type { ImageBusWizardConfig } from "../configure-image-bus-prompts"

const BIO_AGENT_NAMES = [
  "bio-autopilot",
  "bio-orchestrator",
  "bio-methodologist",
  "wet-lab-designer",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
] as const

const BIO_AGENT_NAME_SET = new Set<string>(BIO_AGENT_NAMES)

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

function applyGeneralSettings(args: {
  baseConfig: Record<string, unknown>
  contextGuardProfile: ImageBusWizardConfig["context_guard_profile"]
  bioAgentsVisible: ImageBusWizardConfig["bio_agents_visible"]
}): Record<string, unknown> {
  const { baseConfig, contextGuardProfile, bioAgentsVisible } = args
  const nextConfig = { ...baseConfig }

  if (contextGuardProfile) {
    const existingExperimental =
      typeof nextConfig.experimental === "object" && nextConfig.experimental !== null
        ? nextConfig.experimental as Record<string, unknown>
        : {}
    nextConfig.experimental = {
      ...existingExperimental,
      context_guard_profile: contextGuardProfile,
    }
  }

  if (bioAgentsVisible !== undefined) {
    const existingDisabledAgents = toStringArray(nextConfig.disabled_agents)
    const updatedDisabledAgents = bioAgentsVisible
      ? existingDisabledAgents.filter((agent) => !BIO_AGENT_NAME_SET.has(agent))
      : Array.from(new Set([...existingDisabledAgents, ...BIO_AGENT_NAMES]))

    if (updatedDisabledAgents.length > 0) {
      nextConfig.disabled_agents = updatedDisabledAgents
    } else {
      delete nextConfig.disabled_agents
    }
  }

  return nextConfig
}

export interface WriteImageBusConfigResult {
  success: boolean
  configPath: string
  error?: string
}

export function writeImageBusConfig(imageBusConfig: ImageBusWizardConfig): WriteImageBusConfigResult {
  const configPath = getPluginConfigPath()

  try {
    const {
      context_guard_profile: contextGuardProfile,
      bio_agents_visible: bioAgentsVisible,
      ...incomingImageBus
    } = imageBusConfig

    if (!existsSync(configPath)) {
      const initialConfig = applyGeneralSettings({
        baseConfig: { image_bus: incomingImageBus },
        contextGuardProfile,
        bioAgentsVisible,
      })
      writeFileSync(configPath, JSON.stringify(initialConfig, null, 2) + "\n", "utf-8")
      return { success: true, configPath }
    }

    const content = readFileSync(configPath, "utf-8")
    if (content.trim().length === 0) {
      const initialConfig = applyGeneralSettings({
        baseConfig: { image_bus: incomingImageBus },
        contextGuardProfile,
        bioAgentsVisible,
      })
      writeFileSync(configPath, JSON.stringify(initialConfig, null, 2) + "\n", "utf-8")
      return { success: true, configPath }
    }

    const existing = parseJsonc<Record<string, unknown>>(content)
    const mergedBase = {
      ...existing,
      image_bus: incomingImageBus,
    } satisfies Record<string, unknown>
    const merged = applyGeneralSettings({
      baseConfig: mergedBase,
      contextGuardProfile,
      bioAgentsVisible,
    })
    writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", "utf-8")
    return { success: true, configPath }
  } catch (err) {
    return {
      success: false,
      configPath,
      error: formatErrorWithSuggestion(err, "write image bus config"),
    }
  }
}