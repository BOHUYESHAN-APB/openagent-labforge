import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { findPlanFile, getPlanProgress, listPlanFiles } from '../boulder';
import {
  getPlanRelativePath,
  normalizePlanName,
  resolvePlanPath,
} from './paths';
import type { LoadPlanResult, SavePlanInput, SavePlanResult } from './types';

export { getPlanRelativePath, normalizePlanName, resolvePlanPath };

export function savePlan(input: SavePlanInput): SavePlanResult {
  let name: string;
  let path: string;
  try {
    name = normalizePlanName(input.name);
    path = resolvePlanPath(input.workspaceRoot, name);
  } catch (error) {
    return {
      ok: false,
      code: 'invalid-name',
      message: error instanceof Error ? error.message : 'Invalid plan name',
    };
  }

  const exists = existsSync(path);
  if (exists && input.overwrite !== true) {
    return {
      ok: false,
      code: 'already-exists',
      message: `Plan already exists: ${getPlanRelativePath(name)}`,
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
      name,
      path,
      relativePath: getPlanRelativePath(name),
      bytes: Buffer.byteLength(content, 'utf8'),
      overwritten: exists,
      savedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      code: 'write-failed',
      message: error instanceof Error ? error.message : 'Failed to write plan',
      path,
    };
  }
}

export function loadPlan(
  workspaceRoot: string,
  query?: string,
): LoadPlanResult {
  let plan = null;
  try {
    plan = findPlanFile(workspaceRoot, query);
  } catch (error) {
    return {
      ok: false,
      code: 'read-failed',
      message: error instanceof Error ? error.message : 'Failed to locate plan',
    };
  }

  if (!plan) {
    return {
      ok: false,
      code: 'not-found',
      message: query ? `Plan not found: ${query}` : 'No plans found',
    };
  }

  try {
    const content = readFileSync(plan.path, 'utf8');
    return {
      ok: true,
      plan: {
        name: plan.name,
        path: plan.path,
        content,
        progress: getPlanProgress(content),
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: 'read-failed',
      message: error instanceof Error ? error.message : 'Failed to read plan',
    };
  }
}

export function listPlans(workspaceRoot: string) {
  return listPlanFiles(workspaceRoot);
}

export function planExists(workspaceRoot: string, name: string): boolean {
  try {
    return statSync(resolvePlanPath(workspaceRoot, name)).isFile();
  } catch {
    return false;
  }
}
