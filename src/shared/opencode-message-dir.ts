import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { MESSAGE_STORAGE } from "./opencode-storage-paths"
import { isSqliteBackend } from "./opencode-storage-detection"
import { log } from "./logger"

const MESSAGE_DIR_CACHE_TTL_MS = 30000

const messageDirCache = new Map<string, { expiresAt: number; path: string | null }>()

export function getMessageDir(sessionID: string): string | null {
  if (!sessionID.startsWith("ses_")) return null
  if (/[/\\]|\.\./.test(sessionID)) return null
  if (isSqliteBackend()) return null
  if (!existsSync(MESSAGE_STORAGE)) return null

  const now = Date.now()
  const cached = messageDirCache.get(sessionID)
  if (cached && cached.expiresAt > now) {
    return cached.path
  }

  const directPath = join(MESSAGE_STORAGE, sessionID)
  if (existsSync(directPath)) {
    messageDirCache.set(sessionID, {
      expiresAt: now + MESSAGE_DIR_CACHE_TTL_MS,
      path: directPath,
    })
    return directPath
  }

  try {
    for (const dir of readdirSync(MESSAGE_STORAGE)) {
      const sessionPath = join(MESSAGE_STORAGE, dir, sessionID)
      if (existsSync(sessionPath)) {
        messageDirCache.set(sessionID, {
          expiresAt: now + MESSAGE_DIR_CACHE_TTL_MS,
          path: sessionPath,
        })
        return sessionPath
      }
    }
  } catch (error) {
    log("[opencode-message-dir] Failed to scan message directories", { sessionID, error: String(error) })
    return null
  }

  messageDirCache.set(sessionID, {
    expiresAt: now + MESSAGE_DIR_CACHE_TTL_MS,
    path: null,
  })

  return null
}
