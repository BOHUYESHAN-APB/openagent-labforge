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
  command: ["uvx", "--native-tls", "arxiv-mcp-server"],
  enabled: false,
}

export const browser_puppeteer: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@modelcontextprotocol/server-puppeteer"],
  enabled: true,
}

export const fetch_browser: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "@TheSethRose/Fetch-Browser"],
  enabled: false,
}

export const deepwiki_mcp: RemoteMcpConfig = {
  type: "remote",
  url: "https://mcp.deepwiki.com/mcp",
  enabled: false,
  oauth: false,
}

export const bing_cn_mcp: LocalMcpConfig = {
  type: "local",
  command: ["npx", "-y", "bing-cn-mcp-server"],
  enabled: false,
}

export const paper_search_mcp: LocalMcpConfig = {
  type: "local",
  // NOTE:
  // `paper-search-mcp` currently does not expose a console script entrypoint.
  // Run it via module entrypoint instead.
  // NOTE:
  // Some Windows environments intercept TLS and break uv's bundled cert store.
  // `--native-tls` uses the system certificate store, avoiding "UnknownIssuer".
  command: [
    "uvx",
    "--native-tls",
    "--from",
    "paper-search-mcp",
    "python",
    "-m",
    "paper_search_mcp.server",
  ],
  enabled: true,
}

export const semantic_scholar_fastmcp: LocalMcpConfig = {
  type: "local",
  command: ["uvx", "--native-tls", "semantic-scholar-fastmcp-mcp-server"],
  enabled: false,
}
