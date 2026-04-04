import { z } from "zod"

export const McpNameSchema = z.enum([
  "websearch",
  "context7",
  "grep_app",
  "browser_puppeteer",
  "chrome-devtools-mcp",
  "deepwiki_mcp",
  "open_websearch_mcp",
  "paper_search_mcp",
  "semantic_scholar_fastmcp",
])

export type McpName = z.infer<typeof McpNameSchema>

export const AnyMcpNameSchema = z.string().min(1)

export type AnyMcpName = z.infer<typeof AnyMcpNameSchema>
