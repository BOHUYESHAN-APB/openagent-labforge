import { readFileSync, statSync } from 'node:fs';
import { findPlanFile, getPlanProgress, listPlanFiles } from '../boulder';
import { saveDocument } from '../document-output';
import {
  getPlanRelativePath,
  normalizePlanName,
  resolvePlanPath,
} from './paths';
import type { LoadPlanResult, SavePlanInput, SavePlanResult } from './types';

export { getPlanRelativePath, normalizePlanName, resolvePlanPath };

export function savePlan(input: SavePlanInput): SavePlanResult {
  const result = saveDocument({
    workspaceRoot: input.workspaceRoot,
    kind: 'plan',
    name: input.name,
    content: input.content,
    overwrite: input.overwrite,
    format: 'markdown',
  });

  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      message: result.message,
      path: result.path,
    };
  }

  return {
    ok: true,
    name: result.name,
    path: result.path,
    relativePath: result.relativePath,
    bytes: result.bytes,
    overwritten: result.overwritten,
    savedAt: result.savedAt,
  };
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
