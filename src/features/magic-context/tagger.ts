import { getNextTagNumber, addTag, type TagEntry } from "./storage/tags-storage"

/**
 * Parse tag range string into individual tag numbers
 * Examples: "3-5,12" → [3,4,5,12], "1,2,9" → [1,2,9]
 */
export function parseTagRange(rangeStr: string): number[] {
  const tags: number[] = []
  const parts = rangeStr.split(",").map(p => p.trim())

  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(n => Number.parseInt(n.trim(), 10))
      if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          tags.push(i)
        }
      }
    } else {
      const num = Number.parseInt(part, 10)
      if (!Number.isNaN(num)) {
        tags.push(num)
      }
    }
  }

  return [...new Set(tags)].sort((a, b) => a - b)
}

/**
 * Create a tag for a message
 */
export function createMessageTag(
  projectDir: string,
  sessionId: string,
  messageId: string,
  content: string,
): TagEntry {
  const tagNumber = getNextTagNumber(projectDir, sessionId)
  const tag: TagEntry = {
    tagNumber,
    messageId,
    sessionId,
    type: "message",
    status: "active",
    byteSize: Buffer.byteLength(content, "utf-8"),
    createdAt: Date.now(),
  }

  addTag(projectDir, tag)
  return tag
}

/**
 * Format tag for injection into message content
 */
export function formatTag(tagNumber: number): string {
  return `§${tagNumber}§`
}

/**
 * Extract tag number from formatted tag string
 */
export function extractTagNumber(tagStr: string): number | null {
  const match = tagStr.match(/§(\d+)§/)
  return match ? Number.parseInt(match[1], 10) : null
}

/**
 * Check if content contains a tag
 */
export function hasTag(content: string): boolean {
  return /§\d+§/.test(content)
}

/**
 * Get all tag numbers from content
 */
export function extractAllTags(content: string): number[] {
  const matches = content.matchAll(/§(\d+)§/g)
  return Array.from(matches, m => Number.parseInt(m[1], 10))
}
