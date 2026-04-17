import type { CommandDefinition } from "../claude-code-command-loader"

export type BuiltinCommandName =
  | "compress-context"
  | "checkpoint"
  | "checkpoint-resume"
  | "init-deep"
  | "ralph-loop"
  | "cancel-ralph"
  | "ulw-loop"
  | "refactor"
  | "start-work"
  | "stop-continuation"
  | "remove-ai-slops"
  | "todo-clear"
  | "workflow-reset"
  | "focus-chat"
  | "ol-settings"
  | "ol-settings-image-bus"
  | "handoff"

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[]
}

export type BuiltinCommands = Record<string, CommandDefinition>
