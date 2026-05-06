import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { ALLOWED_AGENTS, CALL_OMO_AGENT_DESCRIPTION } from "./constants"
import type { CallOmoAgentArgs, ToolContextWithMetadata } from "./types"
import type { BackgroundManager } from "../../features/background-agent"
import type { DelegatedModelConfig } from "../../shared/model-resolution-types"
import type { FallbackEntry } from "../../shared/model-requirements"
import type { AgentOverrides } from "../../config/schema/agent-overrides"
import { AGENT_MODEL_REQUIREMENTS } from "../../shared/model-requirements"
import { getAgentConfigKey, stripInvisibleAgentCharacters } from "../../shared/agent-display-names"
import { parseModelString } from "../delegate-task/model-string-parser"
import { log } from "../../shared"
import { executeBackground } from "./background-executor"
import { executeSync } from "./sync-executor"
import { createOrGetSession } from "./session-creator"
import { processMessages } from "./message-processor"
import { waitForCompletion } from "./completion-poller"

function createSyncExecutorDeps() {
  return {
    createOrGetSession,
    waitForCompletion,
    processMessages,
    setSessionFallbackChain: (_sessionID: string, _fallbackChain: FallbackEntry[] | undefined) => {
      // fallback chain set via caller
    },
    clearSessionFallbackChain: (_sessionID: string) => {
      // fallback chain cleared via caller
    },
  }
}

function resolveModelAndFallbackChain(args: {
  subagentType: string
  agentOverrides?: AgentOverrides
}): { model: DelegatedModelConfig | undefined; fallbackChain: FallbackEntry[] | undefined } {
  const { subagentType, agentOverrides } = args
  const agentConfigKey = getAgentConfigKey(subagentType)
  const agentRequirement = AGENT_MODEL_REQUIREMENTS[agentConfigKey]

  const agentOverride = agentOverrides?.[agentConfigKey as keyof AgentOverrides]
    ?? (agentOverrides
      ? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentConfigKey)?.[1]
      : undefined)

  let model: DelegatedModelConfig | undefined
  if (agentOverride?.model) {
    const normalized = parseModelString(agentOverride.model)
    if (normalized) {
      model = agentOverride.variant ? { ...normalized, variant: agentOverride.variant } : normalized
      log("[call_omo_agent] Resolved model override from agent config", {
        agent: subagentType,
        model: agentOverride.model,
        variant: agentOverride.variant,
      })
    }
  }

  return {
    model,
    fallbackChain: agentRequirement?.fallbackChain,
  }
}

export function createCallOmoAgent(
  ctx: PluginInput,
  backgroundManager: BackgroundManager,
  disabledAgents: string[] = [],
  agentOverrides?: AgentOverrides,
): ToolDefinition {
  const agentDescriptions = ALLOWED_AGENTS.map(
    (name) => `- ${name}: Specialized agent for ${name} tasks`,
  ).join("\n");
  const description = CALL_OMO_AGENT_DESCRIPTION.replace(
    "{agents}",
    agentDescriptions,
  );

  return tool({
    description,
    args: {
      description: tool.schema
        .string()
        .describe("A short (3-5 words) description of the task"),
      prompt: tool.schema
        .string()
        .describe("The task for the agent to perform"),
      subagent_type: tool.schema
        .string()
        .describe(
          "The agent to invoke. Supports built-in agents registered at runtime.",
        ),
      run_in_background: tool.schema
        .boolean()
        .describe(
          "REQUIRED. true: run asynchronously (use background_output to get results), false: run synchronously and wait for completion",
        ),
      session_id: tool.schema
        .string()
        .describe("Existing Task session to continue")
        .optional(),
    },
    async execute(args: CallOmoAgentArgs, toolContext) {
      const toolCtx = toolContext as ToolContextWithMetadata;
      log(
        `[call_omo_agent] Starting with agent: ${args.subagent_type}, background: ${args.run_in_background}`,
      );

      // Strip ZWSP and case-insensitive agent validation
      const strippedAgentType = stripInvisibleAgentCharacters(args.subagent_type)
      if (
        !ALLOWED_AGENTS.some(
          (name) => name.toLowerCase() === strippedAgentType.toLowerCase(),
        )
      ) {
        return `Error: Invalid agent type "${args.subagent_type}". Only ${ALLOWED_AGENTS.join(", ")} are allowed.`;
      }

      const normalizedAgent = strippedAgentType.toLowerCase();
      args = { ...args, subagent_type: normalizedAgent };

      // Check if agent is disabled
      if (disabledAgents.some((disabled) => stripInvisibleAgentCharacters(disabled).toLowerCase() === normalizedAgent)) {
        return `Error: Agent "${normalizedAgent}" is disabled via disabled_agents configuration. Remove it from disabled_agents in your openagent-labforge.json to use it.`
      }

      const { model: resolvedModel, fallbackChain } = resolveModelAndFallbackChain({
        subagentType: args.subagent_type,
        agentOverrides,
      })

      if (args.run_in_background) {
        if (args.session_id) {
          return `Error: session_id is not supported in background mode. Use run_in_background=false to continue an existing session.`;
        }
        return await executeBackground(args, toolCtx, backgroundManager, ctx.client, fallbackChain, resolvedModel)
      }

      if (!args.session_id) {
        try {
          return await executeSync(
            args,
            toolCtx,
            ctx,
            createSyncExecutorDeps(),
            fallbackChain,
            undefined,
            resolvedModel,
          )
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      }

      return await executeSync(
        args,
        toolCtx,
        ctx,
        createSyncExecutorDeps(),
        fallbackChain,
        undefined,
        resolvedModel,
      )
    },
  });
}
