import type { CommandDefinition } from "../claude-code-command-loader"
import { isAgentRegistered } from "../claude-code-session-state"
import type { BuiltinCommandName, BuiltinCommands } from "./types"
import { INIT_DEEP_TEMPLATE } from "./templates/init-deep"
import { RALPH_LOOP_TEMPLATE, ULW_LOOP_TEMPLATE, CANCEL_RALPH_TEMPLATE } from "./templates/ralph-loop"
import { STOP_CONTINUATION_TEMPLATE } from "./templates/stop-continuation"
import { REFACTOR_TEMPLATE } from "./templates/refactor"
import { START_WORK_TEMPLATE } from "./templates/start-work"
import { HANDOFF_TEMPLATE } from "./templates/handoff"
import { CHECKPOINT_TEMPLATE } from "./templates/checkpoint"
import { CHECKPOINT_RESUME_TEMPLATE } from "./templates/checkpoint-resume"
import { TODO_CLEAR_TEMPLATE } from "./templates/todo-clear"
import { WORKFLOW_RESET_TEMPLATE } from "./templates/workflow-reset"
import { FOCUS_CHAT_TEMPLATE } from "./templates/focus-chat"

export interface LoadBuiltinCommandsOptions {
  useRegisteredAgents?: boolean
}

function resolveStartWorkAgent(options?: LoadBuiltinCommandsOptions): "atlas" | "sisyphus" {
  if (options?.useRegisteredAgents) {
    return isAgentRegistered("atlas") ? "atlas" : "sisyphus"
  }

  return "atlas"
}

function createBuiltinCommandDefinitions(
  options?: LoadBuiltinCommandsOptions,
): Record<BuiltinCommandName, Omit<CommandDefinition, "name">> {
  return {
  checkpoint: {
    description: "(builtin) Create a repo-local checkpoint for continuing work in a fresh session",
    template: `<command-instruction>
${CHECKPOINT_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[goal]",
  },
  "checkpoint-resume": {
    description: "(builtin) Resume work from the latest or specified repo-local checkpoint",
    template: `<command-instruction>
${CHECKPOINT_RESUME_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[latest|session-id|checkpoint-path]",
  },
  "init-deep": {
    description: "(builtin) Initialize hierarchical AGENTS.md knowledge base",
    template: `<command-instruction>
${INIT_DEEP_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[--create-new] [--max-depth=N]",
  },
   "ralph-loop": {
     description: "(builtin) Start self-referential development loop until completion",
     template: `<command-instruction>
${RALPH_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
     argumentHint: '"task description" [--completion-promise=TEXT] [--max-iterations=N] [--strategy=reset|continue]',
   },
   "ulw-loop": {
      description: "(builtin) Start ultrawork loop - continues until completion with ultrawork mode",
      template: `<command-instruction>
${ULW_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
      argumentHint: '"task description" [--completion-promise=TEXT] [--strategy=reset|continue]',
    },
  "cancel-ralph": {
    description: "(builtin) Cancel active Ralph Loop",
    template: `<command-instruction>
${CANCEL_RALPH_TEMPLATE}
</command-instruction>`,
  },
  refactor: {
    description:
      "(builtin) Intelligent refactoring command with LSP, AST-grep, architecture analysis, codemap, and TDD verification.",
    template: `<command-instruction>
${REFACTOR_TEMPLATE}
</command-instruction>`,
    argumentHint: "<refactoring-target> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]",
  },
  "start-work": {
    description: "(builtin) Start Sisyphus work session from Prometheus plan",
    agent: resolveStartWorkAgent(options),
    template: `<command-instruction>
${START_WORK_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[plan-name]",
  },
  "stop-continuation": {
    description: "(builtin) Stop all continuation mechanisms (ralph loop, todo continuation, boulder) for this session",
    template: `<command-instruction>
${STOP_CONTINUATION_TEMPLATE}
</command-instruction>`,
  },
  "todo-clear": {
    description: "(builtin) Clear stale todos and session-level execution residue for the current session",
    template: `<command-instruction>
${TODO_CLEAR_TEMPLATE}
</command-instruction>`,
  },
  "workflow-reset": {
    description: "(builtin) Reset current session/project execution workflow state before starting fresh",
    template: `<command-instruction>
${WORKFLOW_RESET_TEMPLATE}
</command-instruction>`,
  },
  "focus-chat": {
    description: "(builtin) Return the current session to ordinary chat mode and suppress stale execution carry-over",
    template: `<command-instruction>
${FOCUS_CHAT_TEMPLATE}
</command-instruction>`,
  },
  handoff: {
    description: "(builtin) Create a detailed context summary for continuing work in a new session",
    template: `<command-instruction>
${HANDOFF_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[goal]",
  },
  }
}

export function loadBuiltinCommands(
  disabledCommands?: BuiltinCommandName[],
  options?: LoadBuiltinCommandsOptions,
): BuiltinCommands {
  const disabled = new Set(disabledCommands ?? [])
  const commands: BuiltinCommands = {}
  const builtinCommandDefinitions = createBuiltinCommandDefinitions(options)

  for (const [name, definition] of Object.entries(builtinCommandDefinitions)) {
    if (!disabled.has(name as BuiltinCommandName)) {
      const { argumentHint: _argumentHint, ...openCodeCompatible } = definition
      commands[name] = { ...openCodeCompatible, name } as CommandDefinition
    }
  }

  return commands
}
