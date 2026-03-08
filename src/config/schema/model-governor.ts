import { z } from "zod"

export const ModelGovernorConfigSchema = z.object({
  /** Enable automatic model discovery + recommendations. */
  enabled: z.boolean().optional(),

  /**
   * How the governor behaves.
   * - off: do nothing
   * - report_only: write a model report, but do not change any agent/category defaults
   * - auto: compute category defaults when user did not set them
   */
  mode: z.enum(["off", "report_only", "auto"]).optional(),

  /** Write a report of detected models + recommendations. */
  report: z
    .object({
      enabled: z.boolean().optional(),
      /** Optional explicit output path. If not set, uses OpenCode config dir. */
      path: z.string().optional(),
      /** Report format (default: md). */
      format: z.enum(["md", "json"]).optional(),
    })
    .optional(),

  /** Optional path to rules file (jsonc). If not set, uses OpenCode config dir. */
  rules_path: z.string().optional(),
})

export type ModelGovernorConfig = z.infer<typeof ModelGovernorConfigSchema>
