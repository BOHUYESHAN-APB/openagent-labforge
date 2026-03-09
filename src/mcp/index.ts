import { createWebsearchConfig } from "./websearch"
import { context7 } from "./context7"
import { grep_app } from "./grep-app"
import {
  arxiv_mcp,
  bing_cn_mcp,
  browser_puppeteer,
  deepwiki_mcp,
  fetch_browser,
  paper_search_mcp,
  semantic_scholar_fastmcp,
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
  arxiv_mcp,
  browser_puppeteer,
  fetch_browser,
  deepwiki_mcp,
  bing_cn_mcp,
  paper_search_mcp,
  semantic_scholar_fastmcp,
}

function getOptInExtendedMcpNames(config?: OhMyOpenCodeConfig): string[] {
  const enabledFromPolicy = config?.mcp_policy?.enable ?? []
  return enabledFromPolicy.filter((name) => name in EXTENDED_BUILTIN_MCPS)
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

  for (const name of getOptInExtendedMcpNames(config)) {
    if (disabledSet.has(name)) continue
    mcps[name] = EXTENDED_BUILTIN_MCPS[name]
  }

  return mcps
}
