/**
 * Crash recovery guard (OMO ralph-loop pattern).
 *
 * After a session crash/interruption, prevents re-injection during
 * a recovery window. Without this, the continuation hook could
 * immediately try to re-inject into a session that just crashed,
 * creating a tight crash→inject→crash loop.
 */
export function createCrashRecovery(
  options?: { recoveryWindowMs?: number },
) {
  const recoveryWindowMs = options?.recoveryWindowMs ?? 5000;
  const sessions = new Map<string, boolean>();

  return {
    isRecovering(sessionID: string): boolean {
      return sessions.get(sessionID) === true;
    },
    markRecovering(sessionID: string): void {
      sessions.set(sessionID, true);
      setTimeout(() => {
        sessions.delete(sessionID);
      }, recoveryWindowMs);
    },
    clear(sessionID: string): void {
      sessions.delete(sessionID);
    },
  };
}

export type CrashRecovery = ReturnType<typeof createCrashRecovery>;
