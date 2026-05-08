import { describe, expect, test } from 'bun:test';
import {
  assessCapability,
  assessRuntimeCapabilities,
  CAPABILITY_CONTRACTS,
  getCapabilityContract,
} from './capabilities';
import { getRuntimeCompatibilityProfile } from './types';

describe('compat capability contracts', () => {
  test('defines document-output and backup-rollback as first-class capabilities', () => {
    expect(getCapabilityContract('document-output')).toMatchObject({
      validation: expect.stringContaining('host-owned receipt'),
    });
    expect(getCapabilityContract('backup-rollback')).toMatchObject({
      fallback: expect.stringContaining('Dry-run only'),
    });
  });

  test('phase-one runtimes can assess every known capability', () => {
    const opencode = getRuntimeCompatibilityProfile('opencode');
    expect(opencode).toBeDefined();
    if (!opencode) return;

    const assessments = assessRuntimeCapabilities(opencode);
    expect(assessments).toHaveLength(CAPABILITY_CONTRACTS.length);
    expect(assessments.some((item) => item.status === 'available')).toBe(true);
  });

  test('missing capability degrades for full plugin runtimes', () => {
    const claude = getRuntimeCompatibilityProfile('claude-code');
    expect(claude).toBeDefined();
    if (!claude) return;

    const assessment = assessCapability(claude, 'subagents');
    expect(assessment.status).toBe('degraded');
    expect(assessment.fallback).toContain('main-only');
  });

  test('unsupported capability is unavailable for rules-only runtimes', () => {
    const cline = getRuntimeCompatibilityProfile('cline');
    expect(cline).toBeDefined();
    if (!cline) return;

    const assessment = assessCapability(cline, 'hooks');
    expect(assessment.status).toBe('unavailable');
    expect(assessment.fallback).toContain('slash commands');
  });
});
