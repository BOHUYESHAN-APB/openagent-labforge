import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getCompatStoragePaths } from './storage-paths';

export interface CompatInstallStateRecord {
  runtimeId: string;
  updatedAt: string;
  workspaceRoot: string;
  installState:
    | 'native-primary'
    | 'discovery-ready'
    | 'process-acceptance-pending'
    | 'partial-baseline'
    | 'preview-only';
  runtimeRoot?: string;
  packageVersion?: string;
  rollbackManifestPath?: string;
  backupRoot?: string;
  appliedCount?: number;
  skippedCount?: number;
  restoredCount?: number;
  removedCount?: number;
  validationFindings: string[];
}

export function getCompatInstallStatePath(
  workspaceRoot: string,
  runtimeId: string,
): string {
  return join(
    getCompatStoragePaths(workspaceRoot, runtimeId).runtimeInstallDir,
    'latest.json',
  );
}

export function writeCompatInstallState(
  record: CompatInstallStateRecord,
): string {
  const path = getCompatInstallStatePath(
    record.workspaceRoot,
    record.runtimeId,
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return path;
}

export function readCompatInstallState(
  workspaceRoot: string,
  runtimeId: string,
): CompatInstallStateRecord | undefined {
  const path = getCompatInstallStatePath(workspaceRoot, runtimeId);
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as CompatInstallStateRecord;
  } catch {
    return undefined;
  }
}
