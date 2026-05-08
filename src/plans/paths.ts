import {
  getDocumentRelativePath,
  normalizeDocumentName,
  resolveDocumentPath,
} from '../document-output';

export function normalizePlanName(name: string): string {
  return normalizeDocumentName(name);
}

export function resolvePlanPath(workspaceRoot: string, name: string): string {
  return resolveDocumentPath(workspaceRoot, 'plan', name);
}

export function getPlanRelativePath(
  name: string,
  workspaceRoot = process.cwd(),
): string {
  return getDocumentRelativePath(workspaceRoot, 'plan', name);
}
