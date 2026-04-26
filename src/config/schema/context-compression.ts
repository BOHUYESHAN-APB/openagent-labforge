/**
 * Context Compression Configuration Schema
 * 
 * Defines configuration for the 4-tier context compression system:
 * - L0: Real-time cleanup (turn protection, deduplication, etc.)
 * - L1: Micro-prune (tool output truncation)
 * - L2: Light checkpoint
 * - L3: Heavy checkpoint
 */

import { z } from "zod"

export const ContextCompressionConfigSchema = z.object({
  /** Enable context compression system (default: true) */
  enabled: z.boolean().default(true),
  
  /** L0: Real-time cleanup configuration */
  l0_realtime_cleanup: z.object({
    /** Enable L0 real-time cleanup (default: true) */
    enabled: z.boolean().default(true),
    /** Apply cleanup on every tool call (default: true) */
    apply_on_tool_call: z.boolean().default(true),
  }).optional(),
  
  /** L1: Micro-prune configuration */
  l1_micro_prune: z.object({
    /** Enable L1 micro-prune (default: true) */
    enabled: z.boolean().default(true),
    /** Threshold in tokens for truncation (default: 500, range: 100-5000) */
    threshold: z.number().min(100).max(5000).default(500),
    /** Keep first N lines when truncating (default: 50, range: 10-200) */
    keep_head_lines: z.number().min(10).max(200).default(50),
    /** Keep last N lines when truncating (default: 50, range: 10-200) */
    keep_tail_lines: z.number().min(10).max(200).default(50),
  }).optional(),
  
  /** L2: Light checkpoint configuration */
  l2_light_checkpoint: z.object({
    /** Enable L2 light checkpoint (default: true) */
    enabled: z.boolean().default(true),
    /** Keep last N checkpoint versions (default: 3, range: 1-10) */
    keep_versions: z.number().min(1).max(10).default(3),
  }).optional(),
  
  /** L3: Heavy checkpoint configuration */
  l3_heavy_checkpoint: z.object({
    /** Enable L3 heavy checkpoint (default: true) */
    enabled: z.boolean().default(true),
    /** Keep last N checkpoint versions (default: 5, range: 1-10) */
    keep_versions: z.number().min(1).max(10).default(5),
  }).optional(),
  
  /** Compression history tracking */
  history: z.object({
    /** Enable compression history tracking (default: true) */
    enabled: z.boolean().default(true),
    /** Keep last N compression events (default: 50, range: 10-200) */
    max_events: z.number().min(10).max(200).default(50),
  }).optional(),
  
  /** Enable duplicate content detection (default: true) */
  enable_duplicate_detection: z.boolean().default(true),
  
  /** Enable error stack compression (default: true) */
  enable_error_stack_compression: z.boolean().default(true),
})

export type ContextCompressionConfig = z.infer<
  typeof ContextCompressionConfigSchema
>
