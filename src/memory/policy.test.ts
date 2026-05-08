import { describe, expect, test } from 'bun:test';
import {
  canPromoteCapsule,
  clampConfidence,
  createPromotedBehaviorFromCapsule,
  summarizeValidationStatus,
} from './policy';
import type { MemoryCapsule } from './types';

function createCapsule(overrides: Partial<MemoryCapsule> = {}): MemoryCapsule {
  return {
    id: 'capsule_1',
    kind: 'workflow',
    title: 'Use tight deltas',
    content: 'Prefer delta-focused updates for long sessions.',
    scope: 'workspace',
    confidence: 0.9,
    validationStatus: 'reviewed',
    tags: ['workflow'],
    provenance: {
      sourceKind: 'review',
      createdAt: 1,
      updatedAt: 1,
      workspaceRoot: 'repo',
    },
    ...overrides,
  };
}

describe('memory evolution policy', () => {
  test('clamps confidence to 0..1', () => {
    expect(clampConfidence(-1)).toBe(0);
    expect(clampConfidence(0.42)).toBe(0.42);
    expect(clampConfidence(10)).toBe(1);
  });

  test('only promotes sufficiently validated capsules', () => {
    expect(canPromoteCapsule(createCapsule())).toBe(true);
    expect(
      canPromoteCapsule(
        createCapsule({ confidence: 0.5, validationStatus: 'reviewed' }),
      ),
    ).toBe(false);
    expect(
      canPromoteCapsule(
        createCapsule({ confidence: 0.95, validationStatus: 'unverified' }),
      ),
    ).toBe(false);
    expect(
      canPromoteCapsule(
        createCapsule({ confidence: 0.95, validationStatus: 'rejected' }),
      ),
    ).toBe(false);
  });

  test('creates promoted behavior from capsule with provenance and scope upgrade', () => {
    const behavior = createPromotedBehaviorFromCapsule({
      capsule: createCapsule({ scope: 'session' }),
      kind: 'checklist',
    });

    expect(behavior.id).toBe('behavior_capsule_1');
    expect(behavior.scope).toBe('workspace');
    expect(behavior.sourceCapsuleIds).toEqual(['capsule_1']);
    expect(behavior.validationStatus).toBe('reviewed');
  });

  test('summarizes validation states for docs and UI', () => {
    expect(summarizeValidationStatus('tested')).toBe('validated by tests');
    expect(summarizeValidationStatus('user-confirmed')).toBe(
      'validated by user confirmation',
    );
    expect(summarizeValidationStatus('unverified')).toBe('not yet validated');
  });
});
