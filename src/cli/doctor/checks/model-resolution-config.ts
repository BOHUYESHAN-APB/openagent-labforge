import { readFileSync } from "node:fs"
import { join } from "node:path"
import { detectConfigFile, getOpenCodeConfigPaths, parseJsonc } from "../../../shared"
import type { OmoConfig } from "./model-resolution-types"

const PACKAGE_NAME = "openagent-labforge"
const LEGACY_PACKAGE_NAME = "oh-my-opencode"
const USER_CONFIG_BASE = join(
  getOpenCodeConfigPaths({ binary: "opencode", version: null }).configDir,
  PACKAGE_NAME
)
const PROJECT_CONFIG_BASE = join(process.cwd(), ".opencode", PACKAGE_NAME)
const LEGACY_USER_CONFIG_BASE = join(
  getOpenCodeConfigPaths({ binary: "opencode", version: null }).configDir,
  LEGACY_PACKAGE_NAME
)
const LEGACY_PROJECT_CONFIG_BASE = join(process.cwd(), ".opencode", LEGACY_PACKAGE_NAME)

export function loadOmoConfig(): OmoConfig | null {
  const configCandidates = [
    PROJECT_CONFIG_BASE,
    USER_CONFIG_BASE,
    LEGACY_PROJECT_CONFIG_BASE,
    LEGACY_USER_CONFIG_BASE,
  ]

  for (const configBase of configCandidates) {
    const detected = detectConfigFile(configBase)
    if (detected.format === "none") {
      continue
    }

    try {
      const content = readFileSync(detected.path, "utf-8")
      return parseJsonc<OmoConfig>(content)
    } catch {
      continue
    }
  }

  return null
}
