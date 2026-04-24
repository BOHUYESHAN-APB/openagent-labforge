import { detectDeepSeekAvailability } from "./auto-model-selector"

export interface ModelPreferenceConfig {
  preferred_model: string
  fallback_models: string[]
}

export interface ModelSelectionConfig {
  enable_auto_provider: boolean
  deepseek_available: boolean
  agent_preferences: Record<string, ModelPreferenceConfig>
  category_preferences: Record<string, ModelPreferenceConfig>
}

/**
 * Initialize default model preferences.
 *
 * Official default configuration strategy:
 * - Main agents (T0 tier): DeepSeek V4-Pro as preferred model
 * - Subagents (T1 tier): DeepSeek V4-Flash as preferred model
 * - Fallback models: Prioritize OpenAI and Google models to avoid controversy
 * - Users can customize all preferences via TUI or config file
 *
 * Note: This is the official default. Users are free to configure
 * any models they prefer through the TUI settings or config file.
 */
export function initializeDefaultModelPreferences(): ModelSelectionConfig {
  const deepseekAvailable = detectDeepSeekAvailability()

  // Official default: DeepSeek V4-Pro for main agents (T0 tier)
  const mainAgentModel = "deepseek/deepseek-v4-pro"
  const mainAgentFallbacks = ["openai/gpt-5.4", "openai/o1", "google/gemini-3.1-pro"]

  // Official default: DeepSeek V4-Flash for subagents (T1 tier, completely sufficient)
  const subagentModel = "deepseek/deepseek-v4-flash"
  const subagentFallbacks = ["openai/gpt-4o", "google/gemini-3-flash", "openai/gpt-4o-mini"]

  return {
    enable_auto_provider: true,
    deepseek_available: deepseekAvailable,
    agent_preferences: {
      // T0 tier main agents
      sisyphus: {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      wase: {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      prometheus: {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      oracle: {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      hephaestus: {
        preferred_model: mainAgentModel,
        fallback_models: ["openai/gpt-5.3-codex", "openai/gpt-5.4", "google/gemini-3.1-pro"],
      },
      atlas: {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      "bio-autopilot": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      "bio-orchestrator": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },

      // T1 tier subagents (completely sufficient)
      librarian: {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },
      explore: {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },
      "github-scout": {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },
      "tech-scout": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      "article-writer": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      "scientific-writer": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
      "multimodal-looker": {
        preferred_model: "openai/gpt-5.4",
        fallback_models: ["google/gemini-3-flash", "openai/gpt-4o"],
      },
    },
    category_preferences: {
      // Quick tasks: T1 tier completely sufficient
      quick: {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },

      // Deep tasks: Need T0 tier
      ultrabrain: {
        preferred_model: mainAgentModel,
        fallback_models: ["openai/gpt-5.3-codex", "openai/gpt-5.4", "google/gemini-3.1-pro"],
      },
      deep: {
        preferred_model: mainAgentModel,
        fallback_models: ["openai/gpt-5.3-codex", "openai/gpt-5.4", "google/gemini-3.1-pro"],
      },

      // Visual engineering: T1 tier sufficient
      "visual-engineering": {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },

      // Creative tasks: T1 tier sufficient
      artistry: {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },

      // Writing tasks: T1 tier sufficient
      writing: {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },

      // Unspecified tasks
      "unspecified-low": {
        preferred_model: subagentModel,
        fallback_models: subagentFallbacks,
      },
      "unspecified-high": {
        preferred_model: mainAgentModel,
        fallback_models: mainAgentFallbacks,
      },
    },
  }
}
