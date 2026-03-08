import { z } from "zod"

export const SoulConfigSchema = z.object({
  /** Enable SOUL rules injection (default: true when path exists). */
  enabled: z.boolean().optional(),
  /** Path to SOUL.md file. If not set, tries .sisyphus/rules/SOUL.md in project. */
  path: z.string().optional(),
  /** Injection mode. */
  mode: z.enum(["full", "dynamic"]).optional(),
  /** Context injection priority. */
  priority: z.enum(["critical", "high", "normal", "low"]).optional(),
  /** Inject once per session (default: true). */
  inject_once: z.boolean().optional(),
  /** Truncate content to max chars before injection. */
  max_chars: z.number().int().positive().optional(),
})

export type SoulConfig = z.infer<typeof SoulConfigSchema>
