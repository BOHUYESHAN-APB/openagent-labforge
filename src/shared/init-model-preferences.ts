import { detectDeepSeekAvailability } from "./auto-model-selector"

export interface ModelPreferenceConfig {
  preferred_model?: string
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
 * Default strategy:
 * - No agent has a forced preferred_model. User's manual model selection ALWAYS wins.
 * - fallback_models define the fallback order when the current model is unavailable.
 * - enable_auto_provider: true allows runtime auto-detection when user selects "auto"
 *   (but no hardcoded preference forces a specific model).
 * - Users customize via TUI or config file.
 */
export function initializeDefaultModelPreferences(): ModelSelectionConfig {
  const deepseekAvailable = detectDeepSeekAvailability()

  const mainAgentFallbacks = ["openai/gpt-5.4", "openai/o1", "google/gemini-3.1-pro"]
  const subagentFallbacks = ["openai/gpt-4o", "google/gemini-3-flash", "openai/gpt-4o-mini"]
  const codexFallbacks = ["openai/gpt-5.3-codex", "openai/gpt-5.4", "google/gemini-3.1-pro"]

  return {
    enable_auto_provider: true,
    deepseek_available: deepseekAvailable,
    agent_preferences: {
      // T0 tier main agents — no preferred_model, user choice wins.
      // fallback_models define recovery order when model is unavailable.
      sisyphus:    { fallback_models: mainAgentFallbacks },
      wase:        { fallback_models: mainAgentFallbacks },
      prometheus:  { fallback_models: mainAgentFallbacks },
      oracle:      { fallback_models: mainAgentFallbacks },
      hephaestus:  { fallback_models: codexFallbacks },
      atlas:       { fallback_models: mainAgentFallbacks },
      "bio-autopilot":      { fallback_models: mainAgentFallbacks },
      "bio-orchestrator":   { fallback_models: mainAgentFallbacks },
      "tech-scout":         { fallback_models: mainAgentFallbacks },
      "article-writer":     { fallback_models: mainAgentFallbacks },
      "scientific-writer":  { fallback_models: mainAgentFallbacks },
      "multimodal-looker":  { fallback_models: ["google/gemini-3-flash", "openai/gpt-4o"] },

      // T1 tier subagents — no preferred_model, inherit parent model.
      // Users can override via TUI if they want a specific model per subagent.
      librarian:     { fallback_models: subagentFallbacks },
      explore:       { fallback_models: subagentFallbacks },
      "github-scout":{ fallback_models: subagentFallbacks },
    },
    category_preferences: {
      quick:            { fallback_models: subagentFallbacks },
      ultrabrain:       { fallback_models: codexFallbacks },
      deep:             { fallback_models: codexFallbacks },
      "visual-engineering": { fallback_models: subagentFallbacks },
      artistry:         { fallback_models: subagentFallbacks },
      writing:          { fallback_models: subagentFallbacks },
      "unspecified-low":  { fallback_models: subagentFallbacks },
      "unspecified-high": { fallback_models: mainAgentFallbacks },
    },
  }
}
