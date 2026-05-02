import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { getProjectMemoryDir } from '../paths/plugin-paths';
import { CheckpointManager } from './manager';

describe('checkpoint persistence', () => {
  test('persists session checkpoints to project memory directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'ol-checkpoint-'));
    try {
      const manager = new CheckpointManager(root);
      manager.initializeSession('session-1', root, 'repo-1', 'conversation-1');
      const checkpoint = manager.createCheckpoint(
        'session-1',
        'summary',
        ['decision'],
        ['issue'],
        123,
        'conversation-1',
      );

      const statePath = join(getProjectMemoryDir(root), 'checkpoint-state.json');
      const persisted = JSON.parse(readFileSync(statePath, 'utf-8')) as {
        sessions: Array<{ sessionID: string; checkpoints: Array<{ id: string }> }>;
      };

      expect(persisted.sessions).toHaveLength(1);
      expect(persisted.sessions[0].sessionID).toBe('session-1');
      expect(persisted.sessions[0].checkpoints[0].id).toBe(checkpoint.id);

      const reloaded = new CheckpointManager(root);
      expect(reloaded.sessionMemory.getCheckpoints('session-1')[0].id).toBe(
        checkpoint.id,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
