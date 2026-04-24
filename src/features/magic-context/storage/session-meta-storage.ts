import { join } from "node:path"
import { getMagicContextDir, readJSONFile, writeJSON } from "./file-storage"

export interface SessionMeta {
  sessionId: string
  cacheTtl: string // "5m", "10m", "1h"
  lastResponseTime: number
  lastCompressionTime?: number
  compressionCount: number
  createdAt: number
  updatedAt: number
}

function getSessionMetaPath(projectDir: string, sessionId: string): string {
  return join(getMagicContextDir(projectDir), "session-meta", `${sessionId}.json`)
}

/**
 * Load session metadata
 */
export function loadSessionMeta(projectDir: string, sessionId: string): SessionMeta | null {
  const path = getSessionMetaPath(projectDir, sessionId)
  return readJSONFile<SessionMeta>(path)
}

/**
 * Save session metadata
 */
export function saveSessionMeta(projectDir: string, meta: SessionMeta): void {
  const path = getSessionMetaPath(projectDir, meta.sessionId)
  writeJSON(path, meta)
}

/**
 * Update session metadata (partial update)
 */
export function updateSessionMeta(
  projectDir: string,
  sessionId: string,
  updates: Partial<Omit<SessionMeta, "sessionId" | "createdAt">>
): void {
  let meta = loadSessionMeta(projectDir, sessionId)

  if (!meta) {
    // Create new metadata
    meta = {
      sessionId,
      cacheTtl: "5m",
      lastResponseTime: Date.now(),
      compressionCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  // Apply updates
  Object.assign(meta, updates, { updatedAt: Date.now() })
  saveSessionMeta(projectDir, meta)
}

/**
 * Record a response time (updates lastResponseTime)
 */
export function recordResponseTime(projectDir: string, sessionId: string): void {
  updateSessionMeta(projectDir, sessionId, {
    lastResponseTime: Date.now(),
  })
}

/**
 * Record a compression event
 */
export function recordCompression(projectDir: string, sessionId: string): void {
  const meta = loadSessionMeta(projectDir, sessionId)
  updateSessionMeta(projectDir, sessionId, {
    lastCompressionTime: Date.now(),
    compressionCount: (meta?.compressionCount ?? 0) + 1,
  })
}

/**
 * Clear session metadata
 */
export function clearSessionMeta(projectDir: string, sessionId: string): void {
  const path = getSessionMetaPath(projectDir, sessionId)
  const fs = require("node:fs")
  if (fs.existsSync(path)) {
    fs.unlinkSync(path)
  }
}
