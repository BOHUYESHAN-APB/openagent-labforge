import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { parseJsonc } from "../../shared"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { getConfigDir, getPluginConfigPath } from "./config-context"
import { deepMergeRecord } from "./deep-merge-record"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { generateOmoConfig } from "./generate-omo-config"

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0
}

export function writeOmoConfig(installConfig: InstallConfig): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const pluginConfigPath = getPluginConfigPath()

  try {
    const newConfig = generateOmoConfig(installConfig)

    if (existsSync(pluginConfigPath)) {
      try {
        const stat = statSync(pluginConfigPath)
        const content = readFileSync(pluginConfigPath, "utf-8")

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(pluginConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: pluginConfigPath }
        }

        const existing = parseJsonc<Record<string, unknown>>(content)
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          writeFileSync(pluginConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: pluginConfigPath }
        }

        const merged = deepMergeRecord(newConfig, existing)
        writeFileSync(pluginConfigPath, JSON.stringify(merged, null, 2) + "\n")
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          writeFileSync(pluginConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: pluginConfigPath }
        }
        throw parseErr
      }
    } else {
      writeFileSync(pluginConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
    }

    return { success: true, configPath: pluginConfigPath }
  } catch (err) {
    return {
      success: false,
      configPath: pluginConfigPath,
      error: formatErrorWithSuggestion(err, "write openagent-labforge config"),
    }
  }
}
