import { describe, expect, test } from 'bun:test';
import {
  addPlanFile,
  createInstallPlan,
  validateInstallPlan,
} from './install-plan';

describe('install plan validation', () => {
  test('detects conflicting writes to the same path', () => {
    const plan = createInstallPlan({
      runtimeId: 'codex',
      runtimeDisplayName: 'Codex',
    });

    addPlanFile(plan, {
      path: '/tmp/plugin.json',
      relativePath: 'plugin.json',
      content: '{}',
      action: 'create',
      managed: true,
    });
    addPlanFile(plan, {
      path: '/tmp/plugin.json',
      relativePath: 'plugin.json',
      content: '{"changed":true}',
      action: 'update',
      managed: true,
    });

    const messages = validateInstallPlan(plan);
    expect(messages).toHaveLength(1);
    expect(messages[0].severity).toBe('error');
    expect(messages[0].message).toContain('conflicting writes');
  });

  test('ignores skip entries when checking conflicts', () => {
    const plan = createInstallPlan({
      runtimeId: 'claude-code',
      runtimeDisplayName: 'Claude Code',
    });

    addPlanFile(plan, {
      path: '/tmp/skills.md',
      relativePath: 'skills.md',
      content: '',
      action: 'skip',
      managed: true,
    });
    addPlanFile(plan, {
      path: '/tmp/skills.md',
      relativePath: 'skills.md',
      content: '# Skills',
      action: 'create',
      managed: true,
    });

    expect(validateInstallPlan(plan)).toEqual([]);
  });
});
