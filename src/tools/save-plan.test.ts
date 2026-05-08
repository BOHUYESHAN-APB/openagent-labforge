import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSavePlanTool } from './save-plan';

describe('save_plan tool', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'save-plan-tool-test-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  test('saves a plan and returns the real handoff command', async () => {
    const tools = createSavePlanTool(workspaceRoot);
    const output = await tools.execute(
      {
        name: 'Large Version Baseline',
        content: '- [ ] 1. Implement baseline\n',
      },
      { directory: workspaceRoot } as any,
    );

    expect(output).toContain('Plan saved successfully.');
    expect(output).toContain(
      'Plan saved to: .opencode/extendai-lab/plans/large-version-baseline.md',
    );
    expect(output).toContain(
      'Next command: /ol-start-work large-version-baseline',
    );
    expect(
      existsSync(
        join(
          workspaceRoot,
          '.opencode',
          'extendai-lab',
          'plans',
          'large-version-baseline.md',
        ),
      ),
    ).toBe(true);
  });

  test('does not claim success when a duplicate plan is rejected', async () => {
    const tools = createSavePlanTool(workspaceRoot);
    await tools.execute({ name: 'duplicate', content: '- [ ] 1. First\n' }, {
      directory: workspaceRoot,
    } as any);

    const output = await tools.execute(
      { name: 'duplicate', content: '- [ ] 1. Second\n' },
      { directory: workspaceRoot } as any,
    );

    expect(output).toContain('Plan save failed.');
    expect(output).not.toContain('Plan saved successfully.');
    expect(
      readFileSync(
        join(
          workspaceRoot,
          '.opencode',
          'extendai-lab',
          'plans',
          'duplicate.md',
        ),
        'utf8',
      ),
    ).toBe('- [ ] 1. First\n');
  });
});
