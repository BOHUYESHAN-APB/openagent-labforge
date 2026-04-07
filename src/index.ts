import { initConfigContext } from "./cli/config-manager/config-context"
import type { Plugin } from "@opencode-ai/plugin"

import type { HookName } from "./config"

import { createHooks } from "./create-hooks"
import { createManagers } from "./create-managers"
import { createTools } from "./create-tools"
import { createPluginInterface } from "./plugin-interface"
import { createPluginDispose } from "./plugin-dispose"
import { createCompactingHandler } from "./plugin/compacting-handler"

import { loadPluginConfig } from "./plugin-config"
import { createModelCacheState } from "./plugin-state"
import { createFirstMessageVariantGate } from "./shared/first-message-variant"
import { injectServerAuthIntoClient, log } from "./shared"
import {
  resolveAgentDisplayLanguage,
  setAgentDisplayLanguage,
} from "./shared/agent-display-names"
import { applyModelGovernor } from "./features/model-governor"
import { lspManager, startTmuxCheck } from "./tools"

type DisposeHookCarrier = {
  dispose?: () => void | Promise<void>
}

let activePluginDispose: (() => Promise<void>) | undefined

const OpenAgentLabforgePlugin: Plugin = async (ctx) => {
  await activePluginDispose?.()

  // Initialize config context for plugin runtime (prevents warnings from hooks)
  initConfigContext("opencode", null)
  log("[OpenAgentLabforgePlugin] ENTRY - plugin loading", {
    directory: ctx.directory,
  })

  injectServerAuthIntoClient(ctx.client)
  startTmuxCheck()

  const pluginConfig = loadPluginConfig(ctx.directory, ctx)

  // Set agent display names language early so config/agents/commands share consistent labels.
  const resolvedLanguage = resolveAgentDisplayLanguage(pluginConfig.i18n?.language)
  setAgentDisplayLanguage(resolvedLanguage)
  log("[i18n] agent display language", {
    requested: pluginConfig.i18n?.language,
    resolved: resolvedLanguage,
  })

  // AUTO mode foundation: discover available models and write a recommendation report.
  applyModelGovernor(pluginConfig)
  const disabledHooks = new Set(pluginConfig.disabled_hooks ?? [])

  const isHookEnabled = (hookName: HookName): boolean => !disabledHooks.has(hookName)
  const safeHookEnabled = pluginConfig.experimental?.safe_hook_creation ?? true

  const firstMessageVariantGate = createFirstMessageVariantGate()

  const tmuxConfig = {
    enabled: pluginConfig.tmux?.enabled ?? false,
    layout: pluginConfig.tmux?.layout ?? "main-vertical",
    main_pane_size: pluginConfig.tmux?.main_pane_size ?? 60,
    main_pane_min_width: pluginConfig.tmux?.main_pane_min_width ?? 120,
    agent_pane_min_width: pluginConfig.tmux?.agent_pane_min_width ?? 40,
  }

  const modelCacheState = createModelCacheState()

  const managers = createManagers({
    ctx,
    pluginConfig,
    tmuxConfig,
    modelCacheState,
    backgroundNotificationHookEnabled: isHookEnabled("background-notification"),
  })

  const toolsResult = await createTools({
    ctx,
    pluginConfig,
    managers,
  })

  const hooks = createHooks({
    ctx,
    pluginConfig,
    modelCacheState,
    backgroundManager: managers.backgroundManager,
    isHookEnabled,
    safeHookEnabled,
    getMergedSkills: toolsResult.getMergedSkills,
    availableSkills: toolsResult.availableSkills,
  })

  const pluginInterface = createPluginInterface({
    ctx,
    pluginConfig,
    firstMessageVariantGate,
    managers,
    hooks,
    tools: toolsResult.filteredTools,
  })

  const disposeHooks = Object.values(hooks as Record<string, unknown>).flatMap((value) => {
    if (typeof value !== "object" || value === null) {
      return []
    }

    const maybeDisposable = value as DisposeHookCarrier
    return typeof maybeDisposable.dispose === "function"
      ? [maybeDisposable.dispose.bind(maybeDisposable)]
      : []
  })

  activePluginDispose = createPluginDispose({
    backgroundManager: managers.backgroundManager,
    skillMcpManager: managers.skillMcpManager,
    lspManager,
    disposeHooks,
  })

  const compactingHandler = createCompactingHandler({
    compactionTodoPreserver: hooks.compactionTodoPreserver ?? undefined,
    claudeCodeHooks: hooks.claudeCodeHooks ?? undefined,
    compactionContextInjector: hooks.compactionContextInjector ?? undefined,
  })

  return {
    ...pluginInterface,
    dispose: async () => {
      await activePluginDispose?.()
      activePluginDispose = undefined
    },

    "experimental.session.compacting": async (
      _input: { sessionID: string },
      output: { context: string[] },
    ): Promise<void> => {
      await compactingHandler(_input, output)
    },
  }
}

export default OpenAgentLabforgePlugin

export type {
  OhMyOpenCodeConfig,
  AgentName,
  AgentOverrideConfig,
  AgentOverrides,
  McpName,
  HookName,
  BuiltinCommandName,
} from "./config"

// NOTE: Do NOT export functions from main index.ts!
// OpenCode treats ALL exports as plugin instances and calls them.
// Config error utilities are available via "./shared/config-errors" for internal use only.
export type { ConfigLoadError } from "./shared/config-errors"
