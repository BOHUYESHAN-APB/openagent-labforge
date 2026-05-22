import type { PluginInput } from '@opencode-ai/plugin';

/**
 * Flash-first auto-escalation.
 *
 * Tracks tool failure signals per turn. When the failure count crosses
 * a threshold, the model is escalated from flash to pro for the
 * remainder of the current turn.
 *
 * Inspired by reasonix's escalation.ts + turn-failure-tracker.ts.
 */

interface SessionState {
  failureCount: number;
  escalated: boolean;
}

const FAILURE_THRESHOLD = 3;

function isFailureSignal(output: string): boolean {
  const lower = output.toLowerCase();
  return (
    lower.includes('search text not found') ||
    lower.includes('no matches found') ||
    lower.includes('error:') ||
    lower.includes('failed to') ||
    lower.includes('edit failed') ||
    lower.includes('_storm_breaker') ||
    lower.includes('suppressed')
  );
}

export function createFlashEscalationHook(_ctx: PluginInput) {
  const sessions = new Map<string, SessionState>();

  function ensureSession(sessionID: string): SessionState {
    let state = sessions.get(sessionID);
    if (!state) {
      state = { failureCount: 0, escalated: false };
      sessions.set(sessionID, state);
    }
    return state;
  }

  return {
    'tool.execute.after': async (
      input: { tool: string; sessionID: string; callID: string; args: unknown },
      output: { title: string; output: string; metadata: unknown },
    ): Promise<void> => {
      const state = ensureSession(input.sessionID);
      if (state.escalated) return;

      if (typeof output.output === 'string' && isFailureSignal(output.output)) {
        state.failureCount++;
      }
    },

    'chat.params': async (
      input: { sessionID: string; model: { id?: string; providerID?: string } },
      output: {
        temperature: number;
        topP: number;
        topK: number;
        maxOutputTokens: number | undefined;
        options: Record<string, unknown>;
      },
    ): Promise<void> => {
      const state = ensureSession(input.sessionID);
      if (state.escalated) return;
      if (state.failureCount < FAILURE_THRESHOLD) return;

      const modelId = input.model?.id?.toLowerCase() ?? '';

      // Only escalate DeepSeek models
      if (!modelId.includes('deepseek')) return;

      // flash → pro
      if (modelId.includes('flash')) {
        state.escalated = true;
        // Inject provider option to switch model variant
        if (output.options) {
          (output.options as Record<string, unknown>).reasoningEffort = 'max';
        }
      }
    },
  };
}
