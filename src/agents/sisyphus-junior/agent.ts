/**
 * Sisyphus-Junior - Focused Task Executor
 *
 * Executes delegated tasks directly without spawning other agents.
 * Category-spawned executor with domain-specific configurations.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) -> gpt.ts (GPT-5.4 optimized)
 * 2. Gemini models (google/*, google-vertex/*) -> gemini.ts (Gemini-optimized)
 * 3. Default (Claude, etc.) -> default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode } from "../types"
import { isGptModel, isGeminiModel } from "../types"
import type { AgentOverrideConfig } from "../../config/schema"
import {
  createAgentToolRestrictions,
  type PermissionValue,
} from "../../shared/permission-compat"

import { buildDefaultSisyphusJuniorPrompt } from "./default"
import { buildGptSisyphusJuniorPrompt } from "./gpt"
import { buildGpt54SisyphusJuniorPrompt } from "./gpt-5-4"
import { buildGpt53CodexSisyphusJuniorPrompt } from "./gpt-5-3-codex"
import { buildGeminiSisyphusJuniorPrompt } from "./gemini"

const MODE: AgentMode = "subagent"

// Core tools that Sisyphus-Junior must NEVER have access to
// Use task(subagent_type=...) for first-class child sessions; avoid call_omo_agent.
const BLOCKED_TOOLS = ["call_omo_agent"]

// NOTE: No hardcoded model defaults. Sisyphus-Junior MUST inherit the main model.
// If systemDefaultModel is not provided, it will throw an error to prevent silent hardcoding.
export const SISYPHUS_JUNIOR_DEFAULTS = {
  temperature: 0.1,
} as const

export type SisyphusJuniorPromptSource = "default" | "gpt" | "gpt-5-4" | "gpt-5-3-codex" | "gemini"

export function getSisyphusJuniorPromptSource(model?: string): SisyphusJuniorPromptSource {
  if (model && isGptModel(model)) {
    const lower = model.toLowerCase()
    if (lower.includes("gpt-5.4") || lower.includes("gpt-5-4")) return "gpt-5-4"
    if (lower.includes("gpt-5.3-codex") || lower.includes("gpt-5-3-codex")) return "gpt-5-3-codex"
    return "gpt"
  }
  if (model && isGeminiModel(model)) {
    return "gemini"
  }
  return "default"
}

/**
 * Builds the appropriate Sisyphus-Junior prompt based on model.
 */
export function buildSisyphusJuniorPrompt(
  model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string
): string {
  const source = getSisyphusJuniorPromptSource(model)

  switch (source) {
    case "gpt-5-4":
      return buildGpt54SisyphusJuniorPrompt(useTaskSystem, promptAppend)
    case "gpt-5-3-codex":
      return buildGpt53CodexSisyphusJuniorPrompt(useTaskSystem, promptAppend)
    case "gpt":
      return buildGptSisyphusJuniorPrompt(useTaskSystem, promptAppend)
    case "gemini":
      return buildGeminiSisyphusJuniorPrompt(useTaskSystem, promptAppend)
    case "default":
    default:
      return buildDefaultSisyphusJuniorPrompt(useTaskSystem, promptAppend)
  }
}

export function createSisyphusJuniorAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false
): AgentConfig {
  if (override?.disable) {
    override = undefined
  }

  const overrideModel = (override as { model?: string } | undefined)?.model

  // Priority: 1. User override, 2. System default (main model), 3. Skip initialization
  // NEVER use hardcoded fallback - must inherit main model
  const model = overrideModel ?? systemDefaultModel

  // If no model is available, return a disabled agent config instead of throwing
  // This allows the plugin to load successfully even when params.config.model is undefined
  if (!model) {
    return {
      description: "Sisyphus-Junior (disabled - no model available)",
      mode: MODE,
      model: "anthropic/claude-sonnet-4-6", // Placeholder, agent is disabled
      temperature: 0.1,
      maxTokens: 64000,
      prompt: "This agent is disabled.",
      color: "#808080",
      permission: { "*": "deny" },
      disable: true,
    } as AgentConfig
  }

  const temperature = override?.temperature ?? SISYPHUS_JUNIOR_DEFAULTS.temperature

  const promptAppend = override?.prompt_append
  const prompt = buildSisyphusJuniorPrompt(model, useTaskSystem, promptAppend)

  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS)

  const userPermission = (override?.permission ?? {}) as Record<string, PermissionValue>
  const basePermission = baseRestrictions.permission
  const merged: Record<string, PermissionValue> = { ...userPermission }
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny"
  }
  merged.task = "allow"
  const toolsConfig = { permission: { ...merged, ...basePermission } }

  const base: AgentConfig = {
    description: override?.description ??
      "Focused task executor. Same discipline, no delegation. (Sisyphus-Junior - OpenAgent Labforge)",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    ...toolsConfig,
  }

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p
  }

  if (isGptModel(model)) {
    return { ...base, reasoningEffort: "medium" } as AgentConfig
  }

  return {
    ...base,
    thinking: { type: "enabled", budgetTokens: 32000 },
  } as AgentConfig
}

createSisyphusJuniorAgentWithOverrides.mode = MODE
