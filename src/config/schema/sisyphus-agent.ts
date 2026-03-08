import { z } from "zod"

export const SisyphusAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
  /** If true, demote/hide OpenCode's default build agent for subagent use. */
  hijack_build: z.boolean().optional(),
  /** If true, set OpenCode default_agent to Sisyphus when user has no default_agent configured. */
  set_default_agent: z.boolean().optional(),
})

export type SisyphusAgentConfig = z.infer<typeof SisyphusAgentConfigSchema>
