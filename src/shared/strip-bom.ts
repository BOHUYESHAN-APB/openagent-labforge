import { readFileSync } from "node:fs"

/**
 * Strip UTF-8 BOM (Byte Order Mark) from string content.
 *
 * Some Windows editors (like Notepad) add UTF-8 BOM (0xFEFF) at the beginning of files,
 * which can cause JSON/JSONC parsing errors. This function removes it if present.
 *
 * @param content - The string content that may contain a BOM
 * @returns The content with BOM removed if it was present
 *
 * @example
 * ```typescript
 * const withBOM = "\uFEFF{\"key\": \"value\"}"
 * const cleaned = stripBOM(withBOM) // "{\"key\": \"value\"}"
 * ```
 */
export function stripBOM(content: string): string {
  if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
    return content.slice(1)
  }
  return content
}

/**
 * Read a file and strip UTF-8 BOM if present.
 *
 * Convenience function that combines fs.readFileSync with BOM stripping.
 * Useful for reading configuration files that may have been edited on Windows.
 *
 * @param path - Path to the file to read
 * @param encoding - File encoding (default: "utf-8")
 * @returns File content with BOM removed if it was present
 *
 * @example
 * ```typescript
 * const config = readFileStripBOM(".opencode/config.jsonc")
 * const parsed = JSON.parse(config)
 * ```
 */
export function readFileStripBOM(path: string, encoding: BufferEncoding = "utf-8"): string {
  const content = readFileSync(path, encoding)
  return stripBOM(content)
}
