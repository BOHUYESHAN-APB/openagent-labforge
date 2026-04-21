/**
 * Agent config keys to display names mapping.
 * Config keys are lowercase (e.g., "sisyphus", "atlas").
 * Display names include suffixes for UI/logs (e.g., "Sisyphus (Ultraworker)").
 */
type AgentDisplayLanguage = "en" | "zh"

let currentLanguage: AgentDisplayLanguage = "en"

export function setAgentDisplayLanguage(language: AgentDisplayLanguage): void {
  currentLanguage = language
}

function inferLanguageFromLocale(): AgentDisplayLanguage {
  const envLocale =
    process.env.LANG ??
    process.env.LC_ALL ??
    process.env.LC_MESSAGES

  const jsLocale = Intl.DateTimeFormat().resolvedOptions().locale
  const locale = (envLocale ?? jsLocale ?? "").toLowerCase()

  return locale.startsWith("zh") ? "zh" : "en"
}

export function resolveAgentDisplayLanguage(configLanguage?: string): AgentDisplayLanguage {
  if (!configLanguage || configLanguage === "auto") {
    return inferLanguageFromLocale()
  }
  return configLanguage.toLowerCase().startsWith("zh") ? "zh" : "en"
}

const AGENT_DISPLAY_NAMES_EN: Record<string, string> = {
  sisyphus: "Task Dispatcher",
  wase: "Auto Executor",
  hephaestus: "Deep Executor",
  prometheus: "Task Planner",
  atlas: "Plan Executor",
  "sisyphus-junior": "Dispatcher Assistant",
  metis: "Plan Advisor",
  momus: "Plan Critic",
  oracle: "Architect",
  librarian: "Doc Expert",
  explore: "Code Explorer",
  "github-scout": "GitHub Scout",
  "tech-scout": "Tech Scout",
  "article-writer": "Article Writer",
  "scientific-writer": "Scientific Writer",
  orchestrator: "Smart Router",
  "bio-orchestrator": "Bio Coordinator",
  "engineering-orchestrator": "Eng Coordinator",
  "bio-planner": "Bio Planner",
  "bio-autopilot": "Bio Auto Executor",
  "multimodal-looker": "Multimodal Analyzer",
  "bio-methodologist": "Bio Methodologist",
  "wet-lab-designer": "Wet-Lab Designer",
  "bio-pipeline-operator": "Bio Executor",
  "paper-evidence-synthesizer": "Paper Synthesizer",
}

const AGENT_DISPLAY_NAMES_ZH: Record<string, string> = {
  sisyphus: "任务调度器",
  wase: "自动执行器",
  hephaestus: "深度执行器",
  prometheus: "任务规划器",
  atlas: "计划执行器",
  "sisyphus-junior": "调度助手",
  metis: "规划顾问",
  momus: "计划审查",
  oracle: "架构师",
  librarian: "文档专家",
  explore: "代码探索器",
  "github-scout": "GitHub 搜索",
  "tech-scout": "技术调研",
  "article-writer": "文章写作",
  "scientific-writer": "科研写作",
  orchestrator: "智能路由器",
  "bio-orchestrator": "生信协调器",
  "engineering-orchestrator": "工程协调器",
  "bio-planner": "生信规划器",
  "bio-autopilot": "生信自动执行器",
  "multimodal-looker": "多模态分析器",
  "bio-methodologist": "生信方法学家",
  "wet-lab-designer": "湿实验设计师",
  "bio-pipeline-operator": "生信执行器",
  "paper-evidence-synthesizer": "文献综合器",
}

export const AGENT_DISPLAY_NAMES: Record<string, string> = AGENT_DISPLAY_NAMES_EN

const AGENT_LIST_SORT_PREFIXES: Record<string, string> = {
  atlas: "\u200B",
}

// Regex to strip invisible characters (ZWSP, ZWNJ, ZWJ, ZWNBSP)
const INVISIBLE_AGENT_CHARACTERS_REGEX = /[\u200B\u200C\u200D\uFEFF]/g

function getLanguageDisplayMap(): Record<string, string> {
  return currentLanguage === "zh" ? AGENT_DISPLAY_NAMES_ZH : AGENT_DISPLAY_NAMES_EN
}

/**
 * Strip invisible characters from agent names.
 * Used to normalize agent names before comparison to prevent ZWSP-prefixed
 * display names from breaking exact-match lookups.
 */
export function stripInvisibleAgentCharacters(agentName: string): string {
  return agentName.replace(INVISIBLE_AGENT_CHARACTERS_REGEX, "")
}

function stripAgentListSortPrefix(agentName: string): string {
  return stripInvisibleAgentCharacters(agentName)
}

/**
 * Get display name for an agent config key.
 * Uses case-insensitive lookup for backward compatibility.
 * Returns original key if not found.
 */
export function getAgentDisplayName(configKey: string): string {
  const map = getLanguageDisplayMap()
  // Try exact match first
  const exactMatch = map[configKey]
  if (exactMatch !== undefined) return exactMatch
  
  // Fall back to case-insensitive search
  const lowerKey = configKey.toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lowerKey) return v
  }
  
  // Unknown agent: return original key
  return configKey
}

export function getAgentListDisplayName(configKey: string): string {
  const displayName = getAgentDisplayName(configKey)
  const prefix = AGENT_LIST_SORT_PREFIXES[configKey.toLowerCase()]

  return prefix ? `${prefix}${displayName}` : displayName
}

const REVERSE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  [...Object.entries(AGENT_DISPLAY_NAMES_EN), ...Object.entries(AGENT_DISPLAY_NAMES_ZH)].map(
    ([key, displayName]) => [displayName.toLowerCase(), key]
  ),
)

/**
 * Resolve an agent name (display name or config key) to its lowercase config key.
 * "Atlas (Plan Executor)" → "atlas", "atlas" → "atlas", "unknown" → "unknown"
 */
export function getAgentConfigKey(agentName: string): string {
  const lower = stripAgentListSortPrefix(agentName).toLowerCase()
  const reversed = REVERSE_DISPLAY_NAMES[lower]
  if (reversed !== undefined) return reversed
  if (AGENT_DISPLAY_NAMES_EN[lower] !== undefined) return lower
  if (AGENT_DISPLAY_NAMES_ZH[lower] !== undefined) return lower
  return lower
}

export function getRuntimeAgentName(agentName: string): string {
  return getAgentDisplayName(getAgentConfigKey(agentName))
}
