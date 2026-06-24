import type { McpServerConfig } from './types';

/**
 * Compatibility stub for claude-code-mcp-loader transformer.
 * Returns the MCP server config unchanged (pass-through).
 */
export function transformMcpServer(
  _name: string,
  config: McpServerConfig,
): McpServerConfig {
  return config;
}
