import { describe, expect, test } from 'bun:test';
import {
  applyCapabilityDegradation,
  CAPABILITY_DEGRADATION_RULES,
  getDegradationRule,
  getRuntimeDegradations,
} from './degradation';
import { getRuntimeCompatibilityProfile } from './types';

describe('compat capability degradation', () => {
  test('declares the expected baseline degradation rules', () => {
    expect(CAPABILITY_DEGRADATION_RULES.map((rule) => rule.capability)).toEqual(
      ['subagents', 'hooks', 'mcp'],
    );
  });

  test('returns degradation guidance for degraded phase-one runtime capabilities', () => {
    const runtime = getRuntimeCompatibilityProfile('openclaude');
    if (!runtime) throw new Error('Expected openclaude runtime profile');

    const degradations = getRuntimeDegradations(runtime);
    const subagents = degradations.find(
      (degradation) => degradation.capability === 'subagents',
    );

    expect(subagents).toBeDefined();
    expect(subagents?.degradeTo).toBe('main-only/checklists');
    expect(subagents?.userImpact).toContain('child sessions');
  });

  test('returns no degradation for capabilities without a rule', () => {
    expect(getDegradationRule('agents')).toBeUndefined();
  });

  test('returns no degradation when capability is available', () => {
    expect(
      applyCapabilityDegradation({
        capability: 'mcp',
        runtimeId: 'opencode',
        status: 'available',
        reason: 'OpenCode declares mcp support.',
      }),
    ).toBeUndefined();
  });
});
