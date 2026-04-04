import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { applyEdits, modify } from "jsonc-parser"
import { createBuiltinAgents } from "../../agents"
import type { OhMyOpenCodeConfig } from "../../config"
import {
  discoverConfigSourceSkills,
  discoverOpencodeGlobalSkills,
  discoverOpencodeProjectSkills,
  discoverProjectClaudeSkills,
  discoverUserClaudeSkills,
} from "../../features/opencode-skill-loader"
import { loadProjectAgents, loadUserAgents } from "../../features/claude-code-agent-loader"
import { loadPluginConfig } from "../../plugin-config"
import { reorderAgentsByPriority } from "../../plugin-handlers/agent-priority-order"
import { buildPrometheusAgentConfig } from "../../plugin-handlers/prometheus-agent-config-builder"
import {
  getAgentConfigKey,
  getAgentDisplayName,
  resolveAgentDisplayLanguage,
  setAgentDisplayLanguage,
} from "../../shared/agent-display-names"
import type { ConfigMergeResult } from "../types"
import { getConfigDir } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { detectConfigFormat } from "./opencode-config-format"
import { parseOpenCodeConfigFileWithError, type OpenCodeConfig } from "./parse-opencode-config-file"

type StaticAgentConfig = Record<string, unknown>

function stringifyJson(content: OpenCodeConfig): string {
  return JSON.stringify(content, null, 2) + "\n"
}

function isVisibleAgent(config: unknown): config is StaticAgentConfig {
  if (typeof config !== "object" || config === null || Array.isArray(config)) return false

  const record = config as Record<string, unknown>
  if (record.hidden === true) return false

  const mode = record.mode
  return mode === "all" || mode === "primary"
}

function filterVisibleAgents(agents: Record<string, unknown>, disabledAgents: string[]): Record<string, StaticAgentConfig> {
  const disabled = new Set(disabledAgents.map((name) => name.toLowerCase()))

  return Object.fromEntries(
    Object.entries(agents).filter(([name, config]) => {
      if (disabled.has(name.toLowerCase())) return false
      return isVisibleAgent(config)
    }),
  ) as Record<string, StaticAgentConfig>
}

function applyLocalizedAgentNames(agents: Record<string, StaticAgentConfig>): Record<string, StaticAgentConfig> {
  return Object.fromEntries(
    Object.entries(agents).map(([key, value]) => [
      key,
      {
        ...value,
        name: getAgentDisplayName(key),
      },
    ]),
  ) as Record<string, StaticAgentConfig>
}

async function buildManagedStaticAgentConfig(existingConfig: OpenCodeConfig, directory: string): Promise<Record<string, StaticAgentConfig>> {
  const pluginConfig = await loadPluginConfig(directory, undefined)
  setAgentDisplayLanguage(resolveAgentDisplayLanguage(pluginConfig.i18n?.language))
  const includeClaudeSkillsForAwareness = pluginConfig.claude_code?.skills ?? true

  const [
    discoveredConfigSourceSkills,
    discoveredUserSkills,
    discoveredProjectSkills,
    discoveredOpencodeGlobalSkills,
    discoveredOpencodeProjectSkills,
  ] = await Promise.all([
    discoverConfigSourceSkills({ config: pluginConfig.skills, configDir: directory }),
    includeClaudeSkillsForAwareness ? discoverUserClaudeSkills() : Promise.resolve([]),
    includeClaudeSkillsForAwareness ? discoverProjectClaudeSkills(directory) : Promise.resolve([]),
    discoverOpencodeGlobalSkills(),
    discoverOpencodeProjectSkills(directory),
  ])

  const allDiscoveredSkills = [
    ...discoveredConfigSourceSkills,
    ...discoveredOpencodeProjectSkills,
    ...discoveredProjectSkills,
    ...discoveredOpencodeGlobalSkills,
    ...discoveredUserSkills,
  ]

  const disabledSkills = new Set<string>(pluginConfig.disabled_skills ?? [])
  const browserProvider = pluginConfig.browser_automation_engine?.provider ?? "playwright"
  const currentModel = typeof existingConfig.model === "string" ? existingConfig.model : undefined
  const disabledAgents = pluginConfig.disabled_agents ?? []
  const includeClaudeAgents = pluginConfig.claude_code?.agents ?? true
  const plannerEnabled = pluginConfig.sisyphus_agent?.planner_enabled ?? true

  const builtinAgents = await createBuiltinAgents(
    disabledAgents,
    pluginConfig.agents,
    directory,
    currentModel,
    pluginConfig.categories,
    pluginConfig.git_master,
    allDiscoveredSkills,
    undefined,
    browserProvider,
    undefined,
    disabledSkills,
    pluginConfig.experimental?.task_system ?? false,
    pluginConfig.experimental?.disable_omo_env ?? false,
  )

  const userAgents = includeClaudeAgents ? loadUserAgents() : {}
  const projectAgents = includeClaudeAgents ? loadProjectAgents(directory) : {}

  const existingAgentConfig =
    existingConfig.agent && typeof existingConfig.agent === "object" && !Array.isArray(existingConfig.agent)
      ? (existingConfig.agent as Record<string, unknown>)
      : undefined
  const configAgentPlan =
    existingAgentConfig?.plan && typeof existingAgentConfig.plan === "object" && !Array.isArray(existingAgentConfig.plan)
      ? (existingAgentConfig.plan as Record<string, unknown>)
      : undefined
  const pluginPrometheusOverride =
    pluginConfig.agents?.prometheus && typeof pluginConfig.agents.prometheus === "object"
      ? (pluginConfig.agents.prometheus as Record<string, unknown>)
      : undefined
  const prometheusAgent = plannerEnabled
    ? await buildPrometheusAgentConfig({
        configAgentPlan,
        pluginPrometheusOverride,
        userCategories: pluginConfig.categories,
        configuredSystemModel: currentModel,
      })
    : undefined

  const managedAgents = {
    ...filterVisibleAgents(builtinAgents, disabledAgents),
    ...(prometheusAgent ? { prometheus: prometheusAgent } : {}),
    ...filterVisibleAgents(userAgents, disabledAgents),
    ...filterVisibleAgents(projectAgents, disabledAgents),
  }

  const orderedAgents = reorderAgentsByPriority(managedAgents) as Record<string, StaticAgentConfig>
  return applyLocalizedAgentNames(orderedAgents)
}

function mergeManagedAgents(existingConfig: OpenCodeConfig, managedAgents: Record<string, StaticAgentConfig>): OpenCodeConfig {
  const currentAgent = existingConfig.agent
  const managedAgentKeys = new Set(Object.keys(managedAgents).map((name) => getAgentConfigKey(name)))

  const preservedCurrentAgent = currentAgent && typeof currentAgent === "object" && !Array.isArray(currentAgent)
    ? Object.fromEntries(
        Object.entries(currentAgent).filter(([name]) => !managedAgentKeys.has(getAgentConfigKey(name))),
      )
    : {}

  const mergedAgent = reorderAgentsByPriority({
    ...preservedCurrentAgent,
    ...managedAgents,
  })

  const existingDefaultAgent =
    typeof existingConfig.default_agent === "string"
      ? existingConfig.default_agent.trim()
      : ""
  const normalizedDefaultAgent = existingDefaultAgent
    ? getAgentConfigKey(existingDefaultAgent)
    : undefined
  const mergedAgentKeys = new Set(Object.keys(mergedAgent).map((name) => getAgentConfigKey(name)))
  const nextDefaultAgent =
    normalizedDefaultAgent && mergedAgentKeys.has(normalizedDefaultAgent)
      ? normalizedDefaultAgent
      : mergedAgentKeys.has("sisyphus")
        ? "sisyphus"
        : existingConfig.default_agent

  return {
    ...existingConfig,
    agent: mergedAgent,
    default_agent: nextDefaultAgent,
  }
}

export async function syncStaticAgentToOpenCodeConfig(directory = process.cwd()): Promise<ConfigMergeResult> {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const { format, path } = detectConfigFormat()

  try {
    const baseConfig = format === "none"
      ? {}
      : parseOpenCodeConfigFileWithError(path).config

    if (format !== "none" && !baseConfig) {
      const parseResult = parseOpenCodeConfigFileWithError(path)
      return {
        success: false,
        configPath: path,
        error: parseResult.error ?? "Failed to parse config file",
      }
    }

    const existingConfig = (baseConfig ?? {}) as OpenCodeConfig
    const managedAgents = await buildManagedStaticAgentConfig(existingConfig, directory)
    const mergedConfig = mergeManagedAgents(existingConfig, managedAgents)

    if (format === "none") {
      writeFileSync(path, stringifyJson(mergedConfig))
      return { success: true, configPath: path }
    }

    if (format === "jsonc" && existsSync(path)) {
      const content = readFileSync(path, "utf-8")
      const edits = modify(
        content,
        ["agent"],
        mergedConfig.agent,
        {
          formattingOptions: {
            insertSpaces: true,
            tabSize: 2,
            eol: "\n",
          },
        },
      )

      writeFileSync(path, applyEdits(content, edits))
    } else {
      writeFileSync(path, stringifyJson(mergedConfig))
    }

    return { success: true, configPath: path }
  } catch (err) {
    return {
      success: false,
      configPath: path,
      error: formatErrorWithSuggestion(err, "sync static agent config"),
    }
  }
}
