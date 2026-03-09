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

export function createBuiltinMcps(disabledMcps: string[] = [], config?: OhMyOpenCodeConfig) {
  const mcps: Record<string, BuiltinMcpConfig> = {}

  if (!disabledMcps.includes("websearch")) {
    mcps.websearch = createWebsearchConfig(config?.websearch)
  }

  if (!disabledMcps.includes("context7")) {
    mcps.context7 = context7
  }

  if (!disabledMcps.includes("grep_app")) {
    mcps.grep_app = grep_app
  }

  if (!disabledMcps.includes("arxiv_mcp")) {
    mcps.arxiv_mcp = arxiv_mcp
  }

  if (!disabledMcps.includes("browser_puppeteer")) {
    mcps.browser_puppeteer = browser_puppeteer
  }

  if (!disabledMcps.includes("fetch_browser")) {
    mcps.fetch_browser = fetch_browser
  }

  if (!disabledMcps.includes("deepwiki_mcp")) {
    mcps.deepwiki_mcp = deepwiki_mcp
  }

  if (!disabledMcps.includes("bing_cn_mcp")) {
    mcps.bing_cn_mcp = bing_cn_mcp
  }

  if (!disabledMcps.includes("paper_search_mcp")) {
    mcps.paper_search_mcp = paper_search_mcp
  }

  if (!disabledMcps.includes("semantic_scholar_fastmcp")) {
    mcps.semantic_scholar_fastmcp = semantic_scholar_fastmcp
  }

  return mcps
}
