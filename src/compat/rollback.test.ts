import { describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { BackupManifest } from './backup';
import {
  applyRollbackManifest,
  createRollbackPlan,
  readBackupManifest,
} from './rollback';

describe('compat rollback helpers', () => {
  test('creates rollback plan from backup manifest', () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'compat-rollback-'));
    try {
      const manifestPath = join(workspaceRoot, 'manifest.json');
      const manifest: BackupManifest = {
        createdAt: new Date().toISOString(),
        runtimeId: 'opencode',
        entries: [
          {
            sourcePath: join(workspaceRoot, 'config.json'),
            relativePath: 'config.json',
            backupPath: join(workspaceRoot, 'backup', 'config.json'),
            existedBefore: true,
            action: 'update',
            hash: 'abc',
          },
        ],
      };
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');

      const plan = createRollbackPlan({
        runtimeId: 'opencode',
        runtimeDisplayName: 'OpenCode',
        manifestPath,
      });

      expect(plan.files).toHaveLength(1);
      expect(plan.files[0].path).toBe(manifest.entries[0].sourcePath);
      expect(plan.files[0].action).toBe('update');
      expect(readBackupManifest(manifestPath)?.runtimeId).toBe('opencode');
    } finally {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('applyRollbackManifest restores updated files and removes created files', () => {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'compat-rollback-apply-'));
    try {
      const sourcePath = join(workspaceRoot, 'config.json');
      const backupPath = join(workspaceRoot, 'backup', 'config.json');
      const createdPath = join(workspaceRoot, 'new.json');
      const manifestPath = join(workspaceRoot, 'manifest.json');

      writeFileSync(sourcePath, '{"after":true}\n', 'utf8');
      writeFileSync(createdPath, '{"created":true}\n', 'utf8');
      mkdirSync(join(workspaceRoot, 'backup'), { recursive: true });
      writeFileSync(backupPath, '{"before":true}\n', 'utf8');

      const manifest: BackupManifest = {
        createdAt: new Date().toISOString(),
        runtimeId: 'openclaude',
        entries: [
          {
            sourcePath,
            relativePath: 'config.json',
            backupPath,
            existedBefore: true,
            action: 'update',
            hash: 'abc',
          },
          {
            sourcePath: createdPath,
            relativePath: 'new.json',
            existedBefore: false,
            action: 'create',
          },
        ],
      };
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');

      const result = applyRollbackManifest(manifestPath, 'openclaude');

      expect(result.restoredCount).toBe(1);
      expect(result.removedCount).toBe(1);
      expect(result.missingBackupEntries).toEqual([]);
      expect(readFileSync(sourcePath, 'utf8')).toContain('before');
      expect(existsSync(createdPath)).toBe(false);
    } finally {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('applyRollbackManifest refuses mismatched runtime manifests', () => {
    const workspaceRoot = mkdtempSync(
      join(tmpdir(), 'compat-rollback-mismatch-'),
    );
    try {
      const manifestPath = join(workspaceRoot, 'manifest.json');
      const manifest: BackupManifest = {
        createdAt: new Date().toISOString(),
        runtimeId: 'codex',
        entries: [],
      };
      writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');

      const result = applyRollbackManifest(manifestPath, 'openclaude');

      expect(result.restoredCount).toBe(0);
      expect(result.removedCount).toBe(0);
      expect(result.missingBackupEntries).toEqual([]);
      expect(result.runtimeMismatch).toEqual({
        expectedRuntimeId: 'openclaude',
        manifestRuntimeId: 'codex',
      });
    } finally {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });
});
