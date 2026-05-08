import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getProjectStateDir } from '../paths/plugin-paths';

export interface RuntimeIsolationInput {
  workspaceRoot: string;
  runtimeId: string;
  sessionId?: string;
}

export interface RuntimeIsolation {
  runtimeId: string;
  sessionId: string;
  cwd: string;
  stateDir: string;
  tempDir: string;
  logDir: string;
  cacheDir: string;
  tokenDir: string;
  sessionDir: string;
}

export function createRuntimeIsolation(
  input: RuntimeIsolationInput,
): RuntimeIsolation {
  const runtimeId = normalizeRuntimeId(input.runtimeId);
  const sessionId = normalizeRuntimeId(input.sessionId ?? 'default');
  const stateDir = join(
    getProjectStateDir(input.workspaceRoot),
    'runtimes',
    runtimeId,
  );
  const isolation = {
    runtimeId,
    sessionId,
    cwd: input.workspaceRoot,
    stateDir,
    tempDir: join(stateDir, 'tmp', sessionId),
    logDir: join(stateDir, 'logs'),
    cacheDir: join(stateDir, 'cache'),
    tokenDir: join(stateDir, 'tokens'),
    sessionDir: join(stateDir, 'sessions', sessionId),
  };

  mkdirSync(isolation.tempDir, { recursive: true });
  mkdirSync(isolation.logDir, { recursive: true });
  mkdirSync(isolation.cacheDir, { recursive: true });
  mkdirSync(isolation.tokenDir, { recursive: true });
  mkdirSync(isolation.sessionDir, { recursive: true });

  return isolation;
}

export function normalizeRuntimeId(id: string): string {
  const normalized = id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized || !/[a-z0-9]/.test(normalized)) {
    throw new Error(`Invalid runtime id: ${id}`);
  }
  return normalized;
}
