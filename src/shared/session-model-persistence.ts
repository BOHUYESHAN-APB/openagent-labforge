import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

type SessionModel = { providerID: string; modelID: string }

type PersistedSessionModelState = {
  selectedModel?: SessionModel
  lockedModel?: SessionModel
  autoRouting?: boolean
  updatedAt: string
}

function getPersistencePath(directory: string, sessionID: string): string {
  return join(directory, ".opencode", "openagent-labforge", "sessions", sessionID, "model-state.json")
}

function shouldPersistSessionModelState(directory: string): boolean {
  return directory.trim().length > 0 && directory !== "."
}

function isSessionModel(value: unknown): value is SessionModel {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return typeof record["providerID"] === "string" && typeof record["modelID"] === "string"
}

function normalizePersistedState(value: unknown): PersistedSessionModelState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  return {
    ...(isSessionModel(record["selectedModel"]) ? { selectedModel: record["selectedModel"] } : {}),
    ...(isSessionModel(record["lockedModel"]) ? { lockedModel: record["lockedModel"] } : {}),
    ...(typeof record["autoRouting"] === "boolean" ? { autoRouting: record["autoRouting"] } : {}),
    updatedAt: typeof record["updatedAt"] === "string" ? record["updatedAt"] : new Date(0).toISOString(),
  }
}

export function readPersistedSessionModelState(directory: string, sessionID: string): PersistedSessionModelState | null {
  if (!shouldPersistSessionModelState(directory)) return null
  const filePath = getPersistencePath(directory, sessionID)
  if (!existsSync(filePath)) return null

  try {
    return normalizePersistedState(JSON.parse(readFileSync(filePath, "utf-8")))
  } catch {
    return null
  }
}

export function writePersistedSessionModelState(
  directory: string,
  sessionID: string,
  state: {
    selectedModel?: SessionModel
    lockedModel?: SessionModel
    autoRouting?: boolean
  },
): void {
  if (!shouldPersistSessionModelState(directory)) return
  const filePath = getPersistencePath(directory, sessionID)

  try {
    mkdirSync(dirname(filePath), { recursive: true })
    const payload: PersistedSessionModelState = {
      ...state,
      updatedAt: new Date().toISOString(),
    }
    writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8")
  } catch {
  }
}
