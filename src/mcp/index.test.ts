import { describe, expect, test } from "bun:test"
import { createBuiltinMcps } from "./index"

describe("createBuiltinMcps", () => {
  test("should return all MCPs with paper search enabled by default", () => {
    const disabledMcps: string[] = []

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("arxiv_mcp")
    expect(result).toHaveProperty("browser_puppeteer")
    expect(result).toHaveProperty("chrome-devtools-mcp")
    expect(result).toHaveProperty("fetch_browser")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(result).toHaveProperty("open_websearch_mcp")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(result).toHaveProperty("semantic_scholar_fastmcp")
    expect(result.arxiv_mcp?.enabled).toBe(false)
    expect(result.browser_puppeteer?.enabled).toBe(false)
    expect(result["chrome-devtools-mcp"]?.enabled).toBe(false)
    expect(result.fetch_browser?.enabled).toBe(false)
    expect(result.deepwiki_mcp?.enabled).toBe(false)
    expect(result.open_websearch_mcp?.enabled).toBe(false)
    expect(result.paper_search_mcp?.enabled).toBe(true)
    expect(result.semantic_scholar_fastmcp?.enabled).toBe(false)
    expect(result.open_websearch_mcp).toMatchObject({
      type: "local",
      timeout: 90000,
      environment: {
        MODE: "stdio",
        DEFAULT_SEARCH_ENGINE: "duckduckgo",
        ALLOWED_SEARCH_ENGINES: "duckduckgo,bing,exa,brave,baidu,csdn,juejin",
        SEARCH_MODE: "request",
      },
    })

    if (process.platform === "win32") {
      expect(result.open_websearch_mcp).toMatchObject({
        type: "local",
        command: ["cmd", "/c", "npx", "-y", "open-websearch@2.0.0"],
      })
    } else {
      expect(result.open_websearch_mcp).toMatchObject({
        type: "local",
        command: ["npx", "-y", "open-websearch@2.0.0"],
      })
    }

    expect(result.paper_search_mcp).toMatchObject({
      type: "local",
      command: ["uvx", "--native-tls", "--from", "paper-search-mcp", "python", "-m", "paper_search_mcp.server"],
      timeout: 90000,
      enabled: true,
    })

    expect(result.semantic_scholar_fastmcp).toMatchObject({
      type: "local",
      command: ["uvx", "--native-tls", "semantic-scholar-fastmcp"],
      timeout: 90000,
      enabled: false,
    })

    expect(Object.keys(result)).toHaveLength(11)
  })

  test("should filter out disabled built-in MCPs", () => {
    const disabledMcps = ["context7"]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(10)
  })

  test("should filter out all built-in MCPs when all disabled", () => {
    const disabledMcps = [
      "websearch",
      "context7",
      "grep_app",
      "arxiv_mcp",
      "browser_puppeteer",
      "chrome-devtools-mcp",
      "fetch_browser",
      "deepwiki_mcp",
      "open_websearch_mcp",
      "paper_search_mcp",
      "semantic_scholar_fastmcp",
    ]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).not.toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).not.toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(0)
  })

  test("should ignore custom MCP names in disabled_mcps", () => {
    const disabledMcps = ["context7", "playwright", "custom"]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(Object.keys(result)).toHaveLength(10)
  })

  test("should handle empty disabled_mcps by default", () => {
    const result = createBuiltinMcps()

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(Object.keys(result)).toHaveLength(11)
  })

  test("should only filter built-in MCPs, ignoring unknown names", () => {
    const disabledMcps = ["playwright", "sqlite", "unknown-mcp"]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("arxiv_mcp")
    expect(Object.keys(result)).toHaveLength(11)
  })

  test("should not throw when websearch disabled even if tavily configured without API key", () => {
    const originalTavilyKey = process.env.TAVILY_API_KEY
    delete process.env.TAVILY_API_KEY
    const disabledMcps = ["websearch"]
    const config = { websearch: { provider: "tavily" as const } }

    try {
      const createMcps = () => createBuiltinMcps(disabledMcps, config)

      expect(createMcps).not.toThrow()
      const result = createMcps()
      expect(result).not.toHaveProperty("websearch")
    } finally {
      if (originalTavilyKey) process.env.TAVILY_API_KEY = originalTavilyKey
    }
  })

  test("mcp_policy.enable turns extended MCPs on without hiding others", () => {
    const config = {
      mcp_policy: {
        enable: ["paper_search_mcp", "deepwiki_mcp"],
      },
    }

    const result = createBuiltinMcps([], config as any)

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("arxiv_mcp")
    expect(result).toHaveProperty("browser_puppeteer")
    expect(result).toHaveProperty("chrome-devtools-mcp")
    expect(result).toHaveProperty("fetch_browser")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(result.paper_search_mcp?.enabled).toBe(true)
    expect(result.deepwiki_mcp?.enabled).toBe(true)
    expect(result.arxiv_mcp?.enabled).toBe(false)
    expect(result.paper_search_mcp?.enabled).toBe(true)
    expect(Object.keys(result)).toHaveLength(11)
  })
})
