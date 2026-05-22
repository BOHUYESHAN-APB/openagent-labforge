/**
 * Completion promise detector (OMO ralph-loop pattern).
 *
 * Scans session assistant messages for a structured completion
 * marker: `<promise>DONE</promise>`. This is the primary completion
 * signal for the ralph-loop/auto-continue system.
 *
 * Supports incremental scanning via `sinceMessageIndex` so we only
 * check messages we haven't seen before.
 */

import type { PluginInput } from '@opencode-ai/plugin';
import { log } from '../../utils/logger';
import { withTimeout } from './with-timeout';

const HOOK_NAME = 'todo-continuation';

const COMPLETION_PATTERN = /<promise>\s*DONE\s*<\/promise>/is;

interface SessionMessage {
  info?: { role?: string };
  parts?: Array<{ type?: string; text?: string }>;
}

/**
 * Detect `<promise>DONE</promise>` in session messages.
 * Returns the message index where it was found, or -1 if not found.
 */
export async function detectCompletionPromise(
  ctx: PluginInput,
  options: {
    sessionID: string;
    apiTimeoutMs: number;
    directory: string;
    sinceMessageIndex?: number;
  },
): Promise<{ found: boolean; atIndex: number }> {
  try {
    const response = await withTimeout(
      ctx.client.session.messages({
        path: { id: options.sessionID },
        query: { directory: options.directory },
      }),
      options.apiTimeoutMs,
    );

    const messages = (
      Array.isArray(response)
        ? response
        : (response as { data?: unknown })?.data
    ) as SessionMessage[] | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return { found: false, atIndex: -1 };
    }

    const scopedMessages =
      typeof options.sinceMessageIndex === 'number' &&
      options.sinceMessageIndex >= 0
        ? messages.slice(options.sinceMessageIndex)
        : messages;

    const assistantMessages = scopedMessages.filter(
      (msg) => msg.info?.role === 'assistant',
    );

    for (let i = 0; i < assistantMessages.length; i++) {
      const msg = assistantMessages[i];
      if (!msg.parts) continue;

      for (const part of msg.parts) {
        if (
          part.type === 'text' &&
          part.text &&
          COMPLETION_PATTERN.test(part.text)
        ) {
          return { found: true, atIndex: i };
        }
      }
    }

    return { found: false, atIndex: -1 };
  } catch (err) {
    log(`[${HOOK_NAME}] Completion promise detection failed`, {
      sessionID: options.sessionID,
      error: String(err),
    });
    return { found: false, atIndex: -1 };
  }
}

/**
 * Check if auto-review verdict indicates rework needed.
 * When the evaluator model finds issues, it outputs [REJECT].
 * This function detects that signal for the failure handler.
 */
export function isReworkVerdict(verdict: string): boolean {
  return (
    verdict === 'reject' || verdict === 'needs_user' || verdict === 'blocked'
  );
}
