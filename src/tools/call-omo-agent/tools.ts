import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import { ALLOWED_AGENTS, CALL_OMO_AGENT_DESCRIPTION } from "./constants"
import type {
  AllowedAgentType,
  CallOmoAgentArgs,
  CallOmoAgentToolOptions,
  ToolContextWithMetadata,
} from "./types"
import type { BackgroundManager } from "../../features/background-agent"
import { log } from "../../shared"
import {
  executeBackgroundTask,
  executeSyncContinuation,
  executeSyncTask,
  resolveParentContext,
  resolveSubagentExecution,
} from "../delegate-task/executor"

export function createCallOmoAgent(
  ctx: PluginInput,
  backgroundManager: BackgroundManager,
  disabledAgents: string[] = [],
  options: CallOmoAgentToolOptions,
): ToolDefinition {
  const agentDescriptions = ALLOWED_AGENTS.map(
    (name) => `- ${name}: Specialized agent for ${name} tasks`
  ).join("\n")
  const description = CALL_OMO_AGENT_DESCRIPTION.replace("{agents}", agentDescriptions)

  return tool({
    description,
    args: {
      description: tool.schema.string().describe("A short (3-5 words) description of the task"),
      prompt: tool.schema.string().describe("The task for the agent to perform"),
      subagent_type: tool.schema
        .string()
        .describe("The type of specialized agent to use for this task"),
      run_in_background: tool.schema
        .boolean()
        .describe("REQUIRED. true: run asynchronously (use background_output to get results), false: run synchronously and wait for completion"),
      session_id: tool.schema.string().describe("Existing Task session to continue").optional(),
    },
    async execute(args: CallOmoAgentArgs, toolContext) {
      const toolCtx = toolContext as ToolContextWithMetadata
      log(`[call_omo_agent] Starting with agent: ${args.subagent_type}, background: ${args.run_in_background}`)

      // Case-insensitive agent validation - allows "Explore", "EXPLORE", "explore" etc.
      if (
        !ALLOWED_AGENTS.some(
          (name) => name.toLowerCase() === args.subagent_type.toLowerCase(),
        )
      ) {
        return `Error: Invalid agent type "${args.subagent_type}". Only ${ALLOWED_AGENTS.join(", ")} are allowed.`
      }

      const normalizedAgent = args.subagent_type.toLowerCase() as AllowedAgentType
      args = { ...args, subagent_type: normalizedAgent }

      // Check if agent is disabled
      if (disabledAgents.some((disabled) => disabled.toLowerCase() === normalizedAgent)) {
        return `Error: Agent "${normalizedAgent}" is disabled via disabled_agents configuration. Remove it from disabled_agents in your openagent-labforge.json to use it.`
      }

      if (args.run_in_background) {
        if (args.session_id) {
          return `Error: session_id is not supported in background mode. Use run_in_background=false to continue an existing session.`
        }

        const delegateArgs = {
          ...args,
          load_skills: [],
        }
        const parentContext = await resolveParentContext(toolCtx, ctx.client)
        const inheritedModel = parentContext.model
          ? `${parentContext.model.providerID}/${parentContext.model.modelID}`
          : undefined
        const resolution = await resolveSubagentExecution(
          delegateArgs,
          {
            manager: backgroundManager,
            client: ctx.client,
            directory: options.directory,
            agentOverrides: options.agentOverrides,
            onSyncSessionCreated: options.onSyncSessionCreated,
            syncPollTimeoutMs: options.syncPollTimeoutMs,
          },
          parentContext.agent,
          "",
          inheritedModel,
        )
        if (resolution.error) {
          return resolution.error
        }

        return executeBackgroundTask(
          delegateArgs,
          toolCtx,
          {
            manager: backgroundManager,
            client: ctx.client,
            directory: options.directory,
            agentOverrides: options.agentOverrides,
            onSyncSessionCreated: options.onSyncSessionCreated,
            syncPollTimeoutMs: options.syncPollTimeoutMs,
          },
          parentContext,
          resolution.agentToUse,
          resolution.categoryModel,
          undefined,
          resolution.fallbackChain,
        )
      }

      const delegateArgs = {
        ...args,
        load_skills: [],
      }

      if (delegateArgs.session_id) {
        return executeSyncContinuation(delegateArgs, toolCtx, {
          manager: backgroundManager,
          client: ctx.client,
          directory: options.directory,
          agentOverrides: options.agentOverrides,
          onSyncSessionCreated: options.onSyncSessionCreated,
          syncPollTimeoutMs: options.syncPollTimeoutMs,
        })
      }

      const parentContext = await resolveParentContext(toolCtx, ctx.client)
      const inheritedModel = parentContext.model
        ? `${parentContext.model.providerID}/${parentContext.model.modelID}`
        : undefined
      const resolution = await resolveSubagentExecution(
        delegateArgs,
        {
          manager: backgroundManager,
          client: ctx.client,
          directory: options.directory,
          agentOverrides: options.agentOverrides,
          onSyncSessionCreated: options.onSyncSessionCreated,
          syncPollTimeoutMs: options.syncPollTimeoutMs,
        },
        parentContext.agent,
        "",
        inheritedModel,
      )
      if (resolution.error) {
        return resolution.error
      }

      return executeSyncTask(
        delegateArgs,
        toolCtx,
        {
          manager: backgroundManager,
          client: ctx.client,
          directory: options.directory,
          agentOverrides: options.agentOverrides,
          onSyncSessionCreated: options.onSyncSessionCreated,
          syncPollTimeoutMs: options.syncPollTimeoutMs,
        },
        parentContext,
        resolution.agentToUse,
        resolution.categoryModel,
        undefined,
        undefined,
        resolution.fallbackChain,
      )
    },
  })
}
