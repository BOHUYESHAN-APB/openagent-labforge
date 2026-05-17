import type { PluginInput } from '@opencode-ai/plugin';
import { sanitizeSchema, type JsonValue } from './index';

/**
 * Schema sanitize hook: sanitizes tool JSON Schemas before
 * they're sent to the LLM via the `tool.definition` hook.
 */
export function createSchemaSanitizeHook(_ctx: PluginInput) {
  return {
    'tool.definition': async (
      _input: { toolID: string },
      output: { description: string; parameters: unknown },
    ): Promise<void> => {
      if (output.parameters && typeof output.parameters === 'object') {
        sanitizeSchema(output.parameters as JsonValue);
      }
    },
  };
}
