import { describe, expect, test } from 'bun:test';
import {
  createHandoffMessage,
  createReplayableSummary,
  markHandoffDelivered,
} from './handoff';
import type { MemoryCapsule } from './types';

function capsule(id: string): MemoryCapsule {
  return {
    id,
    kind: 'handoff',
    title: `capsule ${id}`,
    content: 'Keep deltas tight.',
    scope: 'workspace',
    confidence: 0.9,
    validationStatus: 'reviewed',
    tags: ['handoff'],
    provenance: {
      sourceKind: 'checkpoint',
      createdAt: 1,
      updatedAt: 1,
      workspaceRoot: 'repo',
    },
  };
}

describe('memory handoff baseline', () => {
  test('creates replayable summaries linked to checkpoints and capsules', () => {
    const summary = createReplayableSummary({
      title: 'Resume summary',
      summary: 'Continue from the compatibility baseline.',
      checkpointIds: ['cp1', 'cp2'],
      capsules: [capsule('c1'), capsule('c2')],
    });

    expect(summary.checkpointIds).toEqual(['cp1', 'cp2']);
    expect(summary.capsuleIds).toEqual(['c1', 'c2']);
  });

  test('creates mailbox-style handoff messages from summary and capsules', () => {
    const summary = createReplayableSummary({
      title: 'Resume summary',
      summary: 'Continue from the compatibility baseline.',
      checkpointIds: ['cp1'],
      capsules: [capsule('c1')],
    });

    const handoff = createHandoffMessage({
      title: 'Continue work',
      body: 'Finish renderer expansion next.',
      scope: 'workspace',
      sessionID: 's1',
      checkpointIds: ['cp1'],
      capsules: [capsule('c1')],
      summary,
    });

    expect(handoff.status).toBe('pending');
    expect(handoff.summaryId).toBe(summary.id);
    expect(handoff.capsuleIds).toEqual(['c1']);
    expect(handoff.checkpointIds).toEqual(['cp1']);
  });

  test('marks handoff as delivered without mutating logical payload', () => {
    const handoff = createHandoffMessage({
      title: 'Continue work',
      body: 'Finish renderer expansion next.',
      scope: 'workspace',
    });

    const delivered = markHandoffDelivered(handoff);

    expect(delivered.status).toBe('delivered');
    expect(delivered.title).toBe(handoff.title);
    expect(delivered.body).toBe(handoff.body);
    expect(delivered.deliveredAt).toBeDefined();
  });
});
