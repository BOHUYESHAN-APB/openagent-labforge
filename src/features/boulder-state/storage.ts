/**
 * Boulder State Storage
 *
 * Handles reading/writing boulder.json for active plan tracking.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import { dirname, join, basename, resolve } from "node:path"
import type { BoulderState, PlanProgress } from "./types"
import {
  BOULDER_DIR,
  BOULDER_FILE,
  LEGACY_BOULDER_STATE_PATH,
  LEGACY_PROMETHEUS_PLANS_DIR,
  PROMETHEUS_PLANS_DIR,
} from "./constants"

export function getBoulderFilePath(directory: string): string {
  return join(directory, BOULDER_DIR, BOULDER_FILE)
}

function getLegacyBoulderFilePath(directory: string): string {
  return join(directory, LEGACY_BOULDER_STATE_PATH)
}

export function readBoulderState(directory: string): BoulderState | null {
  const candidates = [
    getBoulderFilePath(directory),
    getLegacyBoulderFilePath(directory),
  ]

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue
    }

    try {
      const content = readFileSync(filePath, "utf-8")
      const parsed = JSON.parse(content)
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        continue
      }
      if (!Array.isArray(parsed.session_ids)) {
        parsed.session_ids = []
      }
      return parsed as BoulderState
    } catch {
      continue
    }
  }

  return null
}

export function writeBoulderState(directory: string, state: BoulderState): boolean {
  const filePath = getBoulderFilePath(directory)

  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8")
    return true
  } catch {
    return false
  }
}

export function appendSessionId(directory: string, sessionId: string): BoulderState | null {
  const state = readBoulderState(directory)
  if (!state) return null

  if (!state.session_ids?.includes(sessionId)) {
    if (!Array.isArray(state.session_ids)) {
      state.session_ids = []
    }
    state.session_ids.push(sessionId)
    if (writeBoulderState(directory, state)) {
      return state
    }
  }

  return state
}

export function clearBoulderState(directory: string): boolean {
  const filePaths = [getBoulderFilePath(directory), getLegacyBoulderFilePath(directory)]

  try {
    const { unlinkSync } = require("node:fs")
    for (const filePath of filePaths) {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    }
    return true
  } catch {
    return false
  }
}

/**
 * Find Prometheus plan files for this project.
 * Primary path: {project}/.opencode/openagent-labforge/plans/{name}.md
 * Legacy path remains readable for compatibility.
 */
export function findPrometheusPlans(directory: string): string[] {
  const planDirs = [
    join(directory, PROMETHEUS_PLANS_DIR),
    join(directory, LEGACY_PROMETHEUS_PLANS_DIR),
  ]

  const seen = new Set<string>()
  const plans: string[] = []

  for (const plansDir of planDirs) {
    if (!existsSync(plansDir)) {
      continue
    }

    try {
      const files = readdirSync(plansDir)
      for (const file of files.filter((f) => f.endsWith(".md"))) {
        const fullPath = resolve(join(plansDir, file))
        if (!seen.has(fullPath)) {
          seen.add(fullPath)
          plans.push(fullPath)
        }
      }
    } catch {
      continue
    }
  }

  try {
    return plans.sort((a, b) => {
      const aStat = require("node:fs").statSync(a)
      const bStat = require("node:fs").statSync(b)
      return bStat.mtimeMs - aStat.mtimeMs
    })
  } catch {
    return []
  }
}

/**
 * Parse a plan file and count checkbox progress.
 */
export function getPlanProgress(planPath: string): PlanProgress {
  if (!existsSync(planPath)) {
    return { total: 0, completed: 0, isComplete: true }
  }

  try {
    const content = readFileSync(planPath, "utf-8")
    
    // Match markdown checkboxes: - [ ] or - [x] or - [X]
    const uncheckedMatches = content.match(/^\s*[-*]\s*\[\s*\]/gm) || []
    const checkedMatches = content.match(/^\s*[-*]\s*\[[xX]\]/gm) || []

    const total = uncheckedMatches.length + checkedMatches.length
    const completed = checkedMatches.length

    return {
      total,
      completed,
      isComplete: total === 0 || completed === total,
    }
  } catch {
    return { total: 0, completed: 0, isComplete: true }
  }
}

/**
 * Extract plan name from file path.
 */
export function getPlanName(planPath: string): string {
  return basename(planPath, ".md")
}

/**
 * Create a new boulder state for a plan.
 */
export function createBoulderState(
  planPath: string,
  sessionId: string,
  agent?: string,
  worktreePath?: string,
): BoulderState {
  return {
    active_plan: planPath,
    started_at: new Date().toISOString(),
    session_ids: [sessionId],
    plan_name: getPlanName(planPath),
    ...(agent !== undefined ? { agent } : {}),
    ...(worktreePath !== undefined ? { worktree_path: worktreePath } : {}),
  }
}
