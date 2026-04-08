const QUICK_REVISION_WINDOW_MS = 5_000
const DUPLICATE_PROMPT_WINDOW_MS = 15_000
const PROMPT_PREVIEW_MAX_CHARS = 160

export type AutonomousUserTurnMode =
  | "initial"
  | "repeat"
  | "precommit-revision"
  | "postcommit-guidance"

export interface AutonomousUserTurnAssessment {
  mode: AutonomousUserTurnMode
  elapsedMs?: number
  promptChanged: boolean
  likelyUndoFailed: boolean
  previousPromptPreview?: string
}

interface AutonomousUserTurnState {
  lastPromptFingerprint?: string
  lastPromptPreview?: string
  lastUserAt?: number
  lastAssistantAt?: number
  lastTodoCommitAt?: number
}

const sessionTurnStateMap = new Map<string, AutonomousUserTurnState>()

function getSessionTurnState(sessionID: string): AutonomousUserTurnState {
  const existing = sessionTurnStateMap.get(sessionID)
  if (existing) return existing

  const created: AutonomousUserTurnState = {}
  sessionTurnStateMap.set(sessionID, created)
  return created
}

function normalizePromptFingerprint(promptText: string): string {
  return promptText.replace(/\s+/g, " ").trim().toLowerCase()
}

function createPromptPreview(promptText: string): string {
  const normalized = promptText.replace(/\s+/g, " ").trim()
  if (normalized.length <= PROMPT_PREVIEW_MAX_CHARS) {
    return normalized
  }
  return `${normalized.slice(0, PROMPT_PREVIEW_MAX_CHARS - 3)}...`
}

export function recordAutonomousUserTurn(args: {
  sessionID: string
  promptText: string
  now?: number
}): AutonomousUserTurnAssessment {
  const { sessionID, promptText, now = Date.now() } = args
  const state = getSessionTurnState(sessionID)
  const fingerprint = normalizePromptFingerprint(promptText)
  const preview = createPromptPreview(promptText)
  const previousUserAt = state.lastUserAt
  const previousPromptFingerprint = state.lastPromptFingerprint
  const previousPromptPreview = state.lastPromptPreview

  const elapsedMs = previousUserAt !== undefined ? now - previousUserAt : undefined
  const promptChanged =
    previousPromptFingerprint === undefined || previousPromptFingerprint !== fingerprint
  const hadAssistantSinceLastUser =
    previousUserAt !== undefined &&
    state.lastAssistantAt !== undefined &&
    state.lastAssistantAt > previousUserAt
  const hadTodoCommitSinceLastUser =
    previousUserAt !== undefined &&
    state.lastTodoCommitAt !== undefined &&
    state.lastTodoCommitAt > previousUserAt
  const hasCommittedWork = hadAssistantSinceLastUser || hadTodoCommitSinceLastUser

  let mode: AutonomousUserTurnMode = "initial"
  if (previousUserAt !== undefined) {
    if (
      !promptChanged &&
      !hasCommittedWork &&
      elapsedMs !== undefined &&
      elapsedMs <= DUPLICATE_PROMPT_WINDOW_MS
    ) {
      mode = "repeat"
    } else if (hasCommittedWork) {
      mode = "postcommit-guidance"
    } else {
      mode = "precommit-revision"
    }
  }

  state.lastPromptFingerprint = fingerprint
  state.lastPromptPreview = preview
  state.lastUserAt = now

  return {
    mode,
    elapsedMs,
    promptChanged,
    likelyUndoFailed:
      mode === "precommit-revision" &&
      elapsedMs !== undefined &&
      elapsedMs > QUICK_REVISION_WINDOW_MS,
    previousPromptPreview,
  }
}

export function noteAutonomousAssistantTurn(sessionID: string, now = Date.now()): void {
  const state = getSessionTurnState(sessionID)
  state.lastAssistantAt = now
}

export function noteAutonomousTodoCommit(sessionID: string, now = Date.now()): void {
  const state = getSessionTurnState(sessionID)
  state.lastTodoCommitAt = now
}

export function clearAutonomousUserTurnState(sessionID: string): void {
  sessionTurnStateMap.delete(sessionID)
}

export function resetAutonomousUserTurnStateForTesting(): void {
  sessionTurnStateMap.clear()
}
