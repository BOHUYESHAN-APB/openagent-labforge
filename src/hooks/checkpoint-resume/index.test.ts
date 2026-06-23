import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureProjectPlansDir, readBoulderState } from '../../boulder';
import { getProjectBoulderFile } from '../../paths/plugin-paths';
import { EffectiveAgentOverlayManager } from '../../utils';
import { createCheckpointResumeHook } from './index';

describe('checkpoint resume hook', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'checkpoint-resume-hook-test-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  test('restores executor overlay and boulder state from current session checkpoint', async () => {
    const plansDir = ensureProjectPlansDir(workspaceRoot);
    const planPath = join(plansDir, 'restored-plan.md');
    writeFileSync(
      planPath,
      '- [x] 1. First task\n- [ ] 2. Continue execution\n- [ ] F1. Review\n',
    );

    const checkpointDir = join(
      workspaceRoot,
      '.opencode',
      'extendai-lab',
      'checkpoints',
      'by-session',
    );
    mkdirSync(checkpointDir, { recursive: true });
    writeFileSync(
      join(checkpointDir, 's1.md'),
      `CHECKPOINT CONTEXT

RESUME INSTRUCTIONS
-------------------
Active execution plan name: restored-plan
Active execution plan path: ${planPath}
Top-level plan tasks remaining: 2
Re-read the plan, rebuild todos from current top-level checkboxes if needed, and continue until the active boulder plan is complete.
`,
    );

    const overlayManager = new EffectiveAgentOverlayManager();
    const hook = createCheckpointResumeHook(
      { directory: workspaceRoot } as Parameters<
        typeof createCheckpointResumeHook
      >[0],
      {
        overlayManager,
        getCurrentAgent: () => 'orchestrator',
      },
    );
    const output: {
      parts: Array<{ type: string; text?: string }>;
      message: { agent?: string };
    } = {
      parts: [],
      message: {},
    };

    await hook.handleCommandExecuteBefore(
      {
        command: 'ol-checkpoint-resume',
        sessionID: 's1',
        arguments: '',
      },
      output,
    );

    expect(output.message.agent).toBe('atlas');
    expect(output.parts[0]?.text).toContain(
      'Effective execution agent: @executor',
    );
    expect(output.parts[0]?.text).toContain(`Restored plan file: ${planPath}`);
    expect(output.parts[0]?.text).toContain('Control returns to: orchestrator');
    expect(existsSync(getProjectBoulderFile(workspaceRoot))).toBe(true);
    expect(readBoulderState(workspaceRoot)?.plan_name).toBe('restored-plan');
    expect(readBoulderState(workspaceRoot)?.session_ids).toContain('s1');

    const overlay = overlayManager.getCurrent('s1');
    expect(overlay?.phase).toBe('execute');
    expect(overlay?.agent).toBe('atlas');
    expect(overlay?.returnAgent).toBe('orchestrator');
  });

  test('falls back to latest checkpoint when session checkpoint is missing', async () => {
    const plansDir = ensureProjectPlansDir(workspaceRoot);
    const planPath = join(plansDir, 'fallback-plan.md');
    writeFileSync(planPath, '- [ ] 1. Continue\n- [ ] F1. Review\n');

    const checkpointDir = join(
      workspaceRoot,
      '.opencode',
      'extendai-lab',
      'checkpoints',
    );
    mkdirSync(checkpointDir, { recursive: true });
    writeFileSync(
      join(checkpointDir, 'latest.md'),
      `CHECKPOINT CONTEXT

RESUME INSTRUCTIONS
-------------------
Active execution plan name: fallback-plan
Active execution plan path: ${planPath}
Top-level plan tasks remaining: 2
`,
    );

    const hook = createCheckpointResumeHook({
      directory: workspaceRoot,
    } as Parameters<typeof createCheckpointResumeHook>[0]);
    const output: {
      parts: Array<{ type: string; text?: string }>;
      message: { agent?: string };
    } = {
      parts: [],
      message: {},
    };

    await hook.handleCommandExecuteBefore(
      {
        command: 'ol-checkpoint-resume',
        sessionID: 'missing-session',
        arguments: '',
      },
      output,
    );

    expect(output.parts[0]?.text).toContain('fallback-plan');
    expect(output.message.agent).toBe('atlas');
    expect(readBoulderState(workspaceRoot)?.plan_name).toBe('fallback-plan');
  });

  test('does nothing when checkpoint has no active execution plan', async () => {
    const checkpointDir = join(
      workspaceRoot,
      '.opencode',
      'extendai-lab',
      'checkpoints',
      'by-session',
    );
    mkdirSync(checkpointDir, { recursive: true });
    writeFileSync(join(checkpointDir, 's1.md'), 'CHECKPOINT CONTEXT\n');

    const overlayManager = new EffectiveAgentOverlayManager();
    const hook = createCheckpointResumeHook(
      { directory: workspaceRoot } as Parameters<
        typeof createCheckpointResumeHook
      >[0],
      { overlayManager },
    );
    const output: {
      parts: Array<{ type: string; text?: string }>;
      message: { agent?: string };
    } = {
      parts: [],
      message: {},
    };

    await hook.handleCommandExecuteBefore(
      {
        command: 'ol-checkpoint-resume',
        sessionID: 's1',
        arguments: '',
      },
      output,
    );

    expect(output.parts).toHaveLength(0);
    expect(output.message.agent).toBeUndefined();
    expect(overlayManager.getCurrent('s1')).toBeUndefined();
    expect(existsSync(getProjectBoulderFile(workspaceRoot))).toBe(false);
  });
});
