import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { applyEdits, modify } from "jsonc-parser"

import { getAgentConfigKey } from "../../shared/agent-display-names"
import type { ConfigMergeResult } from "../types"
import { getConfigDir } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { detectConfigFormat } from "./opencode-config-format"
import { parseOpenCodeConfigFileWithError, type OpenCodeConfig } from "./parse-opencode-config-file"

const MANAGED_AGENT_KEYS = new Set([
  "总调度器",
  "代码工匠",
  "规划师",
  "执行官",
  "调度助手",
  "顾问",
  "质检官",
  "研判官",
  "资料官",
  "探索者",
  "github 侦察官",
  "前沿技术侦察官",
  "文章写作官",
  "科研写作官",
  "生信总控官",
  "多模态观察者",
  "生信方法官",
  "湿实验设计官",
  "生信执行官",
  "论文证据整合官",
  "sisyphus",
  "wase",
  "hephaestus",
  "atlas",
  "prometheus",
  "metis",
  "momus",
  "oracle",
  "librarian",
  "explore",
  "github-scout",
  "tech-scout",
  "article-writer",
  "scientific-writer",
  "bio-orchestrator",
  "multimodal-looker",
  "bio-methodologist",
  "wet-lab-designer",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
  "sisyphus-junior",
  "opencode-builder",
  "build",
  "plan",
])

function normalizeAgentNameForMatching(name: string): string {
  return (name.split("(")[0]?.trim() ?? name.trim()).toLowerCase()
}

function pruneManagedAgents(agentConfig: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(agentConfig).filter(([name]) => {
      const key = getAgentConfigKey(name)
      if (MANAGED_AGENT_KEYS.has(key)) {
        return false
      }

      const normalizedName = normalizeAgentNameForMatching(name)
      return !MANAGED_AGENT_KEYS.has(normalizedName)
    }),
  )
}

export function cleanupStaleManagedAgentsFromOpenCodeConfig(): ConfigMergeResult {
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
    const currentAgentConfig = config.agent
    if (!currentAgentConfig || typeof currentAgentConfig !== "object" || Array.isArray(currentAgentConfig)) {
      return { success: true, configPath: path }
    }

    const cleanedAgentConfig = pruneManagedAgents(currentAgentConfig)
    const beforeCount = Object.keys(currentAgentConfig).length
    const afterCount = Object.keys(cleanedAgentConfig).length
    if (beforeCount === afterCount) {
      return { success: true, configPath: path }
    }

    const nextConfig: OpenCodeConfig = {
      ...config,
      ...(afterCount > 0 ? { agent: cleanedAgentConfig } : {}),
    }

    if (afterCount === 0) {
      delete nextConfig.agent
    }

    const defaultAgent = typeof config.default_agent === "string"
      ? getAgentConfigKey(config.default_agent)
      : undefined
    const shouldRemoveDefaultAgent = defaultAgent !== undefined && MANAGED_AGENT_KEYS.has(defaultAgent)
    if (shouldRemoveDefaultAgent) {
      delete nextConfig.default_agent
    }

    if (format === "jsonc" && existsSync(path)) {
      const content = readFileSync(path, "utf-8")
      const formattingOptions = {
        insertSpaces: true,
        tabSize: 2,
        eol: "\n",
      }
      const agentEdits = modify(
        content,
        ["agent"],
        afterCount > 0 ? cleanedAgentConfig : undefined,
        { formattingOptions },
      )
      const contentWithAgents = applyEdits(content, agentEdits)
      if (!shouldRemoveDefaultAgent) {
        writeFileSync(path, contentWithAgents)
      } else {
        const defaultAgentEdits = modify(
          contentWithAgents,
          ["default_agent"],
          undefined,
          { formattingOptions },
        )
        writeFileSync(path, applyEdits(contentWithAgents, defaultAgentEdits))
      }
    } else {
      writeFileSync(path, JSON.stringify(nextConfig, null, 2) + "\n")
    }

    return { success: true, configPath: path }
  } catch (err) {
    return {
      success: false,
      configPath: path,
      error: formatErrorWithSuggestion(err, "cleanup stale managed agents"),
    }
  }
}
