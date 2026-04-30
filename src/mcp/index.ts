/**
 * MCP (Model Context Protocol) Server Registry
 *
 * Built-in MCP servers for OpenAgent LabForge.
 * Based on OLD MCP implementations (11 total).
 */

export type McpConfig = {
  type: "remote" | "local"
  url?: string
  command?: string[]
  enabled: boolean
  environment?: Record<string, string>
  timeout?: number
}

const LOCAL_MCP_STARTUP_TIMEOUT_MS = 90_000

// ==========================================
// Core MCPs (3, always enabled)
// ==========================================

export const context7: McpConfig = {
  type: "remote",
  url: "https://mcp.context7.com/mcp",
  enabled: true,
}

export const grep_app: McpConfig = {
  type: "remote",
  url: "https://mcp.grep.app",
  enabled: true,
}

export const websearch: McpConfig = {
  type: "remote",
  url: "https://mcp.exa.ai",
  enabled: true,
}

// ==========================================
// Extended MCPs (8, disabled by default)
// ==========================================

export const arxiv_mcp: McpConfig = {
  type: "local",
  command: ["uvx", "arxiv-mcp-server"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const browser_puppeteer: McpConfig = {
  type: "local",
  command: ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const chrome_devtools_mcp: McpConfig = {
  type: "local",
  command: ["npx", "-y", "chrome-devtools-mcp@latest"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const fetch_browser: McpConfig = {
  type: "local",
  command: ["npx", "-y", "@TheSethRose/Fetch-Browser"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const deepwiki_mcp: McpConfig = {
  type: "remote",
  url: "https://mcp.deepwiki.com/mcp",
  enabled: false,
}

export const open_websearch_mcp: McpConfig = {
  type: "local",
  command: ["npx", "-y", "open-websearch@2.0.0"],
  enabled: false,
  environment: {
    MODE: "stdio",
    DEFAULT_SEARCH_ENGINE: "duckduckgo",
    ALLOWED_SEARCH_ENGINES: "duckduckgo,bing,exa,brave,baidu,csdn,juejin",
    SEARCH_MODE: "request",
  },
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const paper_search_mcp: McpConfig = {
  type: "local",
  command: ["uvx", "--native-tls", "--from", "paper-search-mcp", "python", "-m", "paper_search_mcp.server"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const semantic_scholar_fastmcp: McpConfig = {
  type: "local",
  command: ["uvx", "--native-tls", "--from", "semantic-scholar-fastmcp<3.0", "semantic-scholar-fastmcp", "--no-http"],
  enabled: true,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

/**
 * Create all built-in MCP configurations
 */
export function createBuiltinMcps(): Record<string, McpConfig> {
  return {
    // Core (3)
    context7,
    grep_app,
    websearch,
    // Extended (8)
    arxiv_mcp,
    browser_puppeteer,
    chrome_devtools_mcp,
    fetch_browser,
    deepwiki_mcp,
    open_websearch_mcp,
    paper_search_mcp,
    semantic_scholar_fastmcp,
  }
}
