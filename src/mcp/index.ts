import { createWebsearchConfig } from "./websearch"
import { context7 } from "./context7"
import { grep_app } from "./grep-app"
import {
  arxiv_mcp,
  browser_puppeteer,
  chrome_devtools_mcp,
  deepwiki_mcp,
  fetch_browser,
  open_websearch_mcp,
  paper_search_mcp,
  semantic_scholar_fastmcp,
} from "./extended"
import type { OhMyOpenCodeConfig } from "../config/schema"
import { normalizeLocalMcpCommand } from "../shared"

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
  environment?: Record<string, string>
  timeout?: number
}

type BuiltinMcpConfig = RemoteMcpConfig | LocalMcpConfig

const EXTENDED_BUILTIN_MCPS: Record<string, BuiltinMcpConfig> = {
  arxiv_mcp,
  browser_puppeteer,
  "chrome-devtools-mcp": chrome_devtools_mcp,
  fetch_browser,
  deepwiki_mcp,
  open_websearch_mcp,
  paper_search_mcp,
  semantic_scholar_fastmcp,
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
    const normalizedBuiltin =
      builtin.type === "local"
        ? {
            ...builtin,
            command: normalizeLocalMcpCommand(builtin.command),
          }
        : builtin

    mcps[name] = {
      ...normalizedBuiltin,
      enabled: forcedEnabled ? true : builtin.enabled,
    }
  }

  return mcps
}
