import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrides, AgentFactory, AgentPromptMetadata } from "./types"
import type { CategoriesConfig, GitMasterConfig } from "../config/schema"
import type { AgentDisplayConfig } from "../config/schema/agent-display"
import type { LoadedSkill } from "../features/opencode-skill-loader/types"
import type { BrowserAutomationProvider } from "../config/schema"
import { createSisyphusAgent } from "./sisyphus"
import { createWaseAgent, WASE_PROMPT_METADATA } from "./wase"
import { createOracleAgent, ORACLE_PROMPT_METADATA } from "./oracle"
import { createLibrarianAgent, LIBRARIAN_PROMPT_METADATA } from "./librarian"
import { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./explore"
import { createGitHubScoutAgent, GITHUB_SCOUT_PROMPT_METADATA } from "./github-scout"
import { createTechScoutAgent, TECH_SCOUT_PROMPT_METADATA } from "./tech-scout"
import { createAcceptanceReviewerAgent, ACCEPTANCE_REVIEWER_PROMPT_METADATA } from "./acceptance-reviewer"
import { createArticleWriterAgent, ARTICLE_WRITER_PROMPT_METADATA } from "./article-writer"
import { createScientificWriterAgent, SCIENTIFIC_WRITER_PROMPT_METADATA } from "./scientific-writer"
import { createBioAutopilotAgent, BIO_AUTOPILOT_PROMPT_METADATA } from "./bio-autopilot"
import { createBioOrchestratorAgent, BIO_ORCHESTRATOR_PROMPT_METADATA } from "./bio-orchestrator"
import { createOrchestratorAgent, ORCHESTRATOR_PROMPT_METADATA } from "./orchestrator"
import { createEngineeringOrchestratorAgent, ENGINEERING_ORCHESTRATOR_PROMPT_METADATA } from "./engineering-orchestrator"
import { createBioPlannerAgent, BIO_PLANNER_PROMPT_METADATA } from "./bio-planner"
import { filterAgentsByDisplayMode } from "./agent-filter"
import { createMultimodalLookerAgent, MULTIMODAL_LOOKER_PROMPT_METADATA } from "./multimodal-looker"
import {
  createBioMethodologistAgent,
  BIO_METHODOLOGIST_PROMPT_METADATA,
} from "./bio-methodologist"
import {
  createWetLabDesignerAgent,
  WET_LAB_DESIGNER_PROMPT_METADATA,
} from "./wet-lab-designer"
import {
  createBioPipelineOperatorAgent,
  BIO_PIPELINE_OPERATOR_PROMPT_METADATA,
} from "./bio-pipeline-operator"
import {
  createPaperEvidenceSynthesizerAgent,
  PAPER_EVIDENCE_SYNTHESIZER_PROMPT_METADATA,
} from "./paper-evidence-synthesizer"
import { createMetisAgent, metisPromptMetadata } from "./metis"
import { createAtlasAgent, atlasPromptMetadata } from "./atlas"
import { createMomusAgent, momusPromptMetadata } from "./momus"
import { createHephaestusAgent } from "./hephaestus"
import { createSwarmCoordinatorAgent, SWARM_COORDINATOR_PROMPT_METADATA } from "./swarm-coordinator"
import { createSwarmWorkerAgent, SWARM_WORKER_PROMPT_METADATA } from "./swarm-worker"
import { createSwarmSpecialistAgent, SWARM_SPECIALIST_PROMPT_METADATA } from "./swarm-specialist"
import { createPrometheusAgent, PROMETHEUS_AGENT_PROMPT_METADATA } from "./prometheus-agent"
import { createExecutorAgent, EXECUTOR_PROMPT_METADATA } from "./executor"
import type { AvailableCategory } from "./dynamic-agent-prompt-builder"
import {
  fetchAvailableModels,
  readConnectedProvidersCache,
  readProviderModelsCache,
} from "../shared"
import { CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants"
import { mergeCategories } from "../shared/merge-categories"
import { buildAvailableSkills } from "./builtin-agents/available-skills"
import { collectPendingBuiltinAgents } from "./builtin-agents/general-agents"
import { maybeCreateSisyphusConfig, maybeCreateWaseConfig } from "./builtin-agents/sisyphus-agent"
import { maybeCreateHephaestusConfig } from "./builtin-agents/hephaestus-agent"
import { maybeCreateAtlasConfig } from "./builtin-agents/atlas-agent"
import { buildCustomAgentMetadata, parseRegisteredAgentSummaries } from "./custom-agent-summaries"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  sisyphus: createSisyphusAgent,
  wase: createWaseAgent,
  hephaestus: createHephaestusAgent,
  oracle: createOracleAgent,
  librarian: createLibrarianAgent,
  explore: createExploreAgent,
  "github-scout": createGitHubScoutAgent,
  "tech-scout": createTechScoutAgent,
  "acceptance-reviewer": createAcceptanceReviewerAgent,
  "article-writer": createArticleWriterAgent,
  "scientific-writer": createScientificWriterAgent,
  "bio-autopilot": createBioAutopilotAgent,
  orchestrator: createOrchestratorAgent,
  "bio-orchestrator": createBioOrchestratorAgent,
  "engineering-orchestrator": createEngineeringOrchestratorAgent,
  "bio-planner": createBioPlannerAgent,
  "multimodal-looker": createMultimodalLookerAgent,
  "bio-methodologist": createBioMethodologistAgent,
  "wet-lab-designer": createWetLabDesignerAgent,
  "bio-pipeline-operator": createBioPipelineOperatorAgent,
  "paper-evidence-synthesizer": createPaperEvidenceSynthesizerAgent,
  metis: createMetisAgent,
  momus: createMomusAgent,
  // Note: Atlas is handled specially in createBuiltinAgents()
  // because it needs OrchestratorContext, not just a model string
  atlas: createAtlasAgent as AgentFactory,
  "swarm-coordinator": createSwarmCoordinatorAgent,
  "swarm-worker": createSwarmWorkerAgent,
  "swarm-specialist": createSwarmSpecialistAgent,
  prometheus: createPrometheusAgent,
  executor: createExecutorAgent,
}

/**
 * Metadata for each agent, used to build Sisyphus's dynamic prompt sections
 * (Delegation Table, Tool Selection, Key Triggers, etc.)
 */
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  oracle: ORACLE_PROMPT_METADATA,
  librarian: LIBRARIAN_PROMPT_METADATA,
  explore: EXPLORE_PROMPT_METADATA,
  "github-scout": GITHUB_SCOUT_PROMPT_METADATA,
  "tech-scout": TECH_SCOUT_PROMPT_METADATA,
  "acceptance-reviewer": ACCEPTANCE_REVIEWER_PROMPT_METADATA,
  "article-writer": ARTICLE_WRITER_PROMPT_METADATA,
  "scientific-writer": SCIENTIFIC_WRITER_PROMPT_METADATA,
  "bio-autopilot": BIO_AUTOPILOT_PROMPT_METADATA,
  orchestrator: ORCHESTRATOR_PROMPT_METADATA,
  "bio-orchestrator": BIO_ORCHESTRATOR_PROMPT_METADATA,
  "engineering-orchestrator": ENGINEERING_ORCHESTRATOR_PROMPT_METADATA,
  "bio-planner": BIO_PLANNER_PROMPT_METADATA,
  "multimodal-looker": MULTIMODAL_LOOKER_PROMPT_METADATA,
  "bio-methodologist": BIO_METHODOLOGIST_PROMPT_METADATA,
  "wet-lab-designer": WET_LAB_DESIGNER_PROMPT_METADATA,
  "bio-pipeline-operator": BIO_PIPELINE_OPERATOR_PROMPT_METADATA,
  "paper-evidence-synthesizer": PAPER_EVIDENCE_SYNTHESIZER_PROMPT_METADATA,
  metis: metisPromptMetadata,
  momus: momusPromptMetadata,
  atlas: atlasPromptMetadata,
  wase: WASE_PROMPT_METADATA,
  "swarm-coordinator": SWARM_COORDINATOR_PROMPT_METADATA,
  "swarm-worker": SWARM_WORKER_PROMPT_METADATA,
  "swarm-specialist": SWARM_SPECIALIST_PROMPT_METADATA,
  prometheus: PROMETHEUS_AGENT_PROMPT_METADATA,
  executor: EXECUTOR_PROMPT_METADATA,
}

export async function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig,
  discoveredSkills: LoadedSkill[] = [],
  customAgentSummaries?: unknown,
  browserProvider?: BrowserAutomationProvider,
  uiSelectedModel?: string,
  disabledSkills?: Set<string>,
  useTaskSystem = false,
  disableOmoEnv = false,
  agentDisplayConfig?: AgentDisplayConfig,  // 新增参数
): Promise<Record<string, AgentConfig>> {

  const connectedProviders = readConnectedProvidersCache()
  const providerModelsConnected = connectedProviders
    ? (readProviderModelsCache()?.connected ?? [])
    : []
  const mergedConnectedProviders = Array.from(
    new Set([...(connectedProviders ?? []), ...providerModelsConnected])
  )
  // IMPORTANT: Do NOT call OpenCode client APIs during plugin initialization.
  // This function is called from config handler, and calling client API causes deadlock.
  // See: https://github.com/code-yeongyu/oh-my-opencode/issues/1301
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders: mergedConnectedProviders.length > 0 ? mergedConnectedProviders : undefined,
  })
  const isFirstRunNoCache =
    availableModels.size === 0 && mergedConnectedProviders.length === 0

  const result: Record<string, AgentConfig> = {}

  const mergedCategories = mergeCategories(categories)

  const availableCategories: AvailableCategory[] = Object.entries(mergedCategories).map(([name]) => ({
    name,
    description: categories?.[name]?.description ?? CATEGORY_DESCRIPTIONS[name] ?? "General tasks",
  }))

  const availableSkills = buildAvailableSkills(discoveredSkills, browserProvider, disabledSkills)

  // Collect general agents first (for availableAgents), but don't add to result yet
  const { pendingAgentConfigs, availableAgents } = collectPendingBuiltinAgents({
    agentSources,
    agentMetadata,
    disabledAgents,
    agentOverrides,
    directory,
    systemDefaultModel,
    mergedCategories,
    gitMasterConfig,
    browserProvider,
    uiSelectedModel,
    availableModels,
    disabledSkills,
    disableOmoEnv,
  })

  const registeredAgents = parseRegisteredAgentSummaries(customAgentSummaries)
  const builtinAgentNames = new Set(Object.keys(agentSources).map((name) => name.toLowerCase()))
  const disabledAgentNames = new Set(disabledAgents.map((name) => name.toLowerCase()))

  for (const agent of registeredAgents) {
    const lowerName = agent.name.toLowerCase()
    if (builtinAgentNames.has(lowerName)) continue
    if (disabledAgentNames.has(lowerName)) continue
    if (availableAgents.some((availableAgent) => availableAgent.name.toLowerCase() === lowerName)) continue

    availableAgents.push({
      name: agent.name,
      description: agent.description,
      metadata: buildCustomAgentMetadata(agent.name, agent.description),
    })
  }

  const sisyphusConfig = maybeCreateSisyphusConfig({
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
    userCategories: categories,
    useTaskSystem,
    disableOmoEnv,
  })
  if (sisyphusConfig) {
    result["sisyphus"] = sisyphusConfig
  }

  const waseConfig = maybeCreateWaseConfig({
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
    userCategories: categories,
    useTaskSystem,
    disableOmoEnv,
  })
  if (waseConfig) {
    result["wase"] = waseConfig
  }

  const hephaestusConfig = maybeCreateHephaestusConfig({
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
    disableOmoEnv,
  })
  if (hephaestusConfig) {
    result["hephaestus"] = hephaestusConfig
  }

  // Add pending agents after sisyphus and hephaestus to maintain order
  for (const [name, config] of pendingAgentConfigs) {
    result[name] = config
  }

  const atlasConfig = maybeCreateAtlasConfig({
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories: categories,
  })
  if (atlasConfig) {
    result["atlas"] = atlasConfig
  }

  // 应用 agent 显示模式过滤（使用默认配置）
  const defaultConfig: AgentDisplayConfig = {
    agent_display_mode: "minimal",
    enable_domains: {
      bioinformatics: true,
      engineering: true,
    },
    hide_upstream_commands: {
      plan: true,
      build: true,
    },
    disabled_agents: [],
    enabled_agents: [],
  }

  return filterAgentsByDisplayMode(result, agentDisplayConfig ?? defaultConfig)
}
