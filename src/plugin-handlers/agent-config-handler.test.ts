/// <reference types="bun-types" />

import type { AgentConfig } from "@opencode-ai/sdk"
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test"
import * as agents from "../agents"
import * as shared from "../shared"
import * as sisyphusJunior from "../agents/sisyphus-junior"
import type { OhMyOpenCodeConfig } from "../config"
import * as agentLoader from "../features/claude-code-agent-loader"
import * as skillLoader from "../features/opencode-skill-loader"
import { getAgentDisplayName } from "../shared/agent-display-names"
import { applyAgentConfig, enforceStrictUserModelPriorityOnAgents } from "./agent-config-handler"
import type { PluginComponents } from "./plugin-components-loader"

describe("enforceStrictUserModelPriorityOnAgents", () => {
  test("removes model and fallback_models from all agent definitions", () => {
    //#given
    const agentsConfig = {
      build: {
        description: "Build agent",
      },
      sisyphus: {
        model: "gmn/gpt-5.3-codex",
        fallback_models: ["openai/gpt-5.4"],
        temperature: 0.1,
      },
      oracle: {
        model: "openai/gpt-5.4",
        prompt: "Analyze deeply",
      },
    }

    //#when
    const result = enforceStrictUserModelPriorityOnAgents(agentsConfig)

    //#then
    expect((result.sisyphus as Record<string, unknown>).model).toBeUndefined()
    expect((result.sisyphus as Record<string, unknown>).fallback_models).toBeUndefined()
    expect((result.sisyphus as Record<string, unknown>).temperature).toBe(0.1)
    expect((result.oracle as Record<string, unknown>).model).toBeUndefined()
    expect((result.oracle as Record<string, unknown>).prompt).toBe("Analyze deeply")
    expect((result.build as Record<string, unknown>).description).toBe("Build agent")
  })
})

const BUILTIN_SISYPHUS_DISPLAY_NAME = getAgentDisplayName("sisyphus")
const BUILTIN_SISYPHUS_JUNIOR_DISPLAY_NAME = getAgentDisplayName("sisyphus-junior")
const BUILTIN_MULTIMODAL_LOOKER_DISPLAY_NAME = getAgentDisplayName("multimodal-looker")

function createPluginComponents(): PluginComponents {
  return {
    commands: {},
    skills: {},
    agents: {},
    mcpServers: {},
    hooksConfigs: [],
    plugins: [],
    errors: [],
  }
}

function createBaseConfig(): Record<string, unknown> {
  return {
    model: "anthropic/claude-opus-4-6",
    agent: {},
  }
}

function createPluginConfig(): OhMyOpenCodeConfig {
  return {
    sisyphus_agent: {
      planner_enabled: false,
    },
  }
}

describe("applyAgentConfig builtin override protection", () => {
  let createBuiltinAgentsSpy: ReturnType<typeof spyOn>
  let createSisyphusJuniorAgentSpy: ReturnType<typeof spyOn>
  let discoverConfigSourceSkillsSpy: ReturnType<typeof spyOn>
  let discoverUserClaudeSkillsSpy: ReturnType<typeof spyOn>
  let discoverProjectClaudeSkillsSpy: ReturnType<typeof spyOn>
  let discoverOpencodeGlobalSkillsSpy: ReturnType<typeof spyOn>
  let discoverOpencodeProjectSkillsSpy: ReturnType<typeof spyOn>
  let loadUserAgentsSpy: ReturnType<typeof spyOn>
  let loadProjectAgentsSpy: ReturnType<typeof spyOn>
  let migrateAgentConfigSpy: ReturnType<typeof spyOn>
  let logSpy: ReturnType<typeof spyOn>

  const builtinSisyphusConfig: AgentConfig = {
    name: "Builtin Sisyphus",
    prompt: "builtin prompt",
    mode: "primary",
  }

  const builtinOracleConfig: AgentConfig = {
    name: "oracle",
    prompt: "oracle prompt",
    mode: "subagent",
  }

  const builtinMultimodalLookerConfig: AgentConfig = {
    name: "multimodal-looker",
    prompt: "multimodal prompt",
    mode: "subagent",
  }

  const sisyphusJuniorConfig: AgentConfig = {
    name: "Sisyphus-Junior",
    prompt: "junior prompt",
    mode: "all",
  }

  beforeEach(() => {
    createBuiltinAgentsSpy = spyOn(agents, "createBuiltinAgents").mockResolvedValue({
      sisyphus: builtinSisyphusConfig,
      oracle: builtinOracleConfig,
      "multimodal-looker": builtinMultimodalLookerConfig,
    })

    createSisyphusJuniorAgentSpy = spyOn(
      sisyphusJunior,
      "createSisyphusJuniorAgentWithOverrides",
    ).mockReturnValue(sisyphusJuniorConfig)

    discoverConfigSourceSkillsSpy = spyOn(
      skillLoader,
      "discoverConfigSourceSkills",
    ).mockResolvedValue([])
    discoverUserClaudeSkillsSpy = spyOn(
      skillLoader,
      "discoverUserClaudeSkills",
    ).mockResolvedValue([])
    discoverProjectClaudeSkillsSpy = spyOn(
      skillLoader,
      "discoverProjectClaudeSkills",
    ).mockResolvedValue([])
    discoverOpencodeGlobalSkillsSpy = spyOn(
      skillLoader,
      "discoverOpencodeGlobalSkills",
    ).mockResolvedValue([])
    discoverOpencodeProjectSkillsSpy = spyOn(
      skillLoader,
      "discoverOpencodeProjectSkills",
    ).mockResolvedValue([])

    loadUserAgentsSpy = spyOn(agentLoader, "loadUserAgents").mockReturnValue({})
    loadProjectAgentsSpy = spyOn(agentLoader, "loadProjectAgents").mockReturnValue({})

    migrateAgentConfigSpy = spyOn(shared, "migrateAgentConfig").mockImplementation(
      (config: Record<string, unknown>) => config,
    )
    logSpy = spyOn(shared, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    createBuiltinAgentsSpy.mockRestore()
    createSisyphusJuniorAgentSpy.mockRestore()
    discoverConfigSourceSkillsSpy.mockRestore()
    discoverUserClaudeSkillsSpy.mockRestore()
    discoverProjectClaudeSkillsSpy.mockRestore()
    discoverOpencodeGlobalSkillsSpy.mockRestore()
    discoverOpencodeProjectSkillsSpy.mockRestore()
    loadUserAgentsSpy.mockRestore()
    loadProjectAgentsSpy.mockRestore()
    migrateAgentConfigSpy.mockRestore()
    logSpy.mockRestore()
  })

  test("filters user agents whose key matches the builtin display-name alias", async () => {
    // given
    loadUserAgentsSpy.mockReturnValue({
      [BUILTIN_SISYPHUS_DISPLAY_NAME]: {
        name: BUILTIN_SISYPHUS_DISPLAY_NAME,
        prompt: "user alias prompt",
        mode: "subagent",
      },
    })

    // when
    const result = await applyAgentConfig({
      config: createBaseConfig(),
      pluginConfig: createPluginConfig(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponents(),
    })

    // then
    expect(result[BUILTIN_SISYPHUS_DISPLAY_NAME]).toEqual(builtinSisyphusConfig)
  })

  test("filters user agents whose key differs from a builtin key only by case", async () => {
    // given
    loadUserAgentsSpy.mockReturnValue({
      SiSyPhUs: {
        name: "SiSyPhUs",
        prompt: "mixed-case prompt",
        mode: "subagent",
      },
    })

    // when
    const result = await applyAgentConfig({
      config: createBaseConfig(),
      pluginConfig: createPluginConfig(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponents(),
    })

    // then
    expect(result.SiSyPhUs).toEqual(builtinSisyphusConfig)
  })

  test("filters project agents whose key matches the builtin display-name alias", async () => {
    // given
    loadProjectAgentsSpy.mockReturnValue({
      [BUILTIN_SISYPHUS_JUNIOR_DISPLAY_NAME]: {
        name: BUILTIN_SISYPHUS_JUNIOR_DISPLAY_NAME,
        prompt: "user alias prompt",
        mode: "subagent",
      },
    })

    // when
    const result = await applyAgentConfig({
      config: createBaseConfig(),
      pluginConfig: createPluginConfig(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponents(),
    })

    // then
    expect(result[BUILTIN_SISYPHUS_JUNIOR_DISPLAY_NAME]).toEqual(sisyphusJuniorConfig)
  })

  test("filters user agents whose key matches multimodal looker display name alias", async () => {
    // given
    loadUserAgentsSpy.mockReturnValue({
      [BUILTIN_MULTIMODAL_LOOKER_DISPLAY_NAME]: {
        name: BUILTIN_MULTIMODAL_LOOKER_DISPLAY_NAME,
        prompt: "user alias prompt",
        mode: "subagent",
      },
    })

    // when
    const result = await applyAgentConfig({
      config: createBaseConfig(),
      pluginConfig: createPluginConfig(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponents(),
    })

    // then
    expect(result[BUILTIN_MULTIMODAL_LOOKER_DISPLAY_NAME]).toEqual(builtinMultimodalLookerConfig)
  })
})
