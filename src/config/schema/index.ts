import { z } from "zod"
import { BackgroundTaskConfigSchema } from "./background-task"
import { CategoriesConfigSchema } from "./categories"
import { AgentOverridesSchema } from "./agent-overrides"

export const OhMyOpenCodeConfigSchema = z.object({
  version: z.string().optional(),
  agents: AgentOverridesSchema,
  categories: CategoriesConfigSchema,
  background_task: BackgroundTaskConfigSchema,
  disabled_agents: z.array(z.string()).default([]),
  disabled_mcps: z.array(z.string()).default([]),
  disabled_skills: z.array(z.string()).default([]),
}).strict()

export type OhMyOpenCodeConfig = z.infer<typeof OhMyOpenCodeConfigSchema>
