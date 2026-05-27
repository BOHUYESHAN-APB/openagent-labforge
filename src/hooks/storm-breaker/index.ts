import { createHash } from 'node:crypto';
import type { PluginInput } from '@opencode-ai/plugin';

/**
 * Storm breaker: detects and suppresses repeat-loop tool calls.
 *
 * Maintains a sliding window of (toolName, argsHash) per session.
 * If the same call appears >= threshold times within the window,
 * the call is suppressed — the model gets a reflection turn instead.
 *
 * Inspired by reasonix's storm breaker (src/repair/storm.ts).
 */

interface WindowEntry {
  tool: string;
  argsHash: string;
}

interface SessionState {
  window: WindowEntry[];
}

const DEFAULT_WINDOW = 6;
const DEFAULT_THRESHOLD = 3;

function hashArgs(args: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(args ?? {}))
    .digest('hex')
    .slice(0, 16);
}

export function createStormBreakerHook(_ctx: PluginInput) {
  const sessions = new Map<string, SessionState>();

  function ensureSession(sessionID: string): SessionState {
    let state = sessions.get(sessionID);
    if (!state) {
      state = { window: [] };
      sessions.set(sessionID, state);
    }
    return state;
  }

  return {
    'tool.execute.before': async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: unknown },
    ): Promise<void> => {
      const sessionID = input.sessionID;
      const toolName = input.tool;
      const state = ensureSession(sessionID);
      const argsHash = hashArgs(output.args);

      // Count occurrences in sliding window
      const count = state.window.filter(
        (e) => e.tool === toolName && e.argsHash === argsHash,
      ).length;

      if (count >= DEFAULT_THRESHOLD) {
        // Suppress: overwrite args with error signal
        output.args = {
          _storm_breaker: true,
          error:
            `Detected ${count + 1} identical calls to "${toolName}" ` +
            `in the last ${state.window.length} turns. ` +
            'Re-think your approach or try a different tool/args.',
          suppressed: true,
        };
        return;
      }

      // Track this call
      state.window.push({ tool: toolName, argsHash });
      if (state.window.length > DEFAULT_WINDOW) {
        state.window.shift();
      }
    },
  };
}
