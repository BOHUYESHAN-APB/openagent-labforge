export type SessionModel = { providerID: string; modelID: string }

const sessionModels = new Map<string, SessionModel>()
const sessionModelLocks = new Map<string, SessionModel>()
const sessionForcedModels = new Map<string, SessionModel>()

export function setSessionModel(sessionID: string, model: SessionModel): void {
  sessionModels.set(sessionID, model)
}

export function getSessionModel(sessionID: string): SessionModel | undefined {
  return sessionModels.get(sessionID)
}

export function clearSessionModel(sessionID: string): void {
  sessionModels.delete(sessionID)
  sessionModelLocks.delete(sessionID)
  sessionForcedModels.delete(sessionID)
}

export function setSessionModelLock(sessionID: string, model: SessionModel): void {
  sessionModelLocks.set(sessionID, model)
}

export function getSessionModelLock(sessionID: string): SessionModel | undefined {
  return sessionModelLocks.get(sessionID)
}

export function clearSessionModelLock(sessionID: string): void {
  sessionModelLocks.delete(sessionID)
}

export function setSessionForcedModel(sessionID: string, model: SessionModel): void {
  sessionForcedModels.set(sessionID, model)
}

export function getSessionForcedModel(sessionID: string): SessionModel | undefined {
  return sessionForcedModels.get(sessionID)
}

export function clearSessionForcedModel(sessionID: string): void {
  sessionForcedModels.delete(sessionID)
}
