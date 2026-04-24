import { join } from "node:path"
import { getMagicContextDir, readJSONFile, writeJSON } from "./file-storage"

export type PendingOpType = "drop" | "compress" | "expand"

export interface PendingOperation {
  id: string
  sessionId: string
  type: PendingOpType
  tagIds?: number[]
  level?: number
  profile?: "engineering" | "bio"
  totalInputTokens?: number
  usageRatio?: number
  timestamp: number
  reason: string
}

interface PendingOpsRegistry {
  operations: PendingOperation[]
}

function getPendingOpsPath(projectDir: string): string {
  return join(getMagicContextDir(projectDir), "pending-ops.json")
}

/**
 * Load pending operations registry
 */
export function loadPendingOps(projectDir: string): PendingOpsRegistry {
  const path = getPendingOpsPath(projectDir)
  const data = readJSONFile<PendingOpsRegistry>(path)
  return data ?? { operations: [] }
}

/**
 * Save pending operations registry
 */
export function savePendingOps(projectDir: string, registry: PendingOpsRegistry): void {
  const path = getPendingOpsPath(projectDir)
  writeJSON(path, registry)
}

/**
 * Queue a new pending operation
 */
export function queuePendingOp(projectDir: string, op: PendingOperation): void {
  const registry = loadPendingOps(projectDir)
  registry.operations.push(op)
  savePendingOps(projectDir, registry)
}

/**
 * Get pending operations for a session
 */
export function getSessionPendingOps(projectDir: string, sessionId: string): PendingOperation[] {
  const registry = loadPendingOps(projectDir)
  return registry.operations.filter(op => op.sessionId === sessionId)
}

/**
 * Remove a pending operation by ID
 */
export function removePendingOp(projectDir: string, opId: string): void {
  const registry = loadPendingOps(projectDir)
  registry.operations = registry.operations.filter(op => op.id !== opId)
  savePendingOps(projectDir, registry)
}

/**
 * Clear all pending operations for a session
 */
export function clearSessionPendingOps(projectDir: string, sessionId: string): void {
  const registry = loadPendingOps(projectDir)
  registry.operations = registry.operations.filter(op => op.sessionId !== sessionId)
  savePendingOps(projectDir, registry)
}

/**
 * Get all pending operations (for background processing)
 */
export function getAllPendingOps(projectDir: string): PendingOperation[] {
  const registry = loadPendingOps(projectDir)
  return registry.operations
}

/**
 * Generate a unique operation ID
 */
export function generateOpId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
