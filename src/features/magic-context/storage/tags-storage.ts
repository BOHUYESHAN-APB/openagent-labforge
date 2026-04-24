import { join } from "node:path"
import { getMagicContextDir, readJSONFile, writeJSON } from "./file-storage"

export type TagStatus = "active" | "dropped" | "compacted"
export type TagType = "message" | "tool" | "file"

export interface TagEntry {
  tagNumber: number
  messageId: string
  sessionId: string
  type: TagType
  status: TagStatus
  byteSize: number
  createdAt: number
}

interface TagRegistry {
  tags: TagEntry[]
  nextTagNumber: number
}

function getTagsPath(projectDir: string): string {
  return join(getMagicContextDir(projectDir), "tags.json")
}

/**
 * Load the tag registry for a project
 */
export function loadTagRegistry(projectDir: string): TagRegistry {
  const path = getTagsPath(projectDir)
  const data = readJSONFile<TagRegistry>(path)
  return data ?? { tags: [], nextTagNumber: 1 }
}

/**
 * Save the tag registry
 */
export function saveTagRegistry(projectDir: string, registry: TagRegistry): void {
  const path = getTagsPath(projectDir)
  writeJSON(path, registry)
}

/**
 * Get the next available tag number for a session
 */
export function getNextTagNumber(projectDir: string, sessionId: string): number {
  const registry = loadTagRegistry(projectDir)
  const sessionTags = registry.tags.filter(t => t.sessionId === sessionId)

  if (sessionTags.length === 0) {
    return 1
  }

  const maxTag = Math.max(...sessionTags.map(t => t.tagNumber))
  return maxTag + 1
}

/**
 * Add a new tag to the registry
 */
export function addTag(projectDir: string, tag: TagEntry): void {
  const registry = loadTagRegistry(projectDir)
  registry.tags.push(tag)
  registry.nextTagNumber = Math.max(registry.nextTagNumber, tag.tagNumber + 1)
  saveTagRegistry(projectDir, registry)
}

/**
 * Get tags for a specific session
 */
export function getSessionTags(projectDir: string, sessionId: string): TagEntry[] {
  const registry = loadTagRegistry(projectDir)
  return registry.tags.filter(t => t.sessionId === sessionId)
}

/**
 * Get a specific tag by number and session
 */
export function getTag(projectDir: string, sessionId: string, tagNumber: number): TagEntry | null {
  const registry = loadTagRegistry(projectDir)
  return registry.tags.find(t => t.sessionId === sessionId && t.tagNumber === tagNumber) ?? null
}

/**
 * Update tag status
 */
export function updateTagStatus(
  projectDir: string,
  sessionId: string,
  tagNumber: number,
  status: TagStatus
): void {
  const registry = loadTagRegistry(projectDir)
  const tag = registry.tags.find(t => t.sessionId === sessionId && t.tagNumber === tagNumber)

  if (tag) {
    tag.status = status
    saveTagRegistry(projectDir, registry)
  }
}

/**
 * Get the last N tags for a session (protected tags)
 */
export function getProtectedTags(projectDir: string, sessionId: string, count: number): number[] {
  const tags = getSessionTags(projectDir, sessionId)
  const activeTags = tags.filter(t => t.status === "active").sort((a, b) => b.tagNumber - a.tagNumber)
  return activeTags.slice(0, count).map(t => t.tagNumber)
}

/**
 * Clear all tags for a session
 */
export function clearSessionTags(projectDir: string, sessionId: string): void {
  const registry = loadTagRegistry(projectDir)
  registry.tags = registry.tags.filter(t => t.sessionId !== sessionId)
  saveTagRegistry(projectDir, registry)
}
