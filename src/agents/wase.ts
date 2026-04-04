import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import type {
  AvailableAgent,
  AvailableCategory,
  AvailableSkill,
} from "./dynamic-agent-prompt-builder"
import { createSisyphusAgent } from "./sisyphus"

const MODE: AgentMode = "all"

const WASE_AUTONOMY_APPEND = `<wase-autonomous-mode>
You are in FULLY AUTONOMOUS execution mode.

Core behavior:
- Always create and maintain todo/task lists for implementation work.
- Keep exactly ONE item in_progress at a time.
- Never stop while incomplete todo items remain.
- Do not ask for routine confirmation between steps.
- Continue execution loop: plan → implement → verify → update todo → next item.

Strict completion gate:
- You may finish only when all todo items are completed or explicitly cancelled.
- Before finishing, verify and report evidence (tests/build/diagnostics) for changed scope.

Allowed interruption conditions:
- destructive irreversible actions
- security-sensitive secret handling
- publish/force-push/paid external side effects
- true requirement conflicts with materially different outcomes

If blocked:
- explore and delegate first
- only then ask user if still blocked

Autonomy quality bar:
- do not stop at "implemented" when verification, integration, or cleanup is still pending
- if a subtask changes user-visible behavior, make sure docs, commands, or output expectations stay in sync
- before ending, re-check the todo list against the actual changed files and verification evidence
- if progress stalls, switch approach instead of narrating the blockage repeatedly
</wase-autonomous-mode>`

export function createWaseAgent(
  model: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[],
  availableCategories?: AvailableCategory[],
  useTaskSystem = false,
): AgentConfig {
  const base = createSisyphusAgent(
    model,
    availableAgents,
    availableToolNames,
    availableSkills,
    availableCategories,
    useTaskSystem,
  )

  return {
    ...base,
    description:
      "Fully autonomous ultrawork orchestrator with mandatory todo continuity until completion. (WASE - OpenAgent Labforge)",
    prompt: `${base.prompt ?? ""}\n\n${WASE_AUTONOMY_APPEND}`,
    color: "#FF6B35",
    mode: MODE,
  }
}
createWaseAgent.mode = MODE

export const WASE_PROMPT_METADATA: AgentPromptMetadata = {
  category: "utility",
  cost: "EXPENSIVE",
  promptAlias: "WASE",
  triggers: [
    {
      domain: "Fully autonomous execution",
      trigger: "User wants end-to-end execution without repeated confirmation",
    },
    {
      domain: "Todo-forced continuity",
      trigger: "Must keep working until all todo items are complete",
    },
  ],
  useWhen: [
    "Need full autonomous implementation loop with minimal interruptions",
    "Need strict todo progression and completion enforcement",
  ],
  avoidWhen: [
    "User only asks for discussion/evaluation without execution",
    "Task requires frequent product decisions from user each step",
  ],
}
