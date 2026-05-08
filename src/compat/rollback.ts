import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { dirname } from 'node:path';
import type { BackupManifest } from './backup';
import { addPlanFile, type InstallPlan } from './install-plan';

export interface ApplyRollbackResult {
  restoredCount: number;
  removedCount: number;
  missingBackupEntries: string[];
  runtimeMismatch?: {
    expectedRuntimeId: string;
    manifestRuntimeId: string;
  };
}

export interface RollbackPlanOptions {
  runtimeId: string;
  runtimeDisplayName: string;
  manifestPath?: string;
  dryRun?: boolean;
}

export function createRollbackPlan(options: RollbackPlanOptions): InstallPlan {
  const plan: InstallPlan = {
    runtimeId: options.runtimeId,
    runtimeDisplayName: options.runtimeDisplayName,
    dryRun: options.dryRun ?? true,
    files: [],
    backups: [],
    messages: [
      {
        severity: 'info',
        message: options.manifestPath
          ? `Rollback would restore files from ${options.manifestPath}.`
          : 'Rollback requires a backup manifest path before applying changes.',
      },
    ],
    capabilities: ['backup-rollback'],
    reloadRequired: true,
    rollbackManifestPath: options.manifestPath,
  };

  const manifest = readBackupManifest(options.manifestPath);
  if (!manifest) return plan;

  for (const entry of manifest.entries) {
    addPlanFile(plan, {
      path: entry.sourcePath,
      relativePath: entry.relativePath ?? entry.sourcePath,
      content: '',
      action: entry.existedBefore ? 'update' : 'remove',
      managed: true,
    });
  }

  return plan;
}

export function applyRollbackManifest(
  manifestPath: string,
  expectedRuntimeId?: string,
): ApplyRollbackResult {
  const manifest = readBackupManifest(manifestPath);
  if (!manifest) {
    return {
      restoredCount: 0,
      removedCount: 0,
      missingBackupEntries: [manifestPath],
    };
  }

  if (expectedRuntimeId && manifest.runtimeId !== expectedRuntimeId) {
    return {
      restoredCount: 0,
      removedCount: 0,
      missingBackupEntries: [],
      runtimeMismatch: {
        expectedRuntimeId,
        manifestRuntimeId: manifest.runtimeId,
      },
    };
  }

  let restoredCount = 0;
  let removedCount = 0;
  const missingBackupEntries: string[] = [];

  for (const entry of manifest.entries) {
    if (entry.existedBefore) {
      if (!entry.backupPath || !existsSync(entry.backupPath)) {
        missingBackupEntries.push(entry.sourcePath);
        continue;
      }
      mkdirSync(dirname(entry.sourcePath), { recursive: true });
      copyFileSync(entry.backupPath, entry.sourcePath);
      restoredCount += 1;
      continue;
    }

    if (existsSync(entry.sourcePath)) {
      rmSync(entry.sourcePath, { force: true });
      removedCount += 1;
    }
  }

  return {
    restoredCount,
    removedCount,
    missingBackupEntries,
  };
}

export function readBackupManifest(
  manifestPath?: string,
): BackupManifest | undefined {
  if (!manifestPath || !existsSync(manifestPath)) return undefined;
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as BackupManifest;
}
