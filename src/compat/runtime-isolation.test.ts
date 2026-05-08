import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createRuntimeIsolation,
  normalizeRuntimeId,
} from './runtime-isolation';

describe('runtime isolation', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'runtime-isolation-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  test('creates separate directories per runtime and session', () => {
    const opencode = createRuntimeIsolation({
      workspaceRoot,
      runtimeId: 'OpenCode',
      sessionId: 'main',
    });
    const codex = createRuntimeIsolation({
      workspaceRoot,
      runtimeId: 'codex',
      sessionId: 'main',
    });

    expect(opencode.stateDir).not.toBe(codex.stateDir);
    expect(opencode.tempDir).not.toBe(codex.tempDir);
    expect(existsSync(opencode.sessionDir)).toBe(true);
    expect(existsSync(codex.sessionDir)).toBe(true);
  });

  test('separates sessions within the same runtime', () => {
    const first = createRuntimeIsolation({
      workspaceRoot,
      runtimeId: 'claude-code',
      sessionId: 'alpha',
    });
    const second = createRuntimeIsolation({
      workspaceRoot,
      runtimeId: 'claude-code',
      sessionId: 'beta',
    });

    expect(first.stateDir).toBe(second.stateDir);
    expect(first.sessionDir).not.toBe(second.sessionDir);
    expect(first.tempDir).not.toBe(second.tempDir);
  });

  test('normalizes runtime identifiers safely', () => {
    expect(normalizeRuntimeId('Claude Code')).toBe('claude-code');
    expect(() => normalizeRuntimeId('...')).toThrow('Invalid runtime id');
  });
});
