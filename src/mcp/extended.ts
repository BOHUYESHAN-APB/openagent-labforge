export type RemoteMcpConfig = {
  type: "remote"
  url: string
  enabled: boolean
  headers?: Record<string, string>
  oauth?: false
}

export type LocalMcpConfig = {
  type: "local"
  command: string[]
  enabled: boolean
  environment?: Record<string, string>
  timeout?: number
}

export type BuiltinMcpConfig = RemoteMcpConfig | LocalMcpConfig

const LOCAL_MCP_STARTUP_TIMEOUT_MS = 90_000

export const arxiv_mcp: LocalMcpConfig = {
  type: "local",
  command: ["uvx", "arxiv-mcp-server"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const browser_puppeteer: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const fetch_browser: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@TheSethRose/Fetch-Browser"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const deepwiki_mcp: RemoteMcpConfig = {
  type: "remote",
  url: "https://mcp.deepwiki.com/mcp",
  enabled: false,
  oauth: false,
}

export const open_websearch_mcp: LocalMcpConfig = {
  type: "local",
  // NOTE:
  // `open-websearch` is a multi-engine, no-key search MCP with stdio support.
  // We force stdio mode here and default to DuckDuckGo to avoid Bing-only fragility.
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

export const paper_search_mcp: LocalMcpConfig = {
  type: "local",
  // NOTE:
  // The documented console-script launcher has proven unreliable in this
  // Windows/OpenCode environment. Use the module entrypoint and enable
  // native TLS for uv's package fetch path.
  command: ["uvx", "--native-tls", "--from", "paper-search-mcp", "python", "-m", "paper_search_mcp.server"],
  enabled: true,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}

export const semantic_scholar_fastmcp: LocalMcpConfig = {
  type: "local",
  command: ["uvx", "semantic-scholar-fastmcp-mcp-server"],
  enabled: false,
  timeout: LOCAL_MCP_STARTUP_TIMEOUT_MS,
}
