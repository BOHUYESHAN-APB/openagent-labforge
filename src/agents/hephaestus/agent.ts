import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "../types";
import { isGpt5_4Model, isGpt5_3CodexModel } from "../types";
import type {
  AvailableAgent,
  AvailableTool,
  AvailableSkill,
  AvailableCategory,
} from "../dynamic-agent-prompt-builder";
import { buildAgentIdentitySection, categorizeTools } from "../dynamic-agent-prompt-builder";

import { buildHephaestusPrompt as buildGptPrompt } from "./gpt";
import { buildHephaestusPrompt as buildGpt53CodexPrompt } from "./gpt-5-3-codex";
import { buildHephaestusPrompt as buildGpt54Prompt } from "./gpt-5-4";
import {
  AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY,
  ENGINEERING_MICRO_KERNEL_CAPABILITY,
  ENGINEERING_EXECUTION_CAPABILITY,
  ENGINEERING_SKILL_ROUTER_CAPABILITY,
  INFORMATION_INTEGRITY_CAPABILITY,
  PROMPT_LAYERING_PROTOCOL_CAPABILITY,
} from "../engineering-capability";

const MODE: AgentMode = "all";

const HEPHAESTUS_EXECUTION_APPEND = `<hephaestus_execution_contract>
## Hephaestus Execution Contract

Hephaestus is responsible for implementation quality, not just raw throughput.

Required habits:
- keep the write surface as small as possible for the task at hand
- prefer existing local patterns over fresh abstractions
- when output artifacts or generated files change, inspect the actual artifact, not just the command exit code
- if the task changes config, CLI behavior, schemas, or user-facing flows, update the matching docs or examples in the same pass
- if a central module starts absorbing unrelated logic, stop and consider extraction before continuing
</hephaestus_execution_contract>`;

export type HephaestusPromptSource = "gpt-5-4" | "gpt-5-3-codex" | "gpt";

export function getHephaestusPromptSource(
  model?: string,
): HephaestusPromptSource {
  if (model && isGpt5_4Model(model)) {
    return "gpt-5-4";
  }
  if (model && isGpt5_3CodexModel(model)) {
    return "gpt-5-3-codex";
  }
  return "gpt";
}

export interface HephaestusContext {
  model?: string;
  availableAgents?: AvailableAgent[];
  availableTools?: AvailableTool[];
  availableSkills?: AvailableSkill[];
  availableCategories?: AvailableCategory[];
  useTaskSystem?: boolean;
}

export function getHephaestusPrompt(
  model?: string,
  useTaskSystem = false,
): string {
  return buildDynamicHephaestusPrompt({ model, useTaskSystem });
}

function buildDynamicHephaestusPrompt(ctx?: HephaestusContext): string {
  const agents = ctx?.availableAgents ?? [];
  const tools = ctx?.availableTools ?? [];
  const skills = ctx?.availableSkills ?? [];
  const categories = ctx?.availableCategories ?? [];
  const useTaskSystem = ctx?.useTaskSystem ?? false;
  const model = ctx?.model;

  const source = getHephaestusPromptSource(model);

  let basePrompt: string;
  switch (source) {
    case "gpt-5-4":
      basePrompt = buildGpt54Prompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
    case "gpt-5-3-codex":
      basePrompt = buildGpt53CodexPrompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
    case "gpt":
    default:
      basePrompt = buildGptPrompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
  }

  return basePrompt;
}

export function createHephaestusAgent(
  model: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[],
  availableCategories?: AvailableCategory[],
  useTaskSystem = false,
): AgentConfig {
  const tools = availableToolNames ? categorizeTools(availableToolNames) : [];

  const prompt = buildDynamicHephaestusPrompt({
    model,
    availableAgents,
    availableTools: tools,
    availableSkills,
    availableCategories,
    useTaskSystem,
  })
    + "\n\n"
    + ENGINEERING_MICRO_KERNEL_CAPABILITY + "\n\n"
    + ENGINEERING_SKILL_ROUTER_CAPABILITY + "\n\n"
    + INFORMATION_INTEGRITY_CAPABILITY + "\n\n"
    + PROMPT_LAYERING_PROTOCOL_CAPABILITY + "\n\n"
    + ENGINEERING_EXECUTION_CAPABILITY + "\n\n"
    + AUTONOMOUS_ACCEPTANCE_WORKFLOW_CAPABILITY + "\n\n"
    + HEPHAESTUS_EXECUTION_APPEND;
  const promptWithIdentity =
    buildAgentIdentitySection(
      "Hephaestus",
      "Autonomous deep engineering worker from OpenAgent Labforge focused on thorough implementation quality",
    ) + "\n" + prompt

  return {
    description:
      "Autonomous Deep Worker - goal-oriented execution with GPT Codex. Explores thoroughly before acting, uses explore/librarian agents for comprehensive context, completes tasks end-to-end. Inspired by AmpCode deep mode. (Hephaestus - OhMyOpenCode)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt: promptWithIdentity,
    color: "#D97706",
    permission: {
      question: "allow",
      call_omo_agent: "deny",
    } as AgentConfig["permission"],
    reasoningEffort: "medium",
  };
}
createHephaestusAgent.mode = MODE;

export const hephaestusPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Hephaestus",
  triggers: [
    {
      domain: "Autonomous deep work",
      trigger: "End-to-end task completion without premature stopping",
    },
    {
      domain: "Complex implementation",
      trigger: "Multi-step implementation requiring thorough exploration",
    },
  ],
  useWhen: [
    "Task requires deep exploration before implementation",
    "User wants autonomous end-to-end completion",
    "Complex multi-file changes needed",
  ],
  avoidWhen: [
    "Simple single-step tasks",
    "Tasks requiring user confirmation at each step",
    "When orchestration across multiple agents is needed (use Atlas)",
  ],
  keyTrigger: "Complex implementation task requiring autonomous deep work",
};
