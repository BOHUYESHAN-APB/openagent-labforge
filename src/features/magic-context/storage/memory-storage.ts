import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { getMagicContextDir, readJSONFile, writeJSON } from "./file-storage"

export type MemoryCategory =
  | "ARCHITECTURE_DECISIONS"
  | "CONSTRAINTS"
  | "PATTERNS"
  | "BUGS_FIXED"
  | "TECHNICAL_DEBT"
  | "USER_PREFERENCES"
  | "PROJECT_CONTEXT"
  | "OTHER"

export type MemoryStatus = "active" | "permanent" | "archived"

export interface Memory {
  id: number
  projectPath: string
  category: MemoryCategory
  content: string
  normalizedHash: string // For deduplication
  sourceSessionId: string
  status: MemoryStatus
  seenCount: number
  retrievalCount: number
  createdAt: number
  updatedAt: number
}

interface MemoryRegistry {
  memories: Memory[]
  nextId: number
}

/**
 * Generate a project identity hash from directory path.
 * Uses git remote URL if available, otherwise falls back to directory path.
 *
 * NOTE: Currently uses directory path only. Future enhancement could detect
 * git remote URL for better cross-machine project identification.
 */
export function resolveProjectIdentity(directory: string): string {
  // Use directory path as project identity
  // This works well for local development and is simple to implement
  return directory
}

/**
 * Generate a normalized hash for deduplication.
 */
function generateNormalizedHash(content: string): string {
  const normalized = content.toLowerCase().trim().replace(/\s+/g, " ")
  return createHash("sha256").update(normalized).digest("hex").substring(0, 16)
}

function getMemoriesPath(directory: string, projectPath: string): string {
  const magicContextDir = getMagicContextDir(directory)
  const memoriesDir = join(magicContextDir, "memories")
  if (!existsSync(memoriesDir)) {
    mkdirSync(memoriesDir, { recursive: true })
  }

  // Use hash of project path as filename
  const projectHash = createHash("sha256").update(projectPath).digest("hex").substring(0, 16)
  return join(memoriesDir, `${projectHash}.json`)
}

function loadMemoryRegistry(directory: string, projectPath: string): MemoryRegistry {
  const path = getMemoriesPath(directory, projectPath)
  const data = readJSONFile<MemoryRegistry>(path)
  return data ?? { memories: [], nextId: 1 }
}

function saveMemoryRegistry(
  directory: string,
  projectPath: string,
  registry: MemoryRegistry,
): void {
  const path = getMemoriesPath(directory, projectPath)
  writeJSON(path, registry)
}

/**
 * Write a new memory.
 */
export function writeMemory(
  directory: string,
  sessionId: string,
  memory: {
    category: MemoryCategory
    content: string
    status?: MemoryStatus
  },
): Memory {
  const projectPath = resolveProjectIdentity(directory)
  const registry = loadMemoryRegistry(directory, projectPath)

  const normalizedHash = generateNormalizedHash(memory.content)

  // Check for duplicates
  const existing = registry.memories.find(m => m.normalizedHash === normalizedHash)
  if (existing) {
    // Update existing memory
    existing.seenCount++
    existing.updatedAt = Date.now()
    saveMemoryRegistry(directory, projectPath, registry)
    return existing
  }

  // Create new memory
  const newMemory: Memory = {
    id: registry.nextId++,
    projectPath,
    category: memory.category,
    content: memory.content,
    normalizedHash,
    sourceSessionId: sessionId,
    status: memory.status ?? "active",
    seenCount: 1,
    retrievalCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  registry.memories.push(newMemory)
  saveMemoryRegistry(directory, projectPath, registry)

  return newMemory
}

/**
 * List all memories for a project.
 */
export function listMemories(
  directory: string,
  filters?: {
    category?: MemoryCategory
    status?: MemoryStatus
  },
): Memory[] {
  const projectPath = resolveProjectIdentity(directory)
  const registry = loadMemoryRegistry(directory, projectPath)

  let memories = registry.memories

  if (filters?.category) {
    memories = memories.filter(m => m.category === filters.category)
  }

  if (filters?.status) {
    memories = memories.filter(m => m.status === filters.status)
  }

  return memories.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Update an existing memory.
 */
export function updateMemory(
  directory: string,
  memoryId: number,
  updates: {
    content?: string
    category?: MemoryCategory
    status?: MemoryStatus
  },
): Memory | null {
  const projectPath = resolveProjectIdentity(directory)
  const registry = loadMemoryRegistry(directory, projectPath)

  const memory = registry.memories.find(m => m.id === memoryId)
  if (!memory) return null

  if (updates.content !== undefined) {
    memory.content = updates.content
    memory.normalizedHash = generateNormalizedHash(updates.content)
  }

  if (updates.category !== undefined) {
    memory.category = updates.category
  }

  if (updates.status !== undefined) {
    memory.status = updates.status
  }

  memory.updatedAt = Date.now()

  saveMemoryRegistry(directory, projectPath, registry)
  return memory
}

/**
 * Delete a memory.
 */
export function deleteMemory(directory: string, memoryId: number): boolean {
  const projectPath = resolveProjectIdentity(directory)
  const registry = loadMemoryRegistry(directory, projectPath)

  const index = registry.memories.findIndex(m => m.id === memoryId)
  if (index === -1) return false

  registry.memories.splice(index, 1)
  saveMemoryRegistry(directory, projectPath, registry)

  return true
}

/**
 * Search memories by text query (simple case-insensitive search).
 */
export function searchMemories(
  directory: string,
  query: string,
  filters?: {
    category?: MemoryCategory
    status?: MemoryStatus
  },
): Memory[] {
  const memories = listMemories(directory, filters)
  const lowerQuery = query.toLowerCase()

  return memories.filter(m =>
    m.content.toLowerCase().includes(lowerQuery),
  )
}

/**
 * Increment retrieval count for a memory.
 */
export function recordMemoryRetrieval(directory: string, memoryId: number): void {
  const projectPath = resolveProjectIdentity(directory)
  const registry = loadMemoryRegistry(directory, projectPath)

  const memory = registry.memories.find(m => m.id === memoryId)
  if (memory) {
    memory.retrievalCount++
    saveMemoryRegistry(directory, projectPath, registry)
  }
}
