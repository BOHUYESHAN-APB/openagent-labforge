import { describe, expect, test } from 'bun:test';
import { createRuntimeDoctorMatrix, createRuntimeDoctorReport } from './doctor';
import { PHASE_ONE_RUNTIME_IDS } from './types';

describe('runtime doctor reports', () => {
  test('summarizes a phase-one runtime capability state', () => {
    const report = createRuntimeDoctorReport('opencode');

    expect(report.runtimeId).toBe('opencode');
    expect(report.tier).toBe('full-plugin');
    expect(report.priority).toBe('phase-1');
    expect(report.capabilitySummary.available).toBeGreaterThan(0);
    expect(report.missingCapabilities).toEqual([]);
  });

  test('creates matrix for all phase-one runtimes', () => {
    const matrix = createRuntimeDoctorMatrix(PHASE_ONE_RUNTIME_IDS);

    expect(matrix.map((report) => report.runtimeId)).toEqual([
      'opencode',
      'openclaude',
      'codex',
    ]);
    expect(
      matrix.some((report) =>
        report.degradedCapabilities.includes('subagents'),
      ),
    ).toBe(true);
  });
});
