import { describe, expect, test } from 'bun:test';
import { DEFAULT_VISIBLE_AGENT_NAME } from './constants';
import { applyDefaultAgent, resolvePreferredDefaultAgent } from './default-agent';

describe('applyDefaultAgent', () => {
  test('defaults to visible engineer agent when unset', () => {
    const config: Record<string, unknown> = {};

    applyDefaultAgent(config, true);

    expect(config.default_agent).toBe(DEFAULT_VISIBLE_AGENT_NAME);
    expect(config.default_agent).toBe('engineer');
  });

  test('does not override user configured default agent', () => {
    const config: Record<string, unknown> = { default_agent: 'bio-analyst' };

    applyDefaultAgent(config, true);

    expect(config.default_agent).toBe('bio-analyst');
  });

  test('does nothing when default-agent behavior is disabled', () => {
    const config: Record<string, unknown> = {};

    applyDefaultAgent(config, false);

    expect(config.default_agent).toBeUndefined();
  });

  test('uses configured preferred visible default agent when provided', () => {
    const config: Record<string, unknown> = {};

    applyDefaultAgent(config, true, 'bio-analyst');

    expect(config.default_agent).toBe('bio-analyst');
  });
});

describe('resolvePreferredDefaultAgent', () => {
  test('prefers explicit defaultAgentName over deprecated defaultVisibleAgent', () => {
    expect(
      resolvePreferredDefaultAgent({
        defaultAgentName: 'engineer',
        defaultVisibleAgent: 'bio-analyst',
      }),
    ).toBe('engineer');
  });

  test('falls back to deprecated defaultVisibleAgent during migration window', () => {
    expect(resolvePreferredDefaultAgent({ defaultVisibleAgent: 'bio-analyst' })).toBe(
      'bio-analyst',
    );
  });
});
