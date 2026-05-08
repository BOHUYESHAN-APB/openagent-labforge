import type { MemoryCapsule, MemoryScope } from './types';

export type HandoffStatus = 'pending' | 'delivered' | 'cancelled';

export interface ReplayableSummary {
  id: string;
  title: string;
  summary: string;
  checkpointIds: string[];
  capsuleIds: string[];
  createdAt: number;
}

export interface HandoffMessage {
  id: string;
  sessionID?: string;
  conversationID?: string;
  scope: MemoryScope;
  title: string;
  body: string;
  capsuleIds: string[];
  checkpointIds: string[];
  summaryId?: string;
  status: HandoffStatus;
  createdAt: number;
  deliveredAt?: number;
}

export function createReplayableSummary(input: {
  title: string;
  summary: string;
  checkpointIds?: string[];
  capsules?: MemoryCapsule[];
}): ReplayableSummary {
  return {
    id: `summary_${Date.now().toString(36)}`,
    title: input.title,
    summary: input.summary,
    checkpointIds: [...(input.checkpointIds ?? [])],
    capsuleIds: (input.capsules ?? []).map((capsule) => capsule.id),
    createdAt: Date.now(),
  };
}

export function createHandoffMessage(input: {
  title: string;
  body: string;
  scope: MemoryScope;
  sessionID?: string;
  conversationID?: string;
  checkpointIds?: string[];
  summary?: ReplayableSummary;
  capsules?: MemoryCapsule[];
}): HandoffMessage {
  return {
    id: `handoff_${Date.now().toString(36)}`,
    sessionID: input.sessionID,
    conversationID: input.conversationID,
    scope: input.scope,
    title: input.title,
    body: input.body,
    capsuleIds: (input.capsules ?? []).map((capsule) => capsule.id),
    checkpointIds: [...(input.checkpointIds ?? [])],
    summaryId: input.summary?.id,
    status: 'pending',
    createdAt: Date.now(),
  };
}

export function markHandoffDelivered(message: HandoffMessage): HandoffMessage {
  return {
    ...message,
    status: 'delivered',
    deliveredAt: Date.now(),
  };
}
