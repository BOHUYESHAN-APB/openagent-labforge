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
  sisyphus: "Sisyphus (Ultraworker)",
  wase: "WASE (Autonomous Ultrawork)",
  hephaestus: "Hephaestus (Deep Agent)",
  prometheus: "Prometheus (Plan Builder)",
  atlas: "Atlas (Plan Executor)",
  "sisyphus-junior": "Sisyphus-Junior",
  metis: "Metis (Plan Consultant)",
  momus: "Momus (Plan Critic)",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  "github-scout": "GitHub-Scout",
  "tech-scout": "Tech-Scout",
  "article-writer": "article-writer",
  "scientific-writer": "scientific-writer",
  "bio-orchestrator": "bio-orchestrator",
  "multimodal-looker": "multimodal-looker",
  "bio-methodologist": "bio-methodologist",
  "wet-lab-designer": "wet-lab-designer",
  "bio-pipeline-operator": "bio-pipeline-operator",
  "paper-evidence-synthesizer": "paper-evidence-synthesizer",
}

const AGENT_DISPLAY_NAMES_ZH: Record<string, string> = {
  sisyphus: "总调度器 (超脑)",
  wase: "哇塞 (全自动超脑)",
  hephaestus: "代码工匠 (深度)",
  prometheus: "规划师 (计划构建)",
  atlas: "执行官 (计划执行)",
  "sisyphus-junior": "调度助手",
  metis: "顾问 (计划咨询)",
  momus: "质检官 (计划批判)",
  oracle: "研判官",
  librarian: "资料官",
  explore: "探索者",
  "github-scout": "GitHub 侦察官",
  "tech-scout": "前沿技术侦察官",
  "article-writer": "文章写作官",
  "scientific-writer": "科研写作官",
  "bio-orchestrator": "生信总控官",
  "multimodal-looker": "多模态观察者",
  "bio-methodologist": "生信方法官",
  "wet-lab-designer": "湿实验设计官",
  "bio-pipeline-operator": "生信执行官",
  "paper-evidence-synthesizer": "论文证据整合官",
}

export const AGENT_DISPLAY_NAMES: Record<string, string> = AGENT_DISPLAY_NAMES_EN

const AGENT_LIST_SORT_PREFIXES: Record<string, string> = {
  atlas: "\u200B",
}

function getLanguageDisplayMap(): Record<string, string> {
  return currentLanguage === "zh" ? AGENT_DISPLAY_NAMES_ZH : AGENT_DISPLAY_NAMES_EN
}

function stripAgentListSortPrefix(agentName: string): string {
  return agentName.replace(/^\u200B+/, "")
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
