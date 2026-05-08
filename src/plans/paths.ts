import { relative, resolve } from 'node:path';
import { getProjectPlansDir } from '../paths/plugin-paths';

const RESERVED_NAMES = new Set(['con', 'prn', 'aux', 'nul']);

export function normalizePlanName(name: string): string {
  const normalized = name
    .trim()
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized || RESERVED_NAMES.has(normalized)) {
    throw new Error(`Invalid plan name: ${name}`);
  }

  return normalized;
}

export function resolvePlanPath(workspaceRoot: string, name: string): string {
  const plansDir = resolve(getProjectPlansDir(workspaceRoot));
  const planPath = resolve(plansDir, `${normalizePlanName(name)}.md`);
  const relativePath = relative(plansDir, planPath);

  if (relativePath.startsWith('..') || relativePath === '') {
    throw new Error(`Invalid plan path for name: ${name}`);
  }

  return planPath;
}

export function getPlanRelativePath(name: string): string {
  return `.opencode/extendai-lab/plans/${normalizePlanName(name)}.md`;
}
