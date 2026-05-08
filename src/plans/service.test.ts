import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findPlanFile } from '../boulder';
import {
  loadPlan,
  normalizePlanName,
  planExists,
  resolvePlanPath,
  savePlan,
} from './service';

describe('plan persistence service', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'extendai-plan-test-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  test('saves a new plan under the plugin plans directory', () => {
    const result = savePlan({
      workspaceRoot,
      name: 'Document Output Baseline',
      content: '- [ ] 1. Implement persistence\n',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe('document-output-baseline');
    expect(result.relativePath).toBe(
      '.opencode/extendai-lab/plans/document-output-baseline.md',
    );
    expect(existsSync(result.path)).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toBe(
      '- [ ] 1. Implement persistence\n',
    );
  });

  test('creates the plans directory when absent', () => {
    const result = savePlan({
      workspaceRoot,
      name: 'create-dir',
      content: '- [ ] 1. Task',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(existsSync(result.path)).toBe(true);
  });

  test('normalizes names consistently with boulder lookup', () => {
    const result = savePlan({
      workspaceRoot,
      name: '1.0.19 Document Output + Compat Baseline',
      content: '- [ ] 1. Task\n',
    });

    expect(result.ok).toBe(true);
    const found = findPlanFile(workspaceRoot, '1-0-19-document-output');
    expect(found?.name).toBe('1-0-19-document-output-compat-baseline');
  });

  test('rejects unsafe or empty names', () => {
    const empty = savePlan({ workspaceRoot, name: '...', content: 'x' });
    const reserved = savePlan({ workspaceRoot, name: 'con', content: 'x' });

    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.code).toBe('invalid-name');
    expect(reserved.ok).toBe(false);
    if (!reserved.ok) expect(reserved.code).toBe('invalid-name');
  });

  test('does not overwrite an existing plan unless explicitly allowed', () => {
    const first = savePlan({
      workspaceRoot,
      name: 'alpha',
      content: '- [ ] 1. First\n',
    });
    const duplicate = savePlan({
      workspaceRoot,
      name: 'alpha',
      content: '- [ ] 1. Duplicate\n',
    });
    const overwrite = savePlan({
      workspaceRoot,
      name: 'alpha',
      content: '- [ ] 1. Overwrite\n',
      overwrite: true,
    });

    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.code).toBe('already-exists');
    expect(overwrite.ok).toBe(true);
    if (!overwrite.ok) return;
    expect(overwrite.overwritten).toBe(true);
    expect(readFileSync(overwrite.path, 'utf8')).toBe('- [ ] 1. Overwrite\n');
  });

  test('loads a saved plan with progress metadata', () => {
    savePlan({
      workspaceRoot,
      name: 'progress-plan',
      content: '- [x] 1. Done\n- [ ] 2. Todo\n',
    });

    const loaded = loadPlan(workspaceRoot, 'progress-plan');

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.plan.progress).toMatchObject({
      total: 2,
      completed: 1,
      remaining: 1,
      percent: 50,
    });
  });

  test('checks existence and resolves canonical paths', () => {
    expect(planExists(workspaceRoot, 'missing')).toBe(false);
    savePlan({ workspaceRoot, name: 'exists', content: '- [ ] 1. Task' });

    expect(planExists(workspaceRoot, 'exists')).toBe(true);
    expect(resolvePlanPath(workspaceRoot, 'exists')).toEndWith(
      join('.opencode', 'extendai-lab', 'plans', 'exists.md'),
    );
    expect(normalizePlanName('Exists.md')).toBe('exists');
  });
});
