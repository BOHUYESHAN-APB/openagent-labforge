import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { CheckpointCleanupConfig } from '../config/schema';
import { getProjectMemoryDir } from '../paths/plugin-paths';
import type { CheckpointStorage, ContextCheckpoint } from './types';

export interface CleanupStats {
  checkpointsRemoved: number;
  sessionsAffected: number;
  bytesFreed: number;
}

export function cleanupCheckpoints(
  workspaceRoot: string,
  storage: CheckpointStorage,
  config: CheckpointCleanupConfig,
): CleanupStats {
  const stats: CleanupStats = {
    checkpointsRemoved: 0,
    sessionsAffected: 0,
    bytesFreed: 0,
  };

  if (!config.enabled) return stats;

  const now = Date.now();
  const maxAge = config.maxAgeMs;
  const maxPerSession = config.maxCheckpointsPerSession;

  // Clean by age and per-session limit
  for (const [sessionID, session] of storage.sessionMemory.entries()) {
    const originalCount = session.checkpoints.length;
    if (originalCount === 0) continue;

    // Filter by age
    let filtered = session.checkpoints.filter(
      (cp) => now - cp.timestamp <= maxAge,
    );

    // Keep only most recent N checkpoints
    if (filtered.length > maxPerSession) {
      filtered = filtered
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxPerSession)
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    const removed = originalCount - filtered.length;
    if (removed > 0) {
      session.checkpoints = filtered;
      stats.checkpointsRemoved += removed;
      stats.sessionsAffected++;
    }
  }

  // Clean by total size if limit is set
  if (config.maxTotalSizeMb > 0) {
    const stateFile = join(getProjectMemoryDir(workspaceRoot), 'checkpoint-state.json');
    try {
      const currentSizeBytes = statSync(stateFile).size;
      const maxSizeBytes = config.maxTotalSizeMb * 1024 * 1024;

      if (currentSizeBytes > maxSizeBytes) {
        const allCheckpoints: Array<{
          sessionID: string;
          checkpoint: ContextCheckpoint;
        }> = [];

        for (const [sessionID, session] of storage.sessionMemory.entries()) {
          for (const cp of session.checkpoints) {
            allCheckpoints.push({ sessionID, checkpoint: cp });
          }
        }

        // Sort by timestamp (oldest first)
        allCheckpoints.sort((a, b) => a.checkpoint.timestamp - b.checkpoint.timestamp);

        // Remove oldest checkpoints until under size limit
        // Rough estimate: remove 20% of checkpoints at a time
        const toRemove = Math.ceil(allCheckpoints.length * 0.2);
        const removed = allCheckpoints.slice(0, toRemove);

        for (const { sessionID, checkpoint } of removed) {
          const session = storage.sessionMemory.get(sessionID);
          if (session) {
            const index = session.checkpoints.findIndex((cp) => cp.id === checkpoint.id);
            if (index !== -1) {
              session.checkpoints.splice(index, 1);
              stats.checkpointsRemoved++;
            }
          }
        }

        stats.bytesFreed = currentSizeBytes - maxSizeBytes;
      }
    } catch {
      // File doesn't exist yet or can't be read - skip size-based cleanup
    }
  }

  return stats;
}
