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
  env?: Record<string, string>
}

export type BuiltinMcpConfig = RemoteMcpConfig | LocalMcpConfig

export const arxiv_mcp: LocalMcpConfig = {
  type: "local",
  command: ["uvx", "arxiv-mcp-server"],
  enabled: true,
}

export const browser_puppeteer: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: true,
}

export const fetch_browser: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@TheSethRose/Fetch-Browser"],
  enabled: true,
}

export const deepwiki_mcp: RemoteMcpConfig = {
  type: "remote",
  url: "https://mcp.deepwiki.com/mcp",
  enabled: true,
  oauth: false,
}

export const bing_cn_mcp: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "bing-cn-mcp-server"],
  enabled: true,
}

export const paper_search_mcp: LocalMcpConfig = {
  type: "local",
  // NOTE:
  // `paper-search-mcp` currently does not expose a console script entrypoint.
  // Run it via module entrypoint instead.
  command: ["uvx", "--from", "paper-search-mcp", "python", "-m", "paper_search_mcp.server"],
  enabled: true,
}

export const semantic_scholar_fastmcp: LocalMcpConfig = {
  type: "local",
  command: ["uvx", "semantic-scholar-fastmcp-mcp-server"],
  enabled: true,
}
