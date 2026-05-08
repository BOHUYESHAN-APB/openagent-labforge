import type {
  MemoryCapsule,
  MemoryValidationStatus,
  PromotedBehavior,
  PromotedBehaviorKind,
} from './types';

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function canPromoteCapsule(
  capsule: MemoryCapsule,
  minimumConfidence = 0.8,
): boolean {
  return (
    clampConfidence(capsule.confidence) >= minimumConfidence &&
    capsule.validationStatus !== 'unverified' &&
    capsule.validationStatus !== 'rejected'
  );
}

export function summarizeValidationStatus(
  status: MemoryValidationStatus,
): string {
  switch (status) {
    case 'tested':
      return 'validated by tests';
    case 'reviewed':
      return 'validated by review';
    case 'user-confirmed':
      return 'validated by user confirmation';
    case 'rejected':
      return 'explicitly rejected';
    default:
      return 'not yet validated';
  }
}

export function createPromotedBehaviorFromCapsule(input: {
  capsule: MemoryCapsule;
  kind: PromotedBehaviorKind;
  title?: string;
  rule?: string;
}): PromotedBehavior {
  const { capsule, kind } = input;
  return {
    id: `behavior_${capsule.id}`,
    kind,
    title: input.title ?? capsule.title,
    rule: input.rule ?? capsule.content,
    enabled: true,
    scope: capsule.scope === 'session' ? 'workspace' : capsule.scope,
    confidence: clampConfidence(capsule.confidence),
    validationStatus: capsule.validationStatus,
    sourceCapsuleIds: [capsule.id],
    provenance: {
      ...capsule.provenance,
      updatedAt: Date.now(),
    },
    rollbackId: capsule.rollbackId,
  };
}
