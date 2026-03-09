import { z } from "zod"

export const McpNameSchema = z.enum([
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
])

export type McpName = z.infer<typeof McpNameSchema>

export const AnyMcpNameSchema = z.string().min(1)

export type AnyMcpName = z.infer<typeof AnyMcpNameSchema>
