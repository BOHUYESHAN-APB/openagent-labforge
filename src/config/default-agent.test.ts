import { describe, expect, test } from 'bun:test';
import { DEFAULT_VISIBLE_AGENT_NAME } from './constants';
import { applyDefaultAgent } from './default-agent';

describe('applyDefaultAgent', () => {
  test('defaults to visible bio-analyst agent when unset', () => {
    const config: Record<string, unknown> = {};

    applyDefaultAgent(config, true);

    expect(config.default_agent).toBe(DEFAULT_VISIBLE_AGENT_NAME);
    expect(config.default_agent).toBe('bio-analyst');
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
});
