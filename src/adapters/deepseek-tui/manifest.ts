import { PACKAGE_NAME } from '../../config/product';

export type DeepSeekAdapterFileKind =
  | 'command'
  | 'skill'
  | 'mcp-config'
  | 'hook-snippet'
  | 'doc'
  | 'manifest'
  | 'backup';

export type DeepSeekConflictPolicy =
  | 'fail-if-exists'
  | 'replace-if-owned'
  | 'backup-and-replace'
  | 'preserve-user-file';

export interface DeepSeekInstalledFile {
  kind: DeepSeekAdapterFileKind;
  relativePath: string;
  source: string;
  sha256: string;
  previousSha256?: string | null;
  owned: boolean;
  conflictPolicy: DeepSeekConflictPolicy;
}

export interface DeepSeekInstallManifest {
  schemaVersion: 1;
  packageName: typeof PACKAGE_NAME;
  packageVersion: string;
  adapter: 'deepseek-tui';
  adapterVersion: string;
  installedAt: string;
  targetRoot: string;
  files: DeepSeekInstalledFile[];
}

export interface OwnershipMarkerInput {
  packageVersion: string;
  adapterVersion: string;
  fileId: string;
  sha256: string;
}

export function renderOwnershipMarker(input: OwnershipMarkerInput): string {
  return [
    '<!--',
    `${PACKAGE_NAME}-managed: true`,
    'adapter: deepseek-tui',
    `packageVersion: ${input.packageVersion}`,
    `adapterVersion: ${input.adapterVersion}`,
    `fileId: ${input.fileId}`,
    `sha256: ${input.sha256}`,
    '-->',
    '',
  ].join('\n');
}

export function createEmptyDeepSeekManifest(input: {
  packageVersion: string;
  adapterVersion: string;
  targetRoot: string;
  installedAt?: string;
}): DeepSeekInstallManifest {
  return {
    schemaVersion: 1,
    packageName: PACKAGE_NAME,
    packageVersion: input.packageVersion,
    adapter: 'deepseek-tui',
    adapterVersion: input.adapterVersion,
    installedAt: input.installedAt ?? new Date().toISOString(),
    targetRoot: input.targetRoot,
    files: [],
  };
}
