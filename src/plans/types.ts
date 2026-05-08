import type { PlanFile } from '../boulder';

export type PlanSaveFailureCode =
  | 'invalid-name'
  | 'already-exists'
  | 'write-failed';

export type PlanLoadFailureCode = 'invalid-name' | 'not-found' | 'read-failed';

export interface PlanDocument {
  name: string;
  path: string;
  content: string;
  progress: PlanFile['progress'];
}

export interface SavePlanInput {
  workspaceRoot: string;
  name: string;
  content: string;
  overwrite?: boolean;
}

export interface SavePlanSuccess {
  ok: true;
  name: string;
  path: string;
  relativePath: string;
  bytes: number;
  overwritten: boolean;
  savedAt: string;
}

export interface SavePlanFailure {
  ok: false;
  code: PlanSaveFailureCode;
  message: string;
  path?: string;
}

export type SavePlanResult = SavePlanSuccess | SavePlanFailure;

export interface LoadPlanSuccess {
  ok: true;
  plan: PlanDocument;
}

export interface LoadPlanFailure {
  ok: false;
  code: PlanLoadFailureCode;
  message: string;
}

export type LoadPlanResult = LoadPlanSuccess | LoadPlanFailure;
