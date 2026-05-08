import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getCompatInstallStatePath,
  readCompatInstallState,
  writeCompatInstallState,
} from './install-state';

describe('compat install state', () => {
  test('writes and reads latest runtime install state under compat install dir', () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'compat-install-state-'));
    try {
      const path = writeCompatInstallState({
        runtimeId: 'openclaude',
        updatedAt: '2026-05-08T16:00:00.000Z',
        workspaceRoot,
        installState: 'working-baseline',
        runtimeRoot: join(workspaceRoot, 'openclaude-home'),
        packageVersion: '1.0.19',
        rollbackManifestPath: join(workspaceRoot, 'manifest.json'),
        validationFindings: ['OpenClaude required assets are present.'],
      });

      expect(path).toBe(getCompatInstallStatePath(workspaceRoot, 'openclaude'));

      const loaded = readCompatInstallState(workspaceRoot, 'openclaude');
      expect(loaded).toBeDefined();
      expect(loaded?.installState).toBe('working-baseline');
      expect(loaded?.runtimeId).toBe('openclaude');
      expect(loaded?.packageVersion).toBe('1.0.19');
    } finally {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });
});
