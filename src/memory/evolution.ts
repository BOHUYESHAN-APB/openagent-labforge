import {
  canPromoteCapsule,
  clampConfidence,
  createPromotedBehaviorFromCapsule,
} from './policy';
import type {
  MemoryCapsule,
  MemoryCapsuleKind,
  MemoryProvenance,
  MemoryScope,
  MemoryValidationStatus,
  PromotedBehavior,
  PromotedBehaviorKind,
} from './types';

export interface ExperienceObservation {
  title: string;
  content: string;
  kind: MemoryCapsuleKind;
  scope: MemoryScope;
  confidence?: number;
  validationStatus?: MemoryValidationStatus;
  tags?: string[];
  provenance: MemoryProvenance;
  rollbackId?: string;
}

export interface EvolutionDecision {
  action: 'keep-capsule' | 'promote' | 'reject';
  reason: string;
}

export function captureExperience(
  observation: ExperienceObservation,
): MemoryCapsule {
  const now = Date.now();
  return {
    id: `capsule_${now.toString(36)}`,
    kind: observation.kind,
    title: observation.title,
    content: observation.content,
    scope: observation.scope,
    confidence: clampConfidence(observation.confidence ?? 0.5),
    validationStatus: observation.validationStatus ?? 'unverified',
    tags: [...(observation.tags ?? [])],
    provenance: {
      ...observation.provenance,
      createdAt: observation.provenance.createdAt || now,
      updatedAt: now,
    },
    rollbackId: observation.rollbackId,
  };
}

export function evaluateExperience(
  capsule: MemoryCapsule,
  minimumConfidence = 0.8,
): EvolutionDecision {
  if (capsule.validationStatus === 'rejected') {
    return {
      action: 'reject',
      reason: 'capsule was explicitly rejected',
    };
  }

  if (canPromoteCapsule(capsule, minimumConfidence)) {
    return {
      action: 'promote',
      reason: 'capsule met confidence and validation requirements',
    };
  }

  return {
    action: 'keep-capsule',
    reason:
      'capsule should remain durable memory until more evidence is collected',
  };
}

export function promoteExperience(input: {
  capsule: MemoryCapsule;
  kind: PromotedBehaviorKind;
  minimumConfidence?: number;
  title?: string;
  rule?: string;
}): PromotedBehavior | null {
  const decision = evaluateExperience(input.capsule, input.minimumConfidence);
  if (decision.action !== 'promote') {
    return null;
  }

  return createPromotedBehaviorFromCapsule({
    capsule: input.capsule,
    kind: input.kind,
    title: input.title,
    rule: input.rule,
  });
}

export function disablePromotedBehavior(
  behavior: PromotedBehavior,
): PromotedBehavior {
  return {
    ...behavior,
    enabled: false,
    provenance: {
      ...behavior.provenance,
      updatedAt: Date.now(),
    },
  };
}
