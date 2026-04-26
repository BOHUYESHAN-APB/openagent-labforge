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
  /** Custom context limits for models (e.g., { "deepseek/deepseek-chat": 128000, "openai/gpt-4": 128000 }) */
  model_context_limits: z.record(z.string(), z.number().int().positive()).optional(),
  /* SWARM SYSTEM - DISABLED 2026-04-23
  swarm: z.object({
    enabled: z.boolean().optional(),
    max_workers: z.number().int().min(1).max(20).optional(),
    heartbeat_interval_ms: z.number().int().min(1000).optional(),
    heartbeat_timeout_ms: z.number().int().min(5000).optional(),
    auto_cleanup: z.boolean().optional(),
    coordinator_model: z.string().optional(),
    coordinator_fallback_models: z.array(z.string()).optional(),
    worker_model: z.string().optional(),
    worker_fallback_models: z.array(z.string()).optional(),
    specialist_model: z.string().optional(),
    specialist_fallback_models: z.array(z.string()).optional(),
  }).optional(),
  */
  /** Context compression configuration */
  context_compression: z.object({
    /** Enable context compression system (default: true) */
    enabled: z.boolean().default(true),
    /** Micro-pruning threshold for tool output compression in characters (default: 500) */
    micro_prune_threshold: z.number().int().min(100).max(5000).optional(),
    /** Enable duplicate content detection (default: true) */
    enable_duplicate_detection: z.boolean().optional(),
    /** Enable error stack compression (default: true) */
    enable_error_stack_compression: z.boolean().optional(),
    /** L0: Real-time cleanup configuration */
    l0_realtime_cleanup: z.object({
      enabled: z.boolean().default(true),
      apply_on_tool_call: z.boolean().default(true),
    }).optional(),
    /** L1: Micro-prune configuration */
    l1_micro_prune: z.object({
      enabled: z.boolean().default(true),
      threshold: z.number().min(100).max(5000).default(500),
      keep_head_lines: z.number().min(10).max(200).default(50),
      keep_tail_lines: z.number().min(10).max(200).default(50),
    }).optional(),
    /** L2: Light checkpoint configuration */
    l2_light_checkpoint: z.object({
      enabled: z.boolean().default(true),
      keep_versions: z.number().min(1).max(10).default(3),
    }).optional(),
    /** L3: Heavy checkpoint configuration */
    l3_heavy_checkpoint: z.object({
      enabled: z.boolean().default(true),
      keep_versions: z.number().min(1).max(10).default(5),
    }).optional(),
    /** Compression history tracking */
    history: z.object({
      enabled: z.boolean().default(true),
      max_events: z.number().min(10).max(200).default(50),
    }).optional(),
  }).optional(),
  /** Checkpoint retention configuration */
  checkpoint_retention: z.object({
    /** Number of global checkpoints to keep (default: 5, 0 = unlimited) */
    global_keep_count: z.number().int().min(0).max(100).optional(),
    /** Number of checkpoints to keep per session (default: 3, 0 = unlimited) */
    per_session_keep_count: z.number().int().min(0).max(50).optional(),
    /** Session expiry in days (default: 0 = never expire, cleanup disabled by default) */
    session_expiry_days: z.number().int().min(0).max(365).optional(),
    /** Enable automatic cleanup of old sessions (default: false) */
    auto_cleanup: z.boolean().optional(),
  }).optional(),
  /** Preemptive compaction configuration */
  preemptive_compaction_config: z.object({
    /** Buffer ratio before L3 threshold to trigger preemptive compaction (default: 0.10 = 10%) */
    buffer_ratio: z.number().min(0.01).max(0.20).optional(),
    /** Timeout in milliseconds for compaction operation (default: 120000) */
    timeout_ms: z.number().int().min(30000).max(300000).optional(),
    /** Retry on failure (default: false) */
    retry_on_failure: z.boolean().optional(),
  }).optional(),
  /** Magic Context configuration - cache-aware compression and context management */
  magic_context: z.object({
    /** Enable Magic Context features (default: false) */
    enabled: z.boolean().default(false),
    /** Cache TTL for deferring operations (default: "5m") - supports "5m", "10m", "1h", "30s" */
    cache_ttl: z.string().default("5m"),
    /** Execute threshold percentage - trigger compression when usage exceeds this (default: 65) */
    execute_threshold_percentage: z.number().min(50).max(95).default(65),
    /** Enable async background compression via Historian agent (default: true) */
    async_compression: z.boolean().default(true),
    /** Enable tag system (§N§) for precise message references (default: true) */
    tag_system_enabled: z.boolean().default(true),
    /** Enable cross-session memories (default: true) */
    cross_session_memories: z.boolean().default(true),
    /** Enable TUI sidebar visualization (default: true) */
    tui_sidebar: z.boolean().default(true),
  }).optional(),
  /** Autonomous agent configuration */
  autonomous_agents: z.object({
    /** Enable acceptance-reviewer for autonomous agents (default: true) */
    enable_review: z.boolean().default(true),
    /** Enable automatic planning bootstrap in heavy autonomous mode (default: true) */
    enable_auto_planning: z.boolean().default(true),
  }).optional(),
  /** Model-specific prompt optimization */
  prompt_optimization: z.object({
    /** Enable DeepSeek V4 official prompts (Think Max, math reasoning, XML tools) (default: true) */
    enable_deepseek_v4: z.boolean().default(true),
  }).optional(),
})

export type ExperimentalConfig = z.infer<typeof ExperimentalConfigSchema>
