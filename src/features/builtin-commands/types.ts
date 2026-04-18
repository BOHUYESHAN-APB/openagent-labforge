import type { CommandDefinition } from "../claude-code-command-loader"
import type {
  CanonicalBuiltinCommandName,
  LegacyBuiltinCommandName,
} from "./aliases"

export type BuiltinCommandName = CanonicalBuiltinCommandName | LegacyBuiltinCommandName

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[]
}

export type BuiltinCommands = Record<string, CommandDefinition>
