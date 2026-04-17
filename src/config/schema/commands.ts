import { z } from "zod"

export const BuiltinCommandNameSchema = z.enum([
  "compress-context",
  "checkpoint",
  "checkpoint-resume",
  "init-deep",
  "ralph-loop",
  "ulw-loop",
  "cancel-ralph",
  "refactor",
  "start-work",
  "stop-continuation",
  "remove-ai-slops",
  "todo-clear",
  "workflow-reset",
  "focus-chat",
  "ol-settings",
  "ol-settings-image-bus",
  "handoff",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
