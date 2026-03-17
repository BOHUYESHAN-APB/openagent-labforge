import { z } from "zod"

export const McpNameSchema = z.enum([
  "websearch",
  "context7",
  "grep_app",
  "browser_puppeteer",
  "paper_search_mcp",
])

export type McpName = z.infer<typeof McpNameSchema>

export const AnyMcpNameSchema = z.string().min(1)

export type AnyMcpName = z.infer<typeof AnyMcpNameSchema>
