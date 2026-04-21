import { z } from "zod"

/**
 * Agent display mode determines how many agents are visible to the user
 * - minimal: 5-6 agents (default, best UX)
 * - standard: 8 agents (includes hephaestus and bio-pipeline-operator)
 */
export const AgentDisplayModeSchema = z.enum(["minimal", "standard"])

/**
 * Agent display presets - defines which agents are shown in each mode
 */
export const AGENT_DISPLAY_PRESETS = {
  minimal: [
    "sisyphus",      // 主编排器
    "prometheus",    // 规划师（让用户知道在规划）
    "orchestrator",  // 执行计划（让用户知道在执行）
    "wase",          // 通用全自动
    "atlas",         // 轻量执行
    // bio-autopilot 通过领域开关控制
  ],
  standard: [
    "sisyphus",
    "prometheus",
    "orchestrator",
    "wase",
    "atlas",
    "hephaestus",           // 深度执行
    "bio-pipeline-operator", // 生信执行
    // bio-autopilot 通过领域开关控制
  ],
} as const

/**
 * Domain-specific agents - controlled by enable_domains configuration
 */
export const DOMAIN_AGENTS = {
  bioinformatics: ["bio-autopilot"],
  engineering: [],  // 工程类 agent 默认都显示
} as const

/**
 * Domain enablement controls which domain-specific agents are shown
 */
export const EnableDomainsSchema = z.object({
  /** Enable bioinformatics agents (bio-autopilot, bio-planner, bio-orchestrator) */
  bioinformatics: z.boolean().default(true),
  /** Enable engineering agents (wase, engineering-orchestrator) */
  engineering: z.boolean().default(true),
})

/**
 * Intelligent routing configuration for prometheus and orchestrator
 */
export const IntelligentRoutingSchema = z.object({
  /** Enable intelligent routing (default: true) */
  enabled: z.boolean().default(true),
  /** Bio task detection configuration */
  bio_detection: z
    .object({
      /** Keywords to detect bio tasks */
      keywords: z
        .array(z.string())
        .default([
          // English keywords
          "bio",
          "bioinformatics",
          "rna",
          "dna",
          "genome",
          "proteomics",
          "scrnaseq",
          "rnaseq",
          "atacseq",
          "chipseq",
          "sequencing",
          "pipeline",
          "fastq",
          "bam",
          "vcf",
          // Chinese keywords
          "生信",
          "组学",
          "测序",
          "基因",
          "蛋白",
          "文献",
        ]),
      /** Detection threshold (0-1, default: 0.7) */
      threshold: z.number().min(0).max(1).default(0.7),
    })
    .optional(),
})

/**
 * Hide upstream OpenCode commands configuration
 */
export const HideUpstreamCommandsSchema = z.object({
  /** Hide OpenCode original /plan command (default: true) */
  plan: z.boolean().default(true),
  /** Hide OpenCode original /build command (default: true) */
  build: z.boolean().default(true),
})

/**
 * Complete agent display configuration
 */
export const AgentDisplayConfigSchema = z.object({
  /** Agent display mode (default: minimal) */
  agent_display_mode: AgentDisplayModeSchema.default("minimal"),

  /** Domain enablement (default: both enabled) */
  enable_domains: EnableDomainsSchema.optional(),

  /** Hide upstream commands (default: both hidden) */
  hide_upstream_commands: HideUpstreamCommandsSchema.optional(),

  /** Intelligent routing configuration (default: enabled) */
  intelligent_routing: IntelligentRoutingSchema.optional(),

  /** Explicitly disabled agents (overrides display mode) */
  disabled_agents: z.array(z.string()).default([]),

  /** Explicitly enabled agents (overrides display mode) */
  enabled_agents: z.array(z.string()).default([]),
})

export type AgentDisplayMode = z.infer<typeof AgentDisplayModeSchema>
export type EnableDomains = z.infer<typeof EnableDomainsSchema>
export type IntelligentRouting = z.infer<typeof IntelligentRoutingSchema>
export type HideUpstreamCommands = z.infer<typeof HideUpstreamCommandsSchema>
export type AgentDisplayConfig = z.infer<typeof AgentDisplayConfigSchema>
