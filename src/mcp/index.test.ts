import { describe, expect, test } from "bun:test"
import { createBuiltinMcps } from "./index"

describe("createBuiltinMcps", () => {
  test("should return all MCPs with extended ones disabled by default", () => {
    const disabledMcps: string[] = []

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("arxiv_mcp")
    expect(result).toHaveProperty("browser_puppeteer")
    expect(result).toHaveProperty("fetch_browser")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(result).toHaveProperty("bing_cn_mcp")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(result).toHaveProperty("semantic_scholar_fastmcp")
    expect(result.arxiv_mcp?.enabled).toBe(false)
    expect(result.browser_puppeteer?.enabled).toBe(false)
    expect(result.fetch_browser?.enabled).toBe(false)
    expect(result.deepwiki_mcp?.enabled).toBe(false)
    expect(result.bing_cn_mcp?.enabled).toBe(false)
    expect(result.paper_search_mcp?.enabled).toBe(false)
    expect(result.semantic_scholar_fastmcp?.enabled).toBe(false)
    expect(Object.keys(result)).toHaveLength(10)
  })

  test("should filter out disabled built-in MCPs", () => {
    const disabledMcps = ["context7"]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(9)
  })

  test("should filter out all built-in MCPs when all disabled", () => {
    const disabledMcps = [
      "websearch",
      "context7",
      "grep_app",
      "arxiv_mcp",
      "browser_puppeteer",
      "fetch_browser",
      "deepwiki_mcp",
      "bing_cn_mcp",
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
    expect(Object.keys(result)).toHaveLength(9)
  })

  test("should handle empty disabled_mcps by default", () => {
    const result = createBuiltinMcps()

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(Object.keys(result)).toHaveLength(10)
  })

  test("should only filter built-in MCPs, ignoring unknown names", () => {
    const disabledMcps = ["playwright", "sqlite", "unknown-mcp"]

    const result = createBuiltinMcps(disabledMcps)

    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("arxiv_mcp")
    expect(Object.keys(result)).toHaveLength(10)
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
    expect(result).toHaveProperty("fetch_browser")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(result.paper_search_mcp?.enabled).toBe(true)
    expect(result.deepwiki_mcp?.enabled).toBe(true)
    expect(result.arxiv_mcp?.enabled).toBe(false)
    expect(Object.keys(result)).toHaveLength(10)
  })
})
