import type { CommandDefinition } from "../claude-code-command-loader"
import { isAgentRegistered } from "../claude-code-session-state"
import type { BuiltinCommandName, BuiltinCommands } from "./types"
import { normalizeBuiltinCommandName } from "./aliases"
import { INIT_DEEP_TEMPLATE } from "./templates/init-deep"
import { RALPH_LOOP_TEMPLATE, ULW_LOOP_TEMPLATE, CANCEL_RALPH_TEMPLATE } from "./templates/ralph-loop"
import { STOP_CONTINUATION_TEMPLATE } from "./templates/stop-continuation"
import { REFACTOR_TEMPLATE } from "./templates/refactor"
import { START_WORK_TEMPLATE } from "./templates/start-work"
import { HANDOFF_TEMPLATE } from "./templates/handoff"
import { COMPRESS_CONTEXT_TEMPLATE } from "./templates/compress-context"
import { CHECKPOINT_TEMPLATE } from "./templates/checkpoint"
import { CHECKPOINT_RESUME_TEMPLATE } from "./templates/checkpoint-resume"
import { REMOVE_AI_SLOPS_TEMPLATE } from "./templates/remove-ai-slops"
import { TODO_CLEAR_TEMPLATE } from "./templates/todo-clear"
import { WORKFLOW_RESET_TEMPLATE } from "./templates/workflow-reset"
import { FOCUS_CHAT_TEMPLATE } from "./templates/focus-chat"
import { SWARM_START_TEMPLATE } from "./templates/swarm-start"
import { COMPRESSION_STATS_TEMPLATE } from "./templates/compression-stats"
import { MANUAL_COMPRESS_TEMPLATE } from "./templates/manual-compress"

export interface LoadBuiltinCommandsOptions {
  useRegisteredAgents?: boolean
  swarmEnabled?: boolean
}

function resolveStartWorkAgent(options?: LoadBuiltinCommandsOptions): "executor" | "atlas" | "sisyphus" {
  if (options?.useRegisteredAgents) {
    // Prefer executor for intelligent domain routing
    if (isAgentRegistered("executor")) return "executor"
    return isAgentRegistered("atlas") ? "atlas" : "sisyphus"
  }

  return "executor"
}

function createBuiltinCommandDefinitions(
  options?: LoadBuiltinCommandsOptions,
): Record<string, Omit<CommandDefinition, "name">> {
  const commands: Record<string, Omit<CommandDefinition, "name">> = {
  "ol-compress": {
    description: "(builtin) Manually trigger context compression for the current session",
    template: `<command-instruction>
${MANUAL_COMPRESS_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[auto|light|medium|heavy|preemptive]",
  },
  "ol-compression-stats": {
    description: "(builtin) View compression history and statistics for the current session",
    template: `<command-instruction>
${COMPRESSION_STATS_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[filter]",
  },
  "ol-compress-context": {
    description: "(builtin) Inspect or trigger the Labforge L1/L2/L3 compression stack for the current session",
    template: `<command-instruction>
${COMPRESS_CONTEXT_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[status|auto|l1|l2|l3]",
  },
  "ol-checkpoint": {
    description: "(builtin) Create a repo-local light/heavy checkpoint for same-session recovery or cross-session continuation",
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
    argumentHint: "[light|heavy] [goal]",
  },
  "ol-checkpoint-resume": {
    description: "(builtin) Resume or reload work from the latest or specified repo-local checkpoint",
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
  "ol-init-deep": {
    description: "(builtin) Initialize hierarchical AGENTS.md knowledge base",
    template: `<command-instruction>
${INIT_DEEP_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
    argumentHint: "[--create-new] [--max-depth=N]",
  },
   "ol-ralph-loop": {
     description: "(builtin) Start self-referential development loop until completion",
     template: `<command-instruction>
${RALPH_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
     argumentHint: '"task description" [--completion-promise=TEXT] [--max-iterations=N] [--strategy=reset|continue]',
   },
   "ol-ulw-loop": {
      description: "(builtin) Start ultrawork loop - continues until completion with ultrawork mode",
      template: `<command-instruction>
${ULW_LOOP_TEMPLATE}
</command-instruction>

<user-task>
$ARGUMENTS
</user-task>`,
      argumentHint: '"task description" [--completion-promise=TEXT] [--strategy=reset|continue]',
    },
  "ol-cancel-ralph": {
    description: "(builtin) Cancel active Ralph Loop",
    template: `<command-instruction>
${CANCEL_RALPH_TEMPLATE}
</command-instruction>`,
  },
  "ol-refactor": {
    description:
      "(builtin) Intelligent refactoring command with LSP, AST-grep, architecture analysis, codemap, and TDD verification.",
    template: `<command-instruction>
${REFACTOR_TEMPLATE}
</command-instruction>`,
    argumentHint: "<refactoring-target> [--scope=<file|module|project>] [--strategy=<safe|aggressive>]",
  },
  "ol-start-work": {
    description: "(builtin) Start work session with intelligent domain routing (executor)",
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
  "ol-stop-continuation": {
    description: "(builtin) Stop all continuation mechanisms (ralph loop, todo continuation, boulder) for this session",
    template: `<command-instruction>
${STOP_CONTINUATION_TEMPLATE}
</command-instruction>`,
  },
  "ol-remove-ai-slops": {
    description: "(builtin) Remove AI-generated code smells from branch changes and critically review the results",
    template: `<command-instruction>
${REMOVE_AI_SLOPS_TEMPLATE}
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>`,
  },
  "ol-todo-clear": {
    description: "(builtin) Clear stale todos and session-level execution residue for the current session",
    template: `<command-instruction>
${TODO_CLEAR_TEMPLATE}
</command-instruction>`,
  },
  "ol-workflow-reset": {
    description: "(builtin) Reset current session/project execution workflow state before starting fresh",
    template: `<command-instruction>
${WORKFLOW_RESET_TEMPLATE}
</command-instruction>`,
  },
  "ol-focus-chat": {
    description: "(builtin) Return the current session to ordinary chat mode and suppress stale execution carry-over",
    template: `<command-instruction>
${FOCUS_CHAT_TEMPLATE}
</command-instruction>`,
  },
  "ol-handoff": {
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

  // Only include swarm-start if swarm is enabled
  if (options?.swarmEnabled !== false) {
    commands["ol-swarm-start"] = {
      description: "(builtin) Start a swarm of parallel agents with configurable workers and models",
      agent: "swarm-coordinator",
      template: `<command-instruction>
${SWARM_START_TEMPLATE}
</command-instruction>

<session-context>
Session ID: $SESSION_ID
Timestamp: $TIMESTAMP
</session-context>

<user-request>
$ARGUMENTS
</user-request>`,
      argumentHint: '"<task-description>" [--workers=N] [--strategy=batch|dynamic]',
    }
  }

  return commands
}

export function loadBuiltinCommands(
  disabledCommands?: BuiltinCommandName[],
  options?: LoadBuiltinCommandsOptions,
): BuiltinCommands {
  const disabled = new Set<string>(
    (disabledCommands ?? []).reduce<string[]>((acc, name) => {
      const canonical = normalizeBuiltinCommandName(name)
      if (canonical) {
        acc.push(canonical)
      }
      return acc
    }, []),
  )
  const commands: BuiltinCommands = {}
  const builtinCommandDefinitions = createBuiltinCommandDefinitions(options)

  for (const [name, definition] of Object.entries(builtinCommandDefinitions)) {
    if (!disabled.has(name)) {
      const { argumentHint: _argumentHint, ...openCodeCompatible } = definition
      commands[name] = { ...openCodeCompatible, name } as CommandDefinition
    }
  }

  return commands
}
