import { relative, resolve } from 'node:path';
import { getProjectStateDir } from '../paths/plugin-paths';
import type { DocumentKind, DocumentPathPolicy } from './types';

const RESERVED_NAMES = new Set(['con', 'prn', 'aux', 'nul']);

const DOCUMENT_DIRECTORIES = {
  plan: 'plans',
  interview: 'interviews',
  spec: 'specs',
  handoff: 'handoffs',
  'review-report': 'reviews',
  'install-plan': 'install-plans',
  'rollback-manifest': 'rollback-manifests',
} as const satisfies Record<DocumentKind, string>;

const DOCUMENT_EXTENSIONS = {
  plan: 'md',
  interview: 'md',
  spec: 'md',
  handoff: 'md',
  'review-report': 'md',
  'install-plan': 'md',
  'rollback-manifest': 'json',
} as const satisfies Record<DocumentKind, string>;

export function normalizeDocumentName(name: string): string {
  const normalized = name
    .trim()
    .replace(/\.(md|markdown|json|ya?ml|txt)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized || RESERVED_NAMES.has(normalized)) {
    throw new Error(`Invalid document name: ${name}`);
  }

  return normalized;
}

export function getDocumentPathPolicy(
  workspaceRoot: string,
  kind: DocumentKind,
): DocumentPathPolicy {
  const directoryName = DOCUMENT_DIRECTORIES[kind];
  const relativeDirectory = `.opencode/extendai-lab/${directoryName}`;
  return {
    kind,
    directory: resolve(getProjectStateDir(workspaceRoot), directoryName),
    relativeDirectory,
    extension: DOCUMENT_EXTENSIONS[kind],
  };
}

export function resolveDocumentPath(
  workspaceRoot: string,
  kind: DocumentKind,
  name: string,
): string {
  const policy = getDocumentPathPolicy(workspaceRoot, kind);
  const documentPath = resolve(
    policy.directory,
    `${normalizeDocumentName(name)}.${policy.extension}`,
  );
  const relativePath = relative(policy.directory, documentPath);

  if (relativePath.startsWith('..') || relativePath === '') {
    throw new Error(`Invalid document path for name: ${name}`);
  }

  return documentPath;
}

export function getDocumentRelativePath(
  workspaceRoot: string,
  kind: DocumentKind,
  name: string,
): string {
  const policy = getDocumentPathPolicy(workspaceRoot, kind);
  return `${policy.relativeDirectory}/${normalizeDocumentName(name)}.${policy.extension}`;
}
