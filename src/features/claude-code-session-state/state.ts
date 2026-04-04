import { getAgentConfigKey } from "../../shared/agent-display-names"

export const subagentSessions = new Set<string>()
export const syncSubagentSessions = new Set<string>()

let _mainSessionID: string | undefined

const registeredAgentNames = new Set<string>()
const ZERO_WIDTH_CHARACTERS_REGEX = /[\u200B\u200C\u200D\uFEFF]/g

function normalizeRegisteredAgentName(name: string): string {
  return name.replace(ZERO_WIDTH_CHARACTERS_REGEX, "").toLowerCase()
}

export function setMainSession(id: string | undefined) {
  _mainSessionID = id
}

export function getMainSessionID(): string | undefined {
  return _mainSessionID
}

export function registerAgentName(name: string): void {
  const normalizedName = normalizeRegisteredAgentName(name)
  registeredAgentNames.add(normalizedName)

  const configKey = normalizeRegisteredAgentName(getAgentConfigKey(name))
  if (configKey !== normalizedName) {
    registeredAgentNames.add(configKey)
  }
}

export function isAgentRegistered(name: string): boolean {
  return registeredAgentNames.has(normalizeRegisteredAgentName(name))
}

/** @internal For testing only */
export function _resetForTesting(): void {
  _mainSessionID = undefined
  subagentSessions.clear()
  syncSubagentSessions.clear()
  sessionAgentMap.clear()
  registeredAgentNames.clear()
  ultraworkAutonomousSessionMap.clear()
}

const sessionAgentMap = new Map<string, string>()
const ultraworkAutonomousSessionMap = new Map<string, boolean>()

function normalizeSessionAgentName(agent: string): string {
  return getAgentConfigKey(agent)
}

export function setSessionAgent(sessionID: string, agent: string): void {
  if (!sessionAgentMap.has(sessionID)) {
    sessionAgentMap.set(sessionID, normalizeSessionAgentName(agent))
  }
}

export function updateSessionAgent(sessionID: string, agent: string): void {
  sessionAgentMap.set(sessionID, normalizeSessionAgentName(agent))
}

export function getSessionAgent(sessionID: string): string | undefined {
  return sessionAgentMap.get(sessionID)
}

export function clearSessionAgent(sessionID: string): void {
  sessionAgentMap.delete(sessionID)
}

export function setUltraworkAutonomousSession(
  sessionID: string,
  enabled: boolean
): void {
  ultraworkAutonomousSessionMap.set(sessionID, enabled)
}

export function isUltraworkAutonomousSession(sessionID: string): boolean {
  return ultraworkAutonomousSessionMap.get(sessionID) === true
}

export function clearUltraworkAutonomousSession(sessionID: string): void {
  ultraworkAutonomousSessionMap.delete(sessionID)
}
