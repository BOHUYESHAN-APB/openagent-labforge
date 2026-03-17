import { createWebsearchConfig } from "./websearch"
import { context7 } from "./context7"
import { grep_app } from "./grep-app"
import {
  browser_puppeteer,
  paper_search_mcp,
} from "./extended"
import type { OhMyOpenCodeConfig } from "../config/schema"

export { McpNameSchema, type McpName } from "./types"

type RemoteMcpConfig = {
  type: "remote"
  url: string
  enabled: boolean
  headers?: Record<string, string>
  oauth?: false
}

type LocalMcpConfig = {
  type: "local"
  command: string[]
  enabled: boolean
  env?: Record<string, string>
}

type BuiltinMcpConfig = RemoteMcpConfig | LocalMcpConfig

const EXTENDED_BUILTIN_MCPS: Record<string, BuiltinMcpConfig> = {
  browser_puppeteer,
  paper_search_mcp,
}

export function createBuiltinMcps(disabledMcps: string[] = [], config?: OhMyOpenCodeConfig) {
  const mcps: Record<string, BuiltinMcpConfig> = {}
  const disabledSet = new Set(disabledMcps)

  if (!disabledSet.has("websearch")) {
    mcps.websearch = createWebsearchConfig(config?.websearch)
  }

  if (!disabledSet.has("context7")) {
    mcps.context7 = context7
  }

  if (!disabledSet.has("grep_app")) {
    mcps.grep_app = grep_app
  }

  for (const [name, builtin] of Object.entries(EXTENDED_BUILTIN_MCPS)) {
    if (disabledSet.has(name)) continue
    const forcedEnabled = config?.mcp_policy?.enable?.includes(name) ?? false
    mcps[name] = {
      ...builtin,
      enabled: forcedEnabled ? true : builtin.enabled,
    }
  }

  return mcps
}
