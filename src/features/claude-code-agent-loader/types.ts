/**
 * Compatibility stub for claude-code-agent-loader types.
 */

export interface AgentFrontmatter {
  description?: string;
  model?: string;
  tools?: string;
  [key: string]: unknown;
}

export interface ClaudeCodeAgentConfig {
  description: string;
  mode: string;
  prompt: string;
  model?: string;
  tools?: Record<string, boolean>;
  [key: string]: unknown;
}
