import * as fs from "node:fs"
import type { OpencodeConfig } from "../types"
import { PACKAGE_NAME } from "../constants"
import { getConfigPaths } from "./config-paths"
import { stripJsonComments } from "./jsonc-strip"

const LEGACY_PACKAGE_NAMES = [
  "oh-my-opencode",
  "@labforge/openagent-labforge-core",
] as const

export interface PluginEntryInfo {
  entry: string
  isPinned: boolean
  pinnedVersion: string | null
  configPath: string
}

function isExplicitVersionPin(pinnedVersion: string): boolean {
  return /^\d+\.\d+\.\d+/.test(pinnedVersion)
}

export function findPluginEntry(directory: string): PluginEntryInfo | null {
  for (const configPath of getConfigPaths(directory)) {
    try {
      if (!fs.existsSync(configPath)) continue
      const content = fs.readFileSync(configPath, "utf-8")
      const config = JSON.parse(stripJsonComments(content)) as OpencodeConfig
      const plugins = config.plugin ?? []

      for (const entry of plugins) {
        if (entry === PACKAGE_NAME || LEGACY_PACKAGE_NAMES.some((name) => entry === name)) {
          return { entry, isPinned: false, pinnedVersion: null, configPath }
        }
        const matchedName = [PACKAGE_NAME, ...LEGACY_PACKAGE_NAMES].find((name) =>
          entry.startsWith(`${name}@`)
        )

        if (matchedName) {
          const pinnedVersion = entry.slice(matchedName.length + 1)
          const isPinned = isExplicitVersionPin(pinnedVersion)
          return { entry, isPinned, pinnedVersion, configPath }
        }
      }
    } catch {
      continue
    }
  }

  return null
}
