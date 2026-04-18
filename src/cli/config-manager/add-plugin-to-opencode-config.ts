import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { ConfigMergeResult } from "../types"
import { getConfigDir } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { detectConfigFormat } from "./opencode-config-format"
import { parseOpenCodeConfigFileWithError, type OpenCodeConfig } from "./parse-opencode-config-file"
import { getPluginNameWithVersion } from "./plugin-name-with-version"

const PACKAGE_NAME = "@bohuyeshan/openagent-labforge-core"
const LEGACY_PACKAGE_NAMES = [
  "@labforge/openagent-labforge-core",
  "oh-my-opencode",
] as const

type ConfigTarget = "opencode" | "tui"

function detectTargetConfigFormat(target: ConfigTarget): { format: "json" | "jsonc" | "none"; path: string } {
  if (target === "opencode") {
    return detectConfigFormat()
  }

  const configDir = getConfigDir()
  const jsoncPath = join(configDir, "tui.jsonc")
  const jsonPath = join(configDir, "tui.json")
  if (existsSync(jsoncPath)) return { format: "jsonc", path: jsoncPath }
  if (existsSync(jsonPath)) return { format: "json", path: jsonPath }
  return { format: "none", path: jsoncPath }
}

function mergePluginEntryIntoConfig(
  config: OpenCodeConfig,
  pluginEntry: string,
): OpenCodeConfig {
  const plugins = config.plugin ?? []
  const existingIndex = plugins.findIndex((p) => {
    const normalized = p.toLowerCase()
    return normalized === PACKAGE_NAME.toLowerCase()
      || normalized.startsWith(`${PACKAGE_NAME.toLowerCase()}@`)
      || (normalized.startsWith("file://") &&
        (normalized.includes("openagent-labforge") || normalized.includes("oh-my-opencode")))
      || LEGACY_PACKAGE_NAMES.some((legacyName) =>
        normalized === legacyName.toLowerCase()
        || normalized.startsWith(`${legacyName.toLowerCase()}@`)
      )
  })

  if (existingIndex !== -1) {
    if (plugins[existingIndex] !== pluginEntry) {
      plugins[existingIndex] = pluginEntry
    }
  } else {
    plugins.push(pluginEntry)
  }

  config.plugin = plugins
  return config
}

function writeConfigPreservingShape(
  path: string,
  format: "json" | "jsonc" | "none",
  config: OpenCodeConfig,
  pluginEntry: string,
): void {
  if (format === "jsonc") {
    const content = readFileSync(path, "utf-8")
    const pluginArrayRegex = /"plugin"\s*:\s*\[([\s\S]*?)\]/
    const match = content.match(pluginArrayRegex)

    if (match) {
      const formattedPlugins = (config.plugin ?? []).map((p) => `"${p}"`).join(",\n    ")
      const newContent = content.replace(pluginArrayRegex, `"plugin": [\n    ${formattedPlugins}\n  ]`)
      writeFileSync(path, newContent)
      return
    }

    const newContent = content.replace(/(\{)/, `$1\n  "plugin": ["${pluginEntry}"],`)
    writeFileSync(path, newContent)
    return
  }

  writeFileSync(path, JSON.stringify(config, null, 2) + "\n")
}

export async function addPluginToOpenCodeConfig(currentVersion: string): Promise<ConfigMergeResult> {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const pluginEntry = await getPluginNameWithVersion(currentVersion)

  try {
    const targets: ConfigTarget[] = ["opencode", "tui"]
    let primaryPath = ""

    for (const target of targets) {
      const { format, path } = detectTargetConfigFormat(target)
      if (!primaryPath) {
        primaryPath = path
      }

      if (format === "none") {
        const config: OpenCodeConfig = { plugin: [pluginEntry] }
        writeFileSync(path, JSON.stringify(config, null, 2) + "\n")
        continue
      }

      const parseResult = parseOpenCodeConfigFileWithError(path)
      if (!parseResult.config) {
        return {
          success: false,
          configPath: path,
          error: parseResult.error ?? `Failed to parse ${target} config file`,
        }
      }

      const config = mergePluginEntryIntoConfig(parseResult.config, pluginEntry)
      writeConfigPreservingShape(path, format, config, pluginEntry)
    }

    return { success: true, configPath: primaryPath }
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "update opencode config"),
    }
  }
}
