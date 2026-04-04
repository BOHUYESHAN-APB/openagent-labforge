import type { BackgroundManager } from "./features/background-agent"
import type { SkillMcpManager } from "./features/skill-mcp-manager"

import { log } from "./shared"
import { lspManager } from "./tools"

type DisposeHook = () => void | Promise<void>

type CreatePluginDisposeArgs = {
  backgroundManager: BackgroundManager
  skillMcpManager: SkillMcpManager
  lspManager: Pick<typeof lspManager, "stopAll">
  disposeHooks?: DisposeHook[]
}

export function createPluginDispose(args: CreatePluginDisposeArgs): () => Promise<void> {
  const {
    backgroundManager,
    skillMcpManager,
    lspManager,
    disposeHooks = [],
  } = args

  let disposed = false

  return async (): Promise<void> => {
    if (disposed) {
      return
    }
    disposed = true

    const errors: unknown[] = []

    try {
      backgroundManager.shutdown()
    } catch (error) {
      errors.push(error)
      log("[plugin-dispose] background manager shutdown failed", { error })
    }

    try {
      await skillMcpManager.disconnectAll()
    } catch (error) {
      errors.push(error)
      log("[plugin-dispose] skill MCP disconnect failed", { error })
    }

    try {
      await lspManager.stopAll()
    } catch (error) {
      errors.push(error)
      log("[plugin-dispose] LSP manager stop failed", { error })
    }

    for (const disposeHook of disposeHooks) {
      try {
        await disposeHook()
      } catch (error) {
        errors.push(error)
        log("[plugin-dispose] dispose hook failed", { error })
      }
    }

    if (errors.length > 0) {
      throw errors[0] instanceof Error
        ? errors[0]
        : new Error("Plugin dispose failed")
    }
  }
}
