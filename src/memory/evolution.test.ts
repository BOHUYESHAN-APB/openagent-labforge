import { describe, expect, test } from 'bun:test';
import {
  captureExperience,
  disablePromotedBehavior,
  evaluateExperience,
  promoteExperience,
} from './evolution';

describe('memory evolution loop', () => {
  test('captures experience as a durable capsule with provenance', () => {
    const capsule = captureExperience({
      title: 'Prefer dry-run first',
      content: 'Always create an install plan before writing files.',
      kind: 'workflow',
      scope: 'workspace',
      confidence: 0.82,
      validationStatus: 'reviewed',
      tags: ['installer', 'safety'],
      provenance: {
        sourceKind: 'review',
        workspaceRoot: 'repo',
        createdAt: 1,
        updatedAt: 1,
      },
    });

    expect(capsule.kind).toBe('workflow');
    expect(capsule.scope).toBe('workspace');
    expect(capsule.tags).toEqual(['installer', 'safety']);
    expect(capsule.provenance.sourceKind).toBe('review');
  });

  test('evaluates capsules into keep/promote/reject decisions', () => {
    const promotable = captureExperience({
      title: 'Promotable',
      content: 'Stable rule',
      kind: 'workflow',
      scope: 'workspace',
      confidence: 0.91,
      validationStatus: 'tested',
      provenance: {
        sourceKind: 'checkpoint',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const pending = captureExperience({
      title: 'Pending',
      content: 'Need more evidence',
      kind: 'summary',
      scope: 'session',
      confidence: 0.6,
      validationStatus: 'unverified',
      provenance: {
        sourceKind: 'auto',
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const rejected = captureExperience({
      title: 'Rejected',
      content: 'Bad memory',
      kind: 'warning',
      scope: 'workspace',
      confidence: 0.95,
      validationStatus: 'rejected',
      provenance: {
        sourceKind: 'manual',
        createdAt: 1,
        updatedAt: 1,
      },
    });

    expect(evaluateExperience(promotable).action).toBe('promote');
    expect(evaluateExperience(pending).action).toBe('keep-capsule');
    expect(evaluateExperience(rejected).action).toBe('reject');
  });

  test('promotes only eligible capsules and supports disabling behavior', () => {
    const capsule = captureExperience({
      title: 'Review rule',
      content: 'Re-read the earliest real user request before approval.',
      kind: 'workflow',
      scope: 'repository',
      confidence: 0.93,
      validationStatus: 'reviewed',
      provenance: {
        sourceKind: 'review',
        repositoryId: 'repo',
        createdAt: 1,
        updatedAt: 1,
      },
    });

    const behavior = promoteExperience({
      capsule,
      kind: 'review-rule',
    });

    if (!behavior) {
      throw new Error('Expected behavior to be promoted');
    }

    expect(behavior.enabled).toBe(true);
    expect(behavior.scope).toBe('repository');

    const beforeUpdatedAt = behavior.provenance.updatedAt;
    const disabled = disablePromotedBehavior(behavior);
    expect(disabled.enabled).toBe(false);
    expect(disabled.provenance.updatedAt).toBeGreaterThanOrEqual(
      beforeUpdatedAt,
    );
  });
});
