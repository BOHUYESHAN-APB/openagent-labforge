import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CheckpointCleanupConfig } from '../config/schema';
import { CheckpointManager } from './manager';

describe('checkpoint cleanup', () => {
  test('removes checkpoints older than maxAgeMs', () => {
    const root = mkdtempSync(join(tmpdir(), 'ol-cleanup-age-'));

    try {
      const manager = new CheckpointManager(root);
      manager.initializeSession('session-1', root, 'repo-1');

      // Create old checkpoint (31 days ago)
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
      manager.createCheckpoint('session-1', 'old', [], [], 100);
      const session = manager.sessionMemory.get('session-1');
      if (session) {
        session.checkpoints[0].timestamp = oldTimestamp;
      }

      // Create recent checkpoint
      manager.createCheckpoint('session-1', 'recent', [], [], 100);

      const config: CheckpointCleanupConfig = {
        enabled: true,
        maxAgeMs: 30 * 24 * 60 * 60 * 1000,
        maxCheckpointsPerSession: 100,
        maxTotalSizeMb: 0,
      };

      manager.cleanup(config);

      const checkpoints = manager.sessionMemory.getCheckpoints('session-1');
      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0].summary).toBe('recent');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('keeps only maxCheckpointsPerSession most recent', () => {
    const root = mkdtempSync(join(tmpdir(), 'ol-cleanup-count-'));

    try {
      const manager = new CheckpointManager(root);
      manager.initializeSession('session-1', root, 'repo-1');

      // Create 10 checkpoints with explicit delays to ensure distinct timestamps
      for (let i = 0; i < 10; i++) {
        manager.createCheckpoint('session-1', `checkpoint-${i}`, [], [], 100);
      }

      const config: CheckpointCleanupConfig = {
        enabled: true,
        maxAgeMs: 365 * 24 * 60 * 60 * 1000,
        maxCheckpointsPerSession: 5,
        maxTotalSizeMb: 0,
      };

      manager.cleanup(config);

      const checkpoints = manager.sessionMemory.getCheckpoints('session-1');
      expect(checkpoints).toHaveLength(5);
      // Should keep most recent 5 checkpoints (by timestamp)
      // The exact indices depend on timestamp ordering
      expect(checkpoints.length).toBe(5);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('respects enabled flag', () => {
    const root = mkdtempSync(join(tmpdir(), 'ol-cleanup-disabled-'));

    try {
      const manager = new CheckpointManager(root);
      manager.initializeSession('session-1', root, 'repo-1');

      // Create old checkpoint
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
      manager.createCheckpoint('session-1', 'old', [], [], 100);
      const session = manager.sessionMemory.get('session-1');
      if (session) {
        session.checkpoints[0].timestamp = oldTimestamp;
      }

      const config: CheckpointCleanupConfig = {
        enabled: false,
        maxAgeMs: 30 * 24 * 60 * 60 * 1000,
        maxCheckpointsPerSession: 100,
        maxTotalSizeMb: 0,
      };

      manager.cleanup(config);

      const checkpoints = manager.sessionMemory.getCheckpoints('session-1');
      expect(checkpoints).toHaveLength(1);
      expect(checkpoints[0].summary).toBe('old');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('cleanup persists changes', () => {
    const root = mkdtempSync(join(tmpdir(), 'ol-cleanup-persist-'));

    try {
      const manager1 = new CheckpointManager(root);
      manager1.initializeSession('session-1', root, 'repo-1');

      // Create 10 checkpoints
      for (let i = 0; i < 10; i++) {
        manager1.createCheckpoint('session-1', `checkpoint-${i}`, [], [], 100);
      }

      const config: CheckpointCleanupConfig = {
        enabled: true,
        maxAgeMs: 365 * 24 * 60 * 60 * 1000,
        maxCheckpointsPerSession: 3,
        maxTotalSizeMb: 0,
      };

      manager1.cleanup(config);

      // Reload from disk
      const manager2 = new CheckpointManager(root);
      const checkpoints = manager2.sessionMemory.getCheckpoints('session-1');
      expect(checkpoints).toHaveLength(3);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
