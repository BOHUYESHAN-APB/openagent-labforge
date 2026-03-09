import { describe, expect, test } from "bun:test"
import { createBuiltinMcps } from "./index"

describe("createBuiltinMcps", () => {
  test("should return stable MCP set by default", () => {
    // given
    const disabledMcps: string[] = []

    // when
    const result = createBuiltinMcps(disabledMcps)

    // then
    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).not.toHaveProperty("arxiv_mcp")
    expect(result).not.toHaveProperty("browser_puppeteer")
    expect(result).not.toHaveProperty("fetch_browser")
    expect(result).not.toHaveProperty("deepwiki_mcp")
    expect(result).not.toHaveProperty("bing_cn_mcp")
    expect(result).not.toHaveProperty("paper_search_mcp")
    expect(result).not.toHaveProperty("semantic_scholar_fastmcp")
    expect(Object.keys(result)).toHaveLength(3)
  })

  test("should filter out disabled built-in MCPs", () => {
    // given
    const disabledMcps = ["context7"]

    // when
    const result = createBuiltinMcps(disabledMcps)

    // then
    expect(result).toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(2)
  })

  test("should filter out all built-in MCPs when all disabled", () => {
    // given
    const disabledMcps = ["websearch", "context7", "grep_app"]

    // when
    const result = createBuiltinMcps(disabledMcps)

    // then
    expect(result).not.toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).not.toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(0)
  })

  test("should ignore custom MCP names in disabled_mcps", () => {
    // given
    const disabledMcps = ["context7", "playwright", "custom"]

    // when
    const result = createBuiltinMcps(disabledMcps)

    // then
    expect(result).toHaveProperty("websearch")
    expect(result).not.toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(2)
  })

  test("should handle empty disabled_mcps by default", () => {
    // given
    // when
    const result = createBuiltinMcps()

    // then
    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(3)
  })

  test("should only filter built-in MCPs, ignoring unknown names", () => {
    // given
    const disabledMcps = ["playwright", "sqlite", "unknown-mcp"]

    // when
    const result = createBuiltinMcps(disabledMcps)

    // then
    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(Object.keys(result)).toHaveLength(3)
  })

  test("should not throw when websearch disabled even if tavily configured without API key", () => {
    // given
    const originalTavilyKey = process.env.TAVILY_API_KEY
    delete process.env.TAVILY_API_KEY
    const disabledMcps = ["websearch"]
    const config = { websearch: { provider: "tavily" as const } }

    try {
      // when
      const createMcps = () => createBuiltinMcps(disabledMcps, config)

      // then
      expect(createMcps).not.toThrow()
      const result = createMcps()
      expect(result).not.toHaveProperty("websearch")
    } finally {
      if (originalTavilyKey) process.env.TAVILY_API_KEY = originalTavilyKey
    }
  })

  test("opt-in extended MCPs are registered when enabled in mcp_policy", () => {
    //#given
    const config = {
      mcp_policy: {
        enable: ["paper_search_mcp", "deepwiki_mcp"],
      },
    }

    //#when
    const result = createBuiltinMcps([], config as any)

    //#then
    expect(result).toHaveProperty("websearch")
    expect(result).toHaveProperty("context7")
    expect(result).toHaveProperty("grep_app")
    expect(result).toHaveProperty("paper_search_mcp")
    expect(result).toHaveProperty("deepwiki_mcp")
    expect(result.paper_search_mcp?.enabled).toBe(false)
    expect(result.deepwiki_mcp?.enabled).toBe(false)
    expect(Object.keys(result)).toHaveLength(5)
  })
})
