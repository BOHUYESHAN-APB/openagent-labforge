import { z } from "zod"

export const CanonicalBuiltinCommandNameSchema = z.enum([
  "ol-compress-context",
  "ol-checkpoint",
  "ol-checkpoint-resume",
  "ol-init-deep",
  "ol-ralph-loop",
  "ol-ulw-loop",
  "ol-cancel-ralph",
  "ol-refactor",
  "ol-start-work",
  "ol-stop-continuation",
  "ol-remove-ai-slops",
  "ol-todo-clear",
  "ol-workflow-reset",
  "ol-focus-chat",
  "ol-settings",
  "ol-settings-image-bus",
  "ol-handoff",
])

export const LegacyBuiltinCommandNameSchema = z.enum([
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

export const BuiltinCommandNameSchema = z.union([
  CanonicalBuiltinCommandNameSchema,
  LegacyBuiltinCommandNameSchema,
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
