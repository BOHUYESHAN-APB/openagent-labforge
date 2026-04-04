import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { applyEdits, modify } from "jsonc-parser"

import type { ConfigMergeResult } from "../types"
import { getConfigDir } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { detectConfigFormat } from "./opencode-config-format"
import { parseOpenCodeConfigFileWithError, type OpenCodeConfig } from "./parse-opencode-config-file"

const MANAGED_MCP_KEYS = new Set([
  "websearch",
  "context7",
  "grep_app",
  "browser_puppeteer",
  "chrome-devtools-mcp",
  "open_websearch_mcp",
  "paper_search_mcp",
  "semantic_scholar_fastmcp",
])

function pruneManagedMcps(mcpConfig: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mcpConfig).filter(([name]) => !MANAGED_MCP_KEYS.has(name)),
  )
}

export function cleanupManagedMcpFromOpenCodeConfig(): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const { format, path } = detectConfigFormat()
  if (format === "none") {
    return { success: true, configPath: path }
  }

  try {
    const parseResult = parseOpenCodeConfigFileWithError(path)
    if (!parseResult.config) {
      return {
        success: false,
        configPath: path,
        error: parseResult.error ?? "Failed to parse config file",
      }
    }

    const config = parseResult.config
    const currentMcpConfig = config.mcp
    if (!currentMcpConfig || typeof currentMcpConfig !== "object" || Array.isArray(currentMcpConfig)) {
      return { success: true, configPath: path }
    }

    const cleanedMcpConfig = pruneManagedMcps(currentMcpConfig)
    const beforeCount = Object.keys(currentMcpConfig).length
    const afterCount = Object.keys(cleanedMcpConfig).length
    if (beforeCount === afterCount) {
      return { success: true, configPath: path }
    }

    const nextConfig: OpenCodeConfig = {
      ...config,
      ...(afterCount > 0 ? { mcp: cleanedMcpConfig } : {}),
    }
    if (afterCount === 0) {
      delete nextConfig.mcp
    }

    if (format === "jsonc" && existsSync(path)) {
      const content = readFileSync(path, "utf-8")
      const edits = modify(
        content,
        ["mcp"],
        afterCount > 0 ? cleanedMcpConfig : undefined,
        {
          formattingOptions: {
            insertSpaces: true,
            tabSize: 2,
            eol: "\n",
          },
        },
      )
      writeFileSync(path, applyEdits(content, edits))
    } else {
      writeFileSync(path, JSON.stringify(nextConfig, null, 2) + "\n")
    }

    return { success: true, configPath: path }
  } catch (err) {
    return {
      success: false,
      configPath: path,
      error: formatErrorWithSuggestion(err, "cleanup managed MCP config"),
    }
  }
}
