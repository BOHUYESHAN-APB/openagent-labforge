/**
 * Compatibility stub for claude-code-mcp-loader types.
 * Provides minimal type definitions for plugin MCP server configs.
 */

export interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  projectPath?: string;
  /** Transport type: 'stdio' (default) or 'streamable-http' */
  type?: 'stdio' | 'streamable-http';
  /** URL for streamable-http transport */
  url?: string;
  [key: string]: unknown;
}

export interface ClaudeCodeMcpConfig {
  mcpServers?: Record<string, McpServerConfig>;
}
