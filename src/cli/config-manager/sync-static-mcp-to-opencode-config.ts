import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { applyEdits, modify } from "jsonc-parser"
import { browser_puppeteer, chrome_devtools_mcp, open_websearch_mcp, paper_search_mcp, semantic_scholar_fastmcp } from "../../mcp/extended"
import type { ConfigMergeResult } from "../types"
import { getConfigDir } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { detectConfigFormat } from "./opencode-config-format"
import { parseOpenCodeConfigFileWithError, type OpenCodeConfig } from "./parse-opencode-config-file"

type StaticRemoteMcpConfig = {
  type: "remote"
  url: string
  enabled: boolean
  oauth: false
}

type StaticLocalMcpConfig = {
  type: "local"
  command: string[]
  enabled: boolean
  environment?: Record<string, string>
}

type StaticMcpConfig = StaticRemoteMcpConfig | StaticLocalMcpConfig

const MANAGED_STATIC_MCP_CONFIG: Record<string, StaticMcpConfig> = {
  websearch: {
    type: "remote",
    url: "https://mcp.exa.ai/mcp?tools=web_search_exa",
    enabled: true,
    oauth: false,
  },
  context7: {
    type: "remote",
    url: "https://mcp.context7.com/mcp",
    enabled: true,
    oauth: false,
  },
  grep_app: {
    type: "remote",
    url: "https://mcp.grep.app",
    enabled: true,
    oauth: false,
  },
  browser_puppeteer: sanitizeLocalMcp(browser_puppeteer),
  "chrome-devtools-mcp": sanitizeLocalMcp(chrome_devtools_mcp),
  open_websearch_mcp: sanitizeLocalMcp(open_websearch_mcp),
  paper_search_mcp: sanitizeLocalMcp(paper_search_mcp),
  semantic_scholar_fastmcp: sanitizeLocalMcp(semantic_scholar_fastmcp),
}

function sanitizeLocalMcp(config: {
  command: string[]
  enabled: boolean
  environment?: Record<string, string>
}): StaticLocalMcpConfig {
  return {
    type: "local",
    command: [...config.command],
    enabled: config.enabled,
    ...(config.environment ? { environment: { ...config.environment } } : {}),
  }
}

function mergeManagedMcps(existingConfig: OpenCodeConfig): OpenCodeConfig {
  const currentMcp = existingConfig.mcp
  const mergedMcp = currentMcp && typeof currentMcp === "object" && !Array.isArray(currentMcp)
    ? { ...currentMcp, ...MANAGED_STATIC_MCP_CONFIG }
    : { ...MANAGED_STATIC_MCP_CONFIG }

  return {
    ...existingConfig,
    mcp: mergedMcp,
  }
}

function stringifyJson(content: OpenCodeConfig): string {
  return JSON.stringify(content, null, 2) + "\n"
}

export function syncStaticMcpToOpenCodeConfig(): ConfigMergeResult {
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

  try {
    if (format === "none") {
      writeFileSync(path, stringifyJson({ mcp: { ...MANAGED_STATIC_MCP_CONFIG } }))
      return { success: true, configPath: path }
    }

    const parseResult = parseOpenCodeConfigFileWithError(path)
    if (!parseResult.config) {
      return {
        success: false,
        configPath: path,
        error: parseResult.error ?? "Failed to parse config file",
      }
    }

    const mergedConfig = mergeManagedMcps(parseResult.config)

    if (format === "jsonc" && existsSync(path)) {
      const content = readFileSync(path, "utf-8")
      const edits = modify(
        content,
        ["mcp"],
        mergedConfig.mcp,
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
      writeFileSync(path, stringifyJson(mergedConfig))
    }

    return { success: true, configPath: path }
  } catch (err) {
    return {
      success: false,
      configPath: path,
      error: formatErrorWithSuggestion(err, "sync static MCP config"),
    }
  }
}
