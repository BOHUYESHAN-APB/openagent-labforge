/**
 * Cross-platform check if a path is inside the unified workflow directory.
 * Handles both forward slashes (Unix) and backslashes (Windows).
 * Uses path segment matching (not substring) to avoid false positives.
 */
export function isSisyphusPath(filePath: string): boolean {
  return /\.opencode[/\\]openagent-labforge[/\\]/.test(filePath) || /\.sisyphus[/\\]/.test(filePath)
}
