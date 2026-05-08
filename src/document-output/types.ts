export type DocumentKind =
  | 'plan'
  | 'interview'
  | 'spec'
  | 'handoff'
  | 'review-report'
  | 'install-plan'
  | 'rollback-manifest';

export type DocumentFormat = 'markdown' | 'json' | 'yaml' | 'text';

export type DocumentSaveFailureCode =
  | 'invalid-name'
  | 'already-exists'
  | 'write-failed';

export interface DocumentPathPolicy {
  kind: DocumentKind;
  directory: string;
  relativeDirectory: string;
  extension: string;
}

export interface SaveDocumentInput {
  workspaceRoot: string;
  kind: DocumentKind;
  name: string;
  content: string;
  overwrite?: boolean;
  format?: DocumentFormat;
}

export interface SaveDocumentSuccess {
  ok: true;
  kind: DocumentKind;
  name: string;
  path: string;
  relativePath: string;
  bytes: number;
  overwritten: boolean;
  savedAt: string;
  format: DocumentFormat;
}

export interface SaveDocumentFailure {
  ok: false;
  kind: DocumentKind;
  code: DocumentSaveFailureCode;
  message: string;
  path?: string;
}

export type SaveDocumentResult = SaveDocumentSuccess | SaveDocumentFailure;
