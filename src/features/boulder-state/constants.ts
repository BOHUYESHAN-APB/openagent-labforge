/**
 * Boulder State Constants
 */

export const OPENCODE_LABFORGE_DIR = ".opencode/openagent-labforge"
export const LEGACY_BOULDER_DIR = ".sisyphus"

export const BOULDER_DIR = OPENCODE_LABFORGE_DIR
export const BOULDER_FILE = "boulder.json"
export const BOULDER_STATE_PATH = `${BOULDER_DIR}/${BOULDER_FILE}`
export const LEGACY_BOULDER_STATE_PATH = `${LEGACY_BOULDER_DIR}/${BOULDER_FILE}`

export const NOTEPAD_DIR = "notepads"
export const NOTEPAD_BASE_PATH = `${BOULDER_DIR}/${NOTEPAD_DIR}`
export const LEGACY_NOTEPAD_BASE_PATH = `${LEGACY_BOULDER_DIR}/${NOTEPAD_DIR}`

/** Prometheus plan directory pattern */
export const PROMETHEUS_PLANS_DIR = `${BOULDER_DIR}/plans`
export const LEGACY_PROMETHEUS_PLANS_DIR = `${LEGACY_BOULDER_DIR}/plans`
export const PROMETHEUS_DRAFTS_DIR = `${BOULDER_DIR}/drafts`
export const LEGACY_PROMETHEUS_DRAFTS_DIR = `${LEGACY_BOULDER_DIR}/drafts`
export const PROMETHEUS_EVIDENCE_DIR = `${BOULDER_DIR}/evidence`
export const LEGACY_PROMETHEUS_EVIDENCE_DIR = `${LEGACY_BOULDER_DIR}/evidence`

export const RUNTIME_TOOL_DIR = "openagent-labforge"
export const LEGACY_RUNTIME_DIR = "runtime"
export const RUNTIME_SESSION_STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000
