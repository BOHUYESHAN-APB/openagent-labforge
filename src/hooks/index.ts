/**
 * Hooks Index
 *
 * Central registry for all hooks.
 * Exports hook factories and the hook composition function.
 */

import type { PluginInput } from "@opencode-ai/plugin"
import { createKeywordDetectorHook } from "./keyword-detector"
import { createTodoContinuationEnforcer } from "./todo-continuation-enforcer"
import { createStartWorkHook } from "./start-work"
import { createSessionRecoveryHook } from "./session-recovery"
import { createContextWindowMonitorHook } from "./context-window-monitor"

// ==========================================
// Types
// ==========================================

export type HookConfig = {
  enabled: boolean
  options?: Record<string, unknown>
}

export type HooksConfig = {
  "keyword-detector"?: HookConfig
  "todo-continuation-enforcer"?: HookConfig
  "start-work"?: HookConfig
  "session-recovery"?: HookConfig
  "context-window-monitor"?: HookConfig
}

export type CreatedHooks = {
  keywordDetector: ReturnType<typeof createKeywordDetectorHook> | null
  todoContinuationEnforcer: ReturnType<typeof createTodoContinuationEnforcer> | null
  startWork: ReturnType<typeof createStartWorkHook> | null
  sessionRecovery: ReturnType<typeof createSessionRecoveryHook> | null
  contextWindowMonitor: ReturnType<typeof createContextWindowMonitorHook> | null
}

// ==========================================
// Hook Composition
// ==========================================

export function createHooks(args: {
  ctx: PluginInput
  config?: HooksConfig
}): CreatedHooks {
  const { ctx, config } = args

  // Check if hooks are enabled
  const keywordDetectorEnabled = config?.["keyword-detector"]?.enabled ?? true
  const todoContinuationEnabled = config?.["todo-continuation-enforcer"]?.enabled ?? true
  const startWorkEnabled = config?.["start-work"]?.enabled ?? true
  const sessionRecoveryEnabled = config?.["session-recovery"]?.enabled ?? true
  const contextWindowMonitorEnabled = config?.["context-window-monitor"]?.enabled ?? true

  // Create hooks
  const keywordDetector = keywordDetectorEnabled
    ? createKeywordDetectorHook(ctx)
    : null

  const todoContinuationEnforcer = todoContinuationEnabled
    ? createTodoContinuationEnforcer(ctx, {
        isContinuationStopped: (_sessionID: string) => {
          // Check if continuation is stopped for this session
          // This is a placeholder - implement actual logic
          return false
        },
      })
    : null

  const startWork = startWorkEnabled
    ? createStartWorkHook(ctx)
    : null

  const sessionRecovery = sessionRecoveryEnabled
    ? createSessionRecoveryHook(ctx)
    : null

  const contextWindowMonitor = contextWindowMonitorEnabled
    ? createContextWindowMonitorHook(ctx)
    : null

  return {
    keywordDetector,
    todoContinuationEnforcer,
    startWork,
    sessionRecovery,
    contextWindowMonitor,
  }
}

// ==========================================
// Exports
// ==========================================

export { createKeywordDetectorHook } from "./keyword-detector"
export { createTodoContinuationEnforcer } from "./todo-continuation-enforcer"
export { createStartWorkHook } from "./start-work"
export { createSessionRecoveryHook } from "./session-recovery"
export { createContextWindowMonitorHook } from "./context-window-monitor"

// Re-export types
export type { TodoContinuationEnforcer } from "./todo-continuation-enforcer"
export type { SessionRecoveryHook } from "./session-recovery"
export type { ContextWindowMonitorHook } from "./context-window-monitor"
