import { describe, expect, test } from 'bun:test';
import { mergeConfigWithPriority } from './priority';

interface TestConfig extends Record<string, unknown> {
  mode?: string;
  nested?: { enabled?: boolean; value?: string; list?: string[] };
  runtimeTargets?: { codex?: { enabled?: boolean; priority?: number } };
}

describe('mergeConfigWithPriority', () => {
  test('applies documented priority order independent of input order', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'cli', label: 'cli', config: { mode: 'cli' } },
      { priority: 'defaults', label: 'defaults', config: { mode: 'default' } },
      { priority: 'project', label: 'project', config: { mode: 'project' } },
    ]);

    expect(result.config.mode).toBe('cli');
    expect(result.sources).toEqual(['defaults', 'project', 'cli']);
  });

  test('deep merges plain objects', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      {
        priority: 'defaults',
        label: 'defaults',
        config: { nested: { enabled: false, value: 'a' } },
      },
      {
        priority: 'project',
        label: 'project',
        config: { nested: { enabled: true } },
      },
    ]);

    expect(result.config.nested).toEqual({ enabled: true, value: 'a' });
  });

  test('arrays replace rather than concatenate', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      {
        priority: 'defaults',
        label: 'defaults',
        config: { nested: { list: ['a'] } },
      },
      {
        priority: 'project',
        label: 'project',
        config: { nested: { list: ['b'] } },
      },
    ]);

    expect(result.config.nested?.list).toEqual(['b']);
  });

  test('records conflicts with source labels and paths', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'defaults', label: 'defaults', config: { mode: 'a' } },
      { priority: 'user-global', label: 'global', config: { mode: 'b' } },
    ]);

    expect(result.conflicts).toEqual([
      {
        path: 'mode',
        previousSource: 'defaults',
        nextSource: 'global',
        previousValue: 'a',
        nextValue: 'b',
      },
    ]);
  });

  test('does not record conflicts when values are equal', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'defaults', label: 'defaults', config: { mode: 'same' } },
      { priority: 'project', label: 'project', config: { mode: 'same' } },
    ]);

    expect(result.conflicts).toEqual([]);
  });

  test('runtime profile overrides project config', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'project', label: 'project', config: { mode: 'project' } },
      {
        priority: 'runtime-profile',
        label: 'runtime',
        config: { mode: 'runtime' },
      },
    ]);

    expect(result.config.mode).toBe('runtime');
  });

  test('cli overrides runtime profile config', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      {
        priority: 'runtime-profile',
        label: 'runtime',
        config: { mode: 'runtime' },
      },
      { priority: 'cli', label: 'cli', config: { mode: 'cli' } },
    ]);

    expect(result.config.mode).toBe('cli');
  });

  test('user-global overrides defaults', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'defaults', label: 'defaults', config: { mode: 'default' } },
      {
        priority: 'user-global',
        label: 'global',
        config: { mode: 'global' },
      },
    ]);

    expect(result.config.mode).toBe('global');
  });

  test('project overrides user-global config', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      {
        priority: 'user-global',
        label: 'global',
        config: { mode: 'global' },
      },
      { priority: 'project', label: 'project', config: { mode: 'project' } },
    ]);

    expect(result.config.mode).toBe('project');
  });

  test('merges nested runtime target config with conflict records', () => {
    const result = mergeConfigWithPriority<TestConfig>([
      {
        priority: 'defaults',
        label: 'defaults',
        config: { runtimeTargets: { codex: { enabled: false, priority: 10 } } },
      },
      {
        priority: 'cli',
        label: 'cli',
        config: { runtimeTargets: { codex: { enabled: true } } },
      },
    ]);

    expect(result.config.runtimeTargets?.codex).toEqual({
      enabled: true,
      priority: 10,
    });
    expect(result.conflicts.map((item) => item.path)).toContain(
      'runtimeTargets.codex.enabled',
    );
  });

  test('returns cloned config values', () => {
    const source = { nested: { list: ['a'] } };
    const result = mergeConfigWithPriority<TestConfig>([
      { priority: 'defaults', label: 'defaults', config: source },
    ]);

    source.nested.list.push('mutated');
    expect(result.config.nested?.list).toEqual(['a']);
  });
});
