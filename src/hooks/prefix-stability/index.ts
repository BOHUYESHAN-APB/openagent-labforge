import type { PluginInput } from '@opencode-ai/plugin';
import { createHash } from 'node:crypto';

/**
 * Prefix cache stability monitor.
 *
 * Computes a SHA-256 fingerprint of the system prompt at session start
 * and detects drift on each subsequent turn. When the prefix changes,
 * DeepSeek's automatic prefix cache is invalidated — we surface this
 * as a stability hint in the system prompt.
 *
 * Inspired by DeepSeek-TUI's prefix_cache.rs and reasonix's
 * ImmutablePrefix concept.
 */

interface SessionState {
  pinnedSystemSha: string;
  driftCount: number;
}

export function createPrefixStabilityHook(_ctx: PluginInput) {
  const sessions = new Map<string, SessionState>();

  function sha256(text: string): string {
    return createHash('sha256').update(text).digest('hex').slice(0, 16);
  }

  function ensureSession(sessionID: string, systemText: string): SessionState {
    let state = sessions.get(sessionID);
    if (!state) {
      state = {
        pinnedSystemSha: sha256(systemText),
        driftCount: 0,
      };
      sessions.set(sessionID, state);
    }
    return state;
  }

  return {
    'experimental.chat.system.transform': async (
      input: { sessionID?: string; model: { providerID?: string } },
      output: { system: string[] },
    ): Promise<void> => {
      const sessionID = input.sessionID;
      if (!sessionID) return;

      const combinedSystem = output.system.join('\n');
      const state = ensureSession(sessionID, combinedSystem);
      const currentSha = sha256(combinedSystem);

      if (currentSha !== state.pinnedSystemSha) {
        state.driftCount++;
        state.pinnedSystemSha = currentSha;
      }

      const isDsModel = input.model?.providerID
        ?.toLowerCase()
        .includes('deepseek');

      if (state.driftCount > 0 && isDsModel) {
        output.system.push(
          `[prefix-stability] System prompt fingerprint changed ` +
            `${state.driftCount} time(s) this session. ` +
            `DeepSeek prefix cache may be invalidated. ` +
            `Keep system prompt + tool list stable across turns ` +
            `to maximize cache hit rate.`,
        );
      }
    },
  };
}
