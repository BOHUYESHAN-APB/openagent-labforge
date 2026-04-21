import { z } from "zod"
import { DynamicContextPruningConfigSchema } from "./dynamic-context-pruning"

const ContextGuardThresholdBucketSchema = z.object({
  l1_tokens: z.number().int().positive().optional(),
  l2_tokens: z.number().int().positive().optional(),
  l3_tokens: z.number().int().positive().optional(),
})

const ContextGuardThresholdOverridesSchema = z.object({
  one_million: ContextGuardThresholdBucketSchema.optional(),
  four_hundred_k: ContextGuardThresholdBucketSchema.optional(),
  two_hundred_k: ContextGuardThresholdBucketSchema.optional(),
})

export const ExperimentalConfigSchema = z.object({
  aggressive_truncation: z.boolean().optional(),
  auto_resume: z.boolean().optional(),
  preemptive_compaction: z.boolean().optional(),
  /** Labforge context guard threshold preset: conservative | balanced | aggressive | conservative-plus | balanced-plus | aggressive-plus */
  context_guard_profile: z.enum([
    "conservative",
    "conservative-plus",
    "balanced",
    "balanced-plus",
    "aggressive",
    "aggressive-plus",
  ]).optional(),
  /** Optional explicit L1/L2/L3 token thresholds overriding the selected context guard preset. */
  context_guard_thresholds: ContextGuardThresholdOverridesSchema.optional(),
  /** Truncate all tool outputs, not just whitelisted tools (default: false). Tool output truncator is enabled by default - disable via disabled_hooks. */
  truncate_all_tool_outputs: z.boolean().optional(),
  /** Dynamic context pruning configuration */
  dynamic_context_pruning: DynamicContextPruningConfigSchema.optional(),
  /** Enable experimental task system for Todowrite disabler hook */
  task_system: z.boolean().optional(),
  /** Timeout in ms for loadAllPluginComponents during config handler init (default: 10000, min: 1000) */
  plugin_load_timeout_ms: z.number().min(1000).optional(),
  /** Wrap hook creation in try/catch to prevent one failing hook from crashing the plugin (default: true at call site) */
  safe_hook_creation: z.boolean().optional(),
  /** Disable auto-injected <omo-env> context in prompts (experimental) */
  disable_omo_env: z.boolean().optional(),
  /** Enable hashline_edit tool for improved file editing with hash-based line anchors */
  hashline_edit: z.boolean().optional(),
  /** Append fallback model info to session title when a runtime fallback occurs (default: false) */
  model_fallback_title: z.boolean().optional(),
  /** Force final chat model to stay on user-selected model when explicitly chosen (default: true) */
  strict_user_model_priority: z.boolean().optional(),
  /** Semantic mode hint injection policy for keyword detector: off | suggest | enforce */
  semantic_mode_hint: z.enum(["off", "suggest", "enforce"]).optional(),
})

export type ExperimentalConfig = z.infer<typeof ExperimentalConfigSchema>
