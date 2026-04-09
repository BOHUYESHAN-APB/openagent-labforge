import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import type { SessionBootstrapSelection } from "../claude-code-session-state"
import { OPENCODE_LABFORGE_DIR } from "./constants"

export interface RepoBootstrapSelectionRecord extends SessionBootstrapSelection {
  updated_at: string
  last_selected_session_id?: string
}

export function getRepoBootstrapSelectionPath(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "bootstrap", "current.json")
}

export function readRepoBootstrapSelection(directory: string): RepoBootstrapSelectionRecord | null {
  const path = getRepoBootstrapSelectionPath(directory)
  if (!existsSync(path)) return null

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as RepoBootstrapSelectionRecord
  } catch {
    return null
  }
}

export function writeRepoBootstrapSelection(args: {
  directory: string
  sessionId?: string
  selection: SessionBootstrapSelection
}): RepoBootstrapSelectionRecord | null {
  const path = getRepoBootstrapSelectionPath(args.directory)
  const record: RepoBootstrapSelectionRecord = {
    ...args.selection,
    ...(args.sessionId ? { last_selected_session_id: args.sessionId } : {}),
    updated_at: new Date().toISOString(),
  }

  try {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(record, null, 2), "utf-8")
    return record
  } catch {
    return null
  }
}
