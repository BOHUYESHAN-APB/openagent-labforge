import type { CompatibilityCapability } from './types';

export type InstallPlanAction = 'create' | 'update' | 'skip' | 'remove';
export type InstallPlanSeverity = 'info' | 'warning' | 'error';

export interface RenderedFile {
  path: string;
  relativePath: string;
  content: string;
  action: InstallPlanAction;
  managed: boolean;
}

export interface InstallPlanMessage {
  severity: InstallPlanSeverity;
  message: string;
  path?: string;
}

export interface BackupEntry {
  sourcePath: string;
  relativePath?: string;
  backupPath?: string;
  existedBefore: boolean;
  action: InstallPlanAction;
  hash?: string;
}

export interface InstallPlan {
  runtimeId: string;
  runtimeDisplayName: string;
  dryRun: boolean;
  files: RenderedFile[];
  backups: BackupEntry[];
  messages: InstallPlanMessage[];
  capabilities: CompatibilityCapability[];
  reloadRequired: boolean;
  rollbackManifestPath?: string;
}

export function createInstallPlan(input: {
  runtimeId: string;
  runtimeDisplayName: string;
  dryRun?: boolean;
  capabilities?: readonly CompatibilityCapability[];
  reloadRequired?: boolean;
  rollbackManifestPath?: string;
}): InstallPlan {
  return {
    runtimeId: input.runtimeId,
    runtimeDisplayName: input.runtimeDisplayName,
    dryRun: input.dryRun ?? true,
    files: [],
    backups: [],
    messages: [],
    capabilities: [...(input.capabilities ?? [])],
    reloadRequired: input.reloadRequired ?? true,
    rollbackManifestPath: input.rollbackManifestPath,
  };
}

export function addPlanFile(
  plan: InstallPlan,
  file: RenderedFile,
): InstallPlan {
  plan.files.push(file);
  return plan;
}

export function addPlanMessage(
  plan: InstallPlan,
  severity: InstallPlanSeverity,
  message: string,
  path?: string,
): InstallPlan {
  plan.messages.push({ severity, message, path });
  return plan;
}

export function validateInstallPlan(plan: InstallPlan): InstallPlanMessage[] {
  const messages: InstallPlanMessage[] = [];
  const filesByPath = new Map<string, RenderedFile>();

  for (const file of plan.files) {
    const existing = filesByPath.get(file.path);
    if (!existing) {
      filesByPath.set(file.path, file);
      continue;
    }

    if (existing.action !== 'skip' && file.action !== 'skip') {
      messages.push({
        severity: 'error',
        path: file.relativePath || file.path,
        message: `Install plan has conflicting writes for ${file.relativePath || file.path}.`,
      });
    }
  }

  return messages;
}
