type SessionInfo = {
  id?: string
  parentID?: string
  title?: string
}

const forkedSessions = new Set<string>()

function looksLikeForkTitle(title: string | undefined): boolean {
  if (!title) return false
  return /\(fork\s*#\d+\)/i.test(title)
}

export function markForkedSession(info?: SessionInfo): void {
  if (info?.id && (info.parentID || looksLikeForkTitle(info.title))) {
    forkedSessions.add(info.id)
  }
}

export function isForkedSession(sessionID: string | undefined): boolean {
  if (!sessionID) return false
  return forkedSessions.has(sessionID)
}

export function clearForkedSession(sessionID: string | undefined): void {
  if (!sessionID) return
  forkedSessions.delete(sessionID)
}

export function resetForkedSessionsForTesting(): void {
  forkedSessions.clear()
}
