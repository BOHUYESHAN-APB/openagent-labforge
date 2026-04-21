import { existsSync, writeFileSync, renameSync, unlinkSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

/**
 * Write a file atomically to prevent corruption from crashes or concurrent writes.
 *
 * This function writes to a temporary file first, then renames it to the target path.
 * On Windows, it handles the case where renameSync cannot overwrite existing files
 * by deleting the target file first if needed.
 *
 * Benefits:
 * - Prevents partial writes if the process crashes
 * - Prevents corruption from concurrent writes
 * - Ensures the file is either fully written or not written at all
 *
 * @param path - Target file path
 * @param content - Content to write
 * @param encoding - File encoding (default: "utf-8")
 *
 * @throws Error if the write operation fails
 *
 * @example
 * ```typescript
 * // Write a checkpoint file atomically
 * writeFileAtomically(
 *   ".opencode/openagent-labforge/checkpoints/auto/latest.md",
 *   checkpointContent
 * )
 * ```
 */
export function writeFileAtomically(
  path: string,
  content: string,
  encoding: BufferEncoding = "utf-8"
): void {
  const dir = dirname(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Create a unique temporary file name
  const tempPath = `${path}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`

  try {
    // Write to temporary file
    writeFileSync(tempPath, content, encoding)

    try {
      // Try to rename (atomic operation on most systems)
      renameSync(tempPath, path)
    } catch (renameError) {
      // Windows: renameSync cannot overwrite existing files
      // Delete the target file first, then retry
      if (existsSync(path)) {
        try {
          unlinkSync(path)
        } catch {
          // Ignore deletion errors, retry rename anyway
        }
      }
      renameSync(tempPath, path)
    }
  } catch (error) {
    // Clean up temporary file on any error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error
  }
}

/**
 * Write JSON data atomically with proper formatting.
 *
 * Convenience function that combines JSON.stringify with atomic file writing.
 *
 * @param path - Target file path
 * @param data - Data to serialize as JSON
 * @param pretty - Whether to pretty-print the JSON (default: true)
 *
 * @example
 * ```typescript
 * writeJSONAtomically(
 *   ".opencode/openagent-labforge/runtime/session/context-pressure.json",
 *   { carried_tokens: 150000, level: 2 }
 * )
 * ```
 */
export function writeJSONAtomically(path: string, data: unknown, pretty = true): void {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  writeFileAtomically(path, content, "utf-8")
}
