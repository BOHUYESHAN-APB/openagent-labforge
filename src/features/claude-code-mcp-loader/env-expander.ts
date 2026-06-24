/**
 * Compatibility stub for claude-code-mcp-loader.
 * Replaces the full env var expander with a pass-through.
 */
export function expandEnvVarsInObject<T>(obj: T): T {
  return obj;
}
