import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { writeFileAtomically, writeJSONAtomically } from "../../../shared/write-file-atomically"

/**
 * Get the base directory for magic-context storage
 */
export function getMagicContextDir(projectDir: string): string {
  return join(projectDir, ".opencode", "openagent-labforge", "magic-context")
}

/**
 * Ensure a directory exists, creating it recursively if needed
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

/**
 * Read a JSON file with error handling
 */
export function readJSONFile<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null
    const content = readFileSync(path, "utf-8")
    return JSON.parse(content) as T
  } catch (error) {
    return null
  }
}

/**
 * Write a JSON file atomically
 */
export function writeJSON<T>(path: string, data: T): void {
  ensureDir(dirname(path))
  writeJSONAtomically(path, data)
}

/**
 * Write a text file atomically
 */
export function writeText(path: string, content: string): void {
  ensureDir(dirname(path))
  writeFileAtomically(path, content, "utf-8")
}

/**
 * Read a text file with error handling
 */
export function readTextFile(path: string): string | null {
  try {
    if (!existsSync(path)) return null
    return readFileSync(path, "utf-8")
  } catch (error) {
    return null
  }
}

/**
 * Check if a file exists
 */
export function fileExists(path: string): boolean {
  return existsSync(path)
}
