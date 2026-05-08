import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  getDocumentPathPolicy,
  getDocumentRelativePath,
  normalizeDocumentName,
  resolveDocumentPath,
} from './paths';
import type { SaveDocumentInput, SaveDocumentResult } from './types';

export {
  getDocumentPathPolicy,
  getDocumentRelativePath,
  normalizeDocumentName,
  resolveDocumentPath,
};

export function saveDocument(input: SaveDocumentInput): SaveDocumentResult {
  let name: string;
  let path: string;
  try {
    name = normalizeDocumentName(input.name);
    path = resolveDocumentPath(input.workspaceRoot, input.kind, name);
  } catch (error) {
    return {
      ok: false,
      kind: input.kind,
      code: 'invalid-name',
      message: error instanceof Error ? error.message : 'Invalid document name',
    };
  }

  const exists = existsSync(path);
  if (exists && input.overwrite !== true) {
    return {
      ok: false,
      kind: input.kind,
      code: 'already-exists',
      message: `Document already exists: ${getDocumentRelativePath(
        input.workspaceRoot,
        input.kind,
        name,
      )}`,
      path,
    };
  }

  try {
    mkdirSync(dirname(path), { recursive: true });
    const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
    const content = input.content.endsWith('\n')
      ? input.content
      : `${input.content}\n`;
    writeFileSync(tempPath, content, 'utf8');
    renameSync(tempPath, path);

    return {
      ok: true,
      kind: input.kind,
      name,
      path,
      relativePath: getDocumentRelativePath(
        input.workspaceRoot,
        input.kind,
        name,
      ),
      bytes: Buffer.byteLength(content, 'utf8'),
      overwritten: exists,
      savedAt: new Date().toISOString(),
      format: input.format ?? getDefaultFormat(input.kind),
    };
  } catch (error) {
    return {
      ok: false,
      kind: input.kind,
      code: 'write-failed',
      message:
        error instanceof Error ? error.message : 'Failed to write document',
      path,
    };
  }
}

function getDefaultFormat(kind: SaveDocumentInput['kind']) {
  const policy = getDocumentPathPolicy('', kind);
  if (policy.extension === 'json') return 'json';
  if (policy.extension === 'yaml' || policy.extension === 'yml') return 'yaml';
  if (policy.extension === 'txt') return 'text';
  return 'markdown';
}
