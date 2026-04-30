/**
 * Notify Title - Stub implementation
 * 
 * This file provides stub implementations for the missing KDCO notify/title module.
 * These functions are referenced in notify.ts but were not included in the original copy.
 */

export type OscTitleContext = {
  sessionID?: string
  agent?: string
  status?: string
  baseTitle: string
  mayWriteOscTitle: boolean
}

export function parseOscTitleContext(
  input?: string
): OscTitleContext | null {
  const baseTitle = typeof input === "string" && input.trim() ? input.trim() : "OpenCode"
  return {
    mayWriteOscTitle: false,
    baseTitle,
  }
}

export function writeOscTitleBestEffort(
  _title: string,
  _context?: OscTitleContext
): void {
  // Stub implementation - no-op
}
