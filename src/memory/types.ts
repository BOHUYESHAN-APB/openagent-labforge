export type MemoryScope = 'session' | 'workspace' | 'repository' | 'global';

export type MemorySourceKind =
  | 'checkpoint'
  | 'review'
  | 'manual'
  | 'auto'
  | 'tool'
  | 'migration';

export type MemoryValidationStatus =
  | 'unverified'
  | 'tested'
  | 'reviewed'
  | 'user-confirmed'
  | 'rejected';

export type MemoryCapsuleKind =
  | 'decision'
  | 'constraint'
  | 'workflow'
  | 'preference'
  | 'handoff'
  | 'summary'
  | 'warning';

export type PromotedBehaviorKind =
  | 'checklist'
  | 'skill-note'
  | 'renderer-rule'
  | 'memory-rule'
  | 'review-rule';

export interface MemoryProvenance {
  sessionID?: string;
  conversationID?: string;
  workspaceRoot?: string;
  repositoryId?: string;
  sourceKind: MemorySourceKind;
  sourceRef?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryCapsule {
  id: string;
  kind: MemoryCapsuleKind;
  title: string;
  content: string;
  scope: MemoryScope;
  confidence: number;
  validationStatus: MemoryValidationStatus;
  tags: string[];
  provenance: MemoryProvenance;
  rollbackId?: string;
}

export interface PromotedBehavior {
  id: string;
  kind: PromotedBehaviorKind;
  title: string;
  rule: string;
  enabled: boolean;
  scope: Exclude<MemoryScope, 'session'>;
  confidence: number;
  validationStatus: MemoryValidationStatus;
  sourceCapsuleIds: string[];
  provenance: MemoryProvenance;
  rollbackId?: string;
}

export interface MemoryEvolutionSnapshot {
  rawHistory: {
    sessionID?: string;
    summary: string;
    capturedAt: number;
  }[];
  capsules: MemoryCapsule[];
  promotedBehaviors: PromotedBehavior[];
}
