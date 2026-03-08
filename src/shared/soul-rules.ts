import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"

import type { OhMyOpenCodeConfig } from "../config"
import { log } from "./logger"

type SoulRulesResult = {
  content?: string
  source?: string
}

type SoulSection = {
  title: string
  level: number
  content: string
}

export function loadSoulRules(params: {
  directory: string
  pluginConfig: OhMyOpenCodeConfig
}): SoulRulesResult {
  const configuredPath = params.pluginConfig.soul?.path?.trim()
  const projectPath = join(params.directory, ".sisyphus", "rules", "SOUL.md")
  const candidatePath = configuredPath && configuredPath.length > 0
    ? resolve(configuredPath)
    : projectPath

  if (!existsSync(candidatePath)) {
    return {}
  }

  const enabled = params.pluginConfig.soul?.enabled
  if (enabled === false) {
    return {}
  }

  try {
    const content = readFileSync(candidatePath, "utf-8")
    return { content, source: candidatePath }
  } catch (error) {
    log("[soul-rules] Failed to read SOUL.md", {
      path: candidatePath,
      error: String(error),
    })
    return {}
  }
}

export function selectSoulContent(params: {
  content: string
  prompt: string
  mode: "full" | "dynamic"
}): string {
  if (params.mode === "full") return params.content

  const sections = splitSoulSections(params.content)
  if (sections.length === 0) return params.content

  const prompt = params.prompt.toLowerCase()
  const keywords = collectPromptKeywords(prompt)

  const scored = sections.map((section) => {
    const haystack = `${section.title}\n${section.content}`.toLowerCase()
    let score = 0
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1
    }
    return { section, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected: SoulSection[] = []
  const core = findSectionByTitle(sections, "核心身份定义")
  if (core) selected.push(core)

  for (const entry of scored) {
    if (selected.length >= 3) break
    if (entry.score <= 0) continue
    if (selected.includes(entry.section)) continue
    selected.push(entry.section)
  }

  if (selected.length === 0) {
    const fallback = sections[0]
    return fallback ? fallback.content : params.content
  }

  return selected.map((section) => section.content).join("\n\n---\n\n")
}

function splitSoulSections(content: string): SoulSection[] {
  const lines = content.split(/\r?\n/)
  const sections: SoulSection[] = []

  let currentTitle = ""
  let currentLevel = 1
  let buffer: string[] = []

  const pushSection = () => {
    if (buffer.length === 0) return
    const sectionContent = buffer.join("\n").trim()
    if (!sectionContent) return
    sections.push({
      title: currentTitle || "preamble",
      level: currentLevel,
      content: sectionContent,
    })
  }

  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/)
    if (match) {
      pushSection()
      currentLevel = match[1].length
      currentTitle = match[2].trim()
      buffer = [line]
      continue
    }
    buffer.push(line)
  }

  pushSection()
  return sections
}

function findSectionByTitle(sections: SoulSection[], title: string): SoulSection | undefined {
  return sections.find((section) => section.title.includes(title))
}

function collectPromptKeywords(prompt: string): string[] {
  const candidates = [
    "代码",
    "开发",
    "前端",
    "后端",
    "测试",
    "数据",
    "统计",
    "生信",
    "生物信息",
    "基因",
    "序列",
    "RNA",
    "论文",
    "文献",
    "写作",
    "调研",
    "实验",
    "假设",
    "证据",
    "伦理",
    "可重复",
    "批判",
    "质疑",
    "系统",
    "不确定",
  ]

  const found: string[] = []
  for (const kw of candidates) {
    if (prompt.includes(kw.toLowerCase())) found.push(kw.toLowerCase())
  }

  return [...new Set(found)]
}
