/**
 * Notify Status - Stub implementation
 * 
 * This file provides stub implementations for the missing KDCO notify/status module.
 * These functions are referenced in notify.ts but were not included in the original copy.
 */

export type CmuxSessionLogicalState = "idle" | "busy" | "animated-busy" | "waiting" | "error"

export type CmuxSessionStatusTransition = {
  from: string
  to: string
  sessionID: string
  logicalState: CmuxSessionLogicalState
}

export function buildCmuxSessionStatusTransitionForEvent(
  eventType: string,
  properties?: unknown
): CmuxSessionStatusTransition | null {
  if (!properties || typeof properties !== "object") return null
  const record = properties as Record<string, unknown>
  const sessionID = typeof record.sessionID === "string" && record.sessionID.trim() ? record.sessionID : null
  if (!sessionID) return null

  switch (eventType) {
    case "session.idle":
    case "session.completed":
      return { from: "unknown", to: eventType, sessionID, logicalState: "idle" }
    case "session.error":
      return { from: "unknown", to: eventType, sessionID, logicalState: "error" }
    case "permission.updated":
    case "permission.asked":
    case "question.asked":
      return { from: "unknown", to: eventType, sessionID, logicalState: "waiting" }
    case "session.status": {
      const status = typeof record.status === "string" ? record.status : ""
      if (status === "idle") {
        return { from: "unknown", to: eventType, sessionID, logicalState: "idle" }
      }
      return { from: "unknown", to: eventType, sessionID, logicalState: "animated-busy" }
    }
    default:
      return { from: "unknown", to: eventType, sessionID, logicalState: "busy" }
  }
}

export function buildCmuxSessionStatusTransitionForQuestionTool(
  sessionID: string
): CmuxSessionStatusTransition | null {
  if (!sessionID.trim()) return null
  return {
    from: "tool.execute.before",
    to: "question",
    sessionID,
    logicalState: "waiting",
  }
}

export function getCmuxSessionStatusText(
  status: CmuxSessionLogicalState
): string {
  switch (status) {
    case "idle":
      return ""
    case "busy":
      return "…"
    case "animated-busy":
      return "⏳"
    case "waiting":
      return "?"
    case "error":
      return "!"
  }
}
