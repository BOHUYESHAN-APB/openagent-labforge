/**
 * Compatibility stub for claude-code-command-loader types.
 * Provides minimal type definitions for plugin command loading.
 */

export interface CommandFrontmatter {
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  'argument-hint'?: string;
  [key: string]: unknown;
}

export interface CommandDefinition {
  description: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  [key: string]: unknown;
}
