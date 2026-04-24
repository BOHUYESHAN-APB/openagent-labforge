import { z } from "zod"

/**
 * Model preference configuration for an agent or category.
 * Defines the preferred model and fallback models.
 */
export const ModelPreferenceSchema = z.object({
  /** Preferred model to use (e.g., "deepseek/deepseek-v4-pro") */
  preferred_model: z.string().optional(),
  /** Fallback models to try if preferred model is unavailable */
  fallback_models: z.array(z.string()).optional(),
})

export type ModelPreference = z.infer<typeof ModelPreferenceSchema>

/**
 * Model selection configuration.
 * Controls auto provider mode and model preferences for agents and categories.
 */
export const ModelSelectionConfigSchema = z.object({
  /**
   * Enable auto provider mode (default: true).
   * When enabled, uses agent/category preferences to automatically select models.
   * When disabled, uses explicit agent/category model overrides only.
   */
  enable_auto_provider: z.boolean().optional(),

  /**
   * DeepSeek availability status (auto-detected).
   * Set to true if DeepSeek provider is available.
   */
  deepseek_available: z.boolean().optional(),

  /**
   * Model preferences for each agent.
   * Maps agent name to its preferred and fallback models.
   */
  agent_preferences: z.record(z.string(), ModelPreferenceSchema).optional(),

  /**
   * Model preferences for each category.
   * Maps category name to its preferred and fallback models.
   */
  category_preferences: z.record(z.string(), ModelPreferenceSchema).optional(),
})

export type ModelSelectionConfig = z.infer<typeof ModelSelectionConfigSchema>
