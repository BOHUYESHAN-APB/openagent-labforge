import { z } from "zod"

export const McpPolicyConfigSchema = z.object({
  /** Network profile for MCP defaults: auto/open/restricted */
  network_profile: z.enum(["auto", "open", "restricted"]).optional(),
  /** Force-enable specific MCP names after merge */
  enable: z.array(z.string()).optional(),
  /** Force-disable specific MCP names after merge */
  disable: z.array(z.string()).optional(),
  /** When true, enabling bing_cn_mcp also enables websearch as English fallback */
  bing_cn_english_fallback: z.boolean().optional(),
})

export type McpPolicyConfig = z.infer<typeof McpPolicyConfigSchema>
