export type BootstrapModeCategory = "engineering" | "bio"

export interface SessionBootstrapMode {
  category: BootstrapModeCategory
  key: string
  labelZh: string
  labelEn: string
  summaryZh: string
  summaryEn: string
  isCustom?: boolean
  customInstruction?: string
}

export interface SessionBootstrapSelection {
  category: BootstrapModeCategory
  primary: SessionBootstrapMode
  secondary: SessionBootstrapMode[]
}

const sessionBootstrapModeMap = new Map<string, SessionBootstrapSelection>()

export function setSessionBootstrapMode(sessionID: string, selection: SessionBootstrapSelection): void {
  sessionBootstrapModeMap.set(sessionID, selection)
}

export function getSessionBootstrapMode(sessionID: string): SessionBootstrapSelection | undefined {
  return sessionBootstrapModeMap.get(sessionID)
}

export function clearSessionBootstrapMode(sessionID: string): void {
  sessionBootstrapModeMap.delete(sessionID)
}

export function resetSessionBootstrapModesForTesting(): void {
  sessionBootstrapModeMap.clear()
}
