import { createBuiltinAgents } from "../agents";
import { createSisyphusJuniorAgentWithOverrides } from "../agents/sisyphus-junior";
import type { OhMyOpenCodeConfig } from "../config";
import { log, migrateAgentConfig } from "../shared";
import { AGENT_NAME_MAP } from "../shared/migration";
import { getAgentDisplayName } from "../shared/agent-display-names";
import { registerAgentName } from "../features/claude-code-session-state";
import {
  discoverConfigSourceSkills,
  discoverGlobalAgentsSkills,
  discoverOpencodeGlobalSkills,
  discoverOpencodeProjectSkills,
  discoverProjectAgentsSkills,
  discoverProjectClaudeSkills,
  discoverUserClaudeSkills,
} from "../features/opencode-skill-loader";
import { loadProjectAgents, loadUserAgents } from "../features/claude-code-agent-loader";
import type { PluginComponents } from "./plugin-components-loader";
import { reorderAgentsByPriority } from "./agent-priority-order";
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper";
import {
  createProtectedAgentNameSet,
  filterProtectedAgentOverrides,
} from "./agent-override-protection";
import { buildPrometheusAgentConfig } from "./prometheus-agent-config-builder";
import { buildPlanDemoteConfig } from "./plan-model-inheritance";
import { filterAgentsByDisplayMode } from "../agents/agent-filter";

type AgentConfigRecord = Record<string, Record<string, unknown> | undefined> & {
  build?: Record<string, unknown>;
  plan?: Record<string, unknown>;
};

function getConfiguredDefaultAgent(config: Record<string, unknown>): string | undefined {
  const defaultAgent = config.default_agent;
  if (typeof defaultAgent !== "string") return undefined;

  const trimmedDefaultAgent = defaultAgent.trim();
  return trimmedDefaultAgent.length > 0 ? trimmedDefaultAgent : undefined;
}

export async function applyAgentConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  ctx: { directory: string; client?: any };
  pluginComponents: PluginComponents;
}): Promise<Record<string, unknown>> {
  const migratedDisabledAgents = (params.pluginConfig.disabled_agents ?? []).map(
    (agent) => {
      return AGENT_NAME_MAP[agent.toLowerCase()] ?? AGENT_NAME_MAP[agent] ?? agent;
    },
  ) as typeof params.pluginConfig.disabled_agents;

  const includeClaudeSkillsForAwareness = params.pluginConfig.claude_code?.skills ?? true;
  const [
    discoveredConfigSourceSkills,
    discoveredUserSkills,
    discoveredProjectSkills,
    discoveredProjectAgentsSkills,
    discoveredOpencodeGlobalSkills,
    discoveredOpencodeProjectSkills,
    discoveredGlobalAgentsSkills,
  ] = await Promise.all([
    discoverConfigSourceSkills({
      config: params.pluginConfig.skills,
      configDir: params.ctx.directory,
    }),
    includeClaudeSkillsForAwareness ? discoverUserClaudeSkills() : Promise.resolve([]),
    includeClaudeSkillsForAwareness
       ? discoverProjectClaudeSkills(params.ctx.directory)
       : Promise.resolve([]),
    includeClaudeSkillsForAwareness
      ? discoverProjectAgentsSkills(params.ctx.directory)
      : Promise.resolve([]),
    discoverOpencodeGlobalSkills(),
    discoverOpencodeProjectSkills(params.ctx.directory),
    includeClaudeSkillsForAwareness ? discoverGlobalAgentsSkills() : Promise.resolve([]),
  ]);

  const allDiscoveredSkills = [
    ...discoveredConfigSourceSkills,
    ...discoveredOpencodeProjectSkills,
    ...discoveredProjectSkills,
    ...discoveredProjectAgentsSkills,
    ...discoveredOpencodeGlobalSkills,
    ...discoveredUserSkills,
    ...discoveredGlobalAgentsSkills,
  ];

  const browserProvider =
    params.pluginConfig.browser_automation_engine?.provider ?? "playwright";
  const currentModel = params.config.model as string | undefined;
  
  // DEBUG: Log currentModel to diagnose sisyphus-junior initialization issue
  if (!currentModel) {
    console.error("[DEBUG] currentModel is undefined! params.config.model:", params.config.model);
    console.error("[DEBUG] Full params.config keys:", Object.keys(params.config));
  } else {
    console.log("[DEBUG] currentModel successfully loaded:", currentModel);
  }
  
  const disabledSkills = new Set<string>(params.pluginConfig.disabled_skills ?? []);
  const useTaskSystem = params.pluginConfig.experimental?.task_system ?? false;
  const disableOmoEnv = params.pluginConfig.experimental?.disable_omo_env ?? false;

  const includeClaudeAgents = params.pluginConfig.claude_code?.agents ?? true;
  const userAgents = includeClaudeAgents ? loadUserAgents() : {};
  const projectAgents = includeClaudeAgents ? loadProjectAgents(params.ctx.directory) : {};
  const rawPluginAgents = params.pluginComponents.agents;

  const pluginAgents = Object.fromEntries(
    Object.entries(rawPluginAgents).map(([key, value]) => [
      key,
      value ? migrateAgentConfig(value as Record<string, unknown>) : value,
    ]),
  );

  const configAgent = params.config.agent as AgentConfigRecord | undefined;

  const customAgentSummaries = [
    ...Object.entries(configAgent ?? {}),
    ...Object.entries(userAgents),
    ...Object.entries(projectAgents),
    ...Object.entries(pluginAgents).filter(([, config]) => config !== undefined),
  ]
    .filter(([, config]) => config != null)
    .map(([name, config]) => ({
      name,
      description: typeof (config as Record<string, unknown>)?.description === "string"
        ? ((config as Record<string, unknown>).description as string)
        : "",
    }));

  const builtinAgents = await createBuiltinAgents(
    migratedDisabledAgents,
    params.pluginConfig.agents,
    params.ctx.directory,
    currentModel,
    params.pluginConfig.categories,
    params.pluginConfig.git_master,
    allDiscoveredSkills,
    customAgentSummaries,
    browserProvider,
    currentModel,
    disabledSkills,
    useTaskSystem,
    disableOmoEnv,
    params.pluginConfig.agent_display,  // 传递 agent_display 配置
  );

  const disabledAgentNames = new Set(
    (migratedDisabledAgents ?? []).map(a => a.toLowerCase())
  );

  const filterDisabledAgents = (agents: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(agents).filter(([name]) => !disabledAgentNames.has(name.toLowerCase()))
    );

  const isSisyphusEnabled = params.pluginConfig.sisyphus_agent?.disabled !== true;
  const builderEnabled =
    params.pluginConfig.sisyphus_agent?.default_builder_enabled ?? false;

  // 读取新配置
  const agentDisplayConfig = params.pluginConfig.agent_display;
  const hideUpstreamPlan = agentDisplayConfig?.hide_upstream_commands?.plan ?? true;
  const hideUpstreamBuild = agentDisplayConfig?.hide_upstream_commands?.build ?? true;

  // 兼容旧配置
  const plannerEnabled = params.pluginConfig.sisyphus_agent?.planner_enabled ?? true;
  const replacePlan = params.pluginConfig.sisyphus_agent?.replace_plan ?? false;
  const hijackBuild = params.pluginConfig.sisyphus_agent?.hijack_build ?? false;

  // 新架构：prometheus 始终启用（作为核心规划 agent）
  // 即使用户设置了 planner_enabled: false，也会启用（因为我们使用了新的过滤机制）
  const shouldEnablePrometheus = true;

  // 合并逻辑：新配置优先
  const shouldHidePlan = hideUpstreamPlan || (plannerEnabled && replacePlan);
  const shouldHideBuild = hideUpstreamBuild || hijackBuild;
  const shouldDemotePlan = shouldHidePlan;
  const configuredDefaultAgent = getConfiguredDefaultAgent(params.config);

  if (isSisyphusEnabled && builtinAgents.sisyphus) {
    if (configuredDefaultAgent) {
      (params.config as { default_agent?: string }).default_agent =
        getAgentDisplayName(configuredDefaultAgent);
    } else {
      (params.config as { default_agent?: string }).default_agent =
        getAgentDisplayName("sisyphus");
    }

    const agentConfig: Record<string, unknown> = {
      sisyphus: builtinAgents.sisyphus,
    };

    // Only initialize sisyphus-junior if currentModel is available
    // This avoids initialization failure when params.config.model is undefined during plugin load
    if (currentModel) {
      agentConfig["sisyphus-junior"] = createSisyphusJuniorAgentWithOverrides(
        params.pluginConfig.agents?.["sisyphus-junior"],
        currentModel, // Inherit main model instead of hardcoding
        useTaskSystem,
      );
    }

    if (builderEnabled) {
      const { name: _buildName, ...buildConfigWithoutName } =
        configAgent?.build ?? {};
      const migratedBuildConfig = migrateAgentConfig(
        buildConfigWithoutName as Record<string, unknown>,
      );
      const override = params.pluginConfig.agents?.["OpenCode-Builder"];
      const base = {
        ...migratedBuildConfig,
        description: `${(configAgent?.build?.description as string) ?? "Build agent"} (OpenCode default)`,
      };
      agentConfig["OpenCode-Builder"] = override ? { ...base, ...override } : base;
    }

    if (shouldEnablePrometheus) {
      const prometheusOverride = params.pluginConfig.agents?.["prometheus"] as
        | (Record<string, unknown> & { prompt_append?: string })
        | undefined;

      agentConfig["prometheus"] = await buildPrometheusAgentConfig({
        configAgentPlan: configAgent?.plan,
        pluginPrometheusOverride: prometheusOverride,
        configuredSystemModel: currentModel,
        userCategories: params.pluginConfig.categories,
      });
    }

    const filteredConfigAgents = configAgent
      ? Object.fromEntries(
          Object.entries(configAgent)
            .filter(([key]) => {
              if (key === "build" && shouldHideBuild) return false;
              if (key === "plan" && shouldHidePlan) return false;
              if (key in builtinAgents) return false;
              return true;
            })
            .map(([key, value]) => [
              key,
              value ? migrateAgentConfig(value as Record<string, unknown>) : value,
            ]),
        )
      : {};

    const migratedBuild = configAgent?.build
      ? migrateAgentConfig(configAgent.build as Record<string, unknown>)
      : {};

    const planDemoteConfig = shouldDemotePlan
      ? buildPlanDemoteConfig(
          agentConfig["prometheus"] as Record<string, unknown> | undefined,
          params.pluginConfig.agents?.plan as Record<string, unknown> | undefined,
        )
      : undefined;

    const protectedBuiltinAgentNames = createProtectedAgentNameSet([
      ...Object.keys(agentConfig),
      ...Object.keys(builtinAgents),
    ]);
    const filteredUserAgents = filterProtectedAgentOverrides(
      userAgents,
      protectedBuiltinAgentNames,
    );
    const filteredProjectAgents = filterProtectedAgentOverrides(
      projectAgents,
      protectedBuiltinAgentNames,
    );
    const filteredPluginAgents = filterProtectedAgentOverrides(
      pluginAgents,
      protectedBuiltinAgentNames,
    );

    let allAgents = {
      ...agentConfig,
      ...Object.fromEntries(
        Object.entries(builtinAgents).filter(([key]) => key !== "sisyphus"),
      ),
      ...filterDisabledAgents(filteredUserAgents),
      ...filterDisabledAgents(filteredProjectAgents),
      ...filterDisabledAgents(filteredPluginAgents),
      ...filteredConfigAgents,
      ...(shouldHideBuild ? { build: { ...migratedBuild, mode: "subagent", hidden: true } } : {}),
      ...(shouldHidePlan ? { plan: planDemoteConfig } : {}),
    };

    // Apply agent display mode filtering
    if (agentDisplayConfig) {
      allAgents = filterAgentsByDisplayMode(allAgents as Record<string, any>, agentDisplayConfig);
    }

    params.config.agent = allAgents;
  } else {
    const protectedBuiltinAgentNames = createProtectedAgentNameSet(
      Object.keys(builtinAgents),
    );
    const filteredUserAgents = filterProtectedAgentOverrides(
      userAgents,
      protectedBuiltinAgentNames,
    );
    const filteredProjectAgents = filterProtectedAgentOverrides(
      projectAgents,
      protectedBuiltinAgentNames,
    );
    const filteredPluginAgents = filterProtectedAgentOverrides(
      pluginAgents,
      protectedBuiltinAgentNames,
    );

    let allAgents = {
      ...builtinAgents,
      ...filterDisabledAgents(filteredUserAgents),
      ...filterDisabledAgents(filteredProjectAgents),
      ...filterDisabledAgents(filteredPluginAgents),
      ...configAgent,
    };

    // Apply agent display mode filtering
    if (agentDisplayConfig) {
      allAgents = filterAgentsByDisplayMode(allAgents as Record<string, any>, agentDisplayConfig);
    }

    params.config.agent = allAgents;
  }

  if (params.config.agent) {
    params.config.agent = remapAgentKeysToDisplayNames(
      params.config.agent as Record<string, unknown>,
    );
    params.config.agent = reorderAgentsByPriority(
      params.config.agent as Record<string, unknown>,
    );
  }

  const agentResult = params.config.agent as Record<string, unknown>;
  for (const name of Object.keys(agentResult)) {
    registerAgentName(name);
  }
  log("[config-handler] agents loaded", { agentKeys: Object.keys(agentResult) });
  return agentResult;
}
