import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

import type { OhMyOpenCodeConfig } from "../../config"
import { getOpenCodeConfigDir, log, parseJsonc } from "../../shared"

type RulesProvider = {
  tags?: string[]
  variants?: Record<string, string[]>
}

type RulesShape = {
  providers?: Record<string, RulesProvider>
  categories?: Record<string, { prefer?: string[] }>
}

type ProviderModelsCache = Record<string, { models?: Record<string, unknown> }>

type FullModelId = {
  providerID: string
  modelID: string
  full: string
}

type CategoryName = "quick" | "deep" | "ultrabrain" | "writing" | "visual-engineering"

type CategoryRecommendation = {
  category: CategoryName
  model: string
  fallback_models: string[]
  reason: string
}

type AgentCategoryDefaults = Record<string, CategoryName>

function getOpenCodeCacheDir(): string {
  const xdgCache = process.env.XDG_CACHE_HOME
  if (xdgCache) return join(xdgCache, "opencode")
  return join(homedir(), ".cache", "opencode")
}

function loadModelsCache(): ProviderModelsCache | null {
  const cacheFile = join(getOpenCodeCacheDir(), "models.json")
  if (!existsSync(cacheFile)) return null

  try {
    const content = readFileSync(cacheFile, "utf-8")
    return parseJsonc<ProviderModelsCache>(content)
  } catch {
    return null
  }
}

function listAvailableModels(cache: ProviderModelsCache): FullModelId[] {
  const models: FullModelId[] = []

  for (const [providerID, providerConfig] of Object.entries(cache)) {
    const providerModels = providerConfig?.models
    if (!providerModels || typeof providerModels !== "object") continue

    for (const modelID of Object.keys(providerModels)) {
      models.push({ providerID, modelID, full: `${providerID}/${modelID}` })
    }
  }

  return models
}

function scoreModelForCategory(model: FullModelId, category: CategoryName): { score: number; reason: string } {
  const provider = model.providerID.toLowerCase()
  const id = model.modelID.toLowerCase()

  // Basic family tags
  const isGeminiFlash = id.includes("flash")
  const isGeminiPro = id.includes("pro")

  const isClaudeOpus = id.includes("opus")
  const isClaudeSonnet = id.includes("sonnet")
  const isClaudeHaiku = id.includes("haiku")

  const isGptCodex = id.includes("codex")
  const isMini = id.includes("mini") || id.includes("nano")

  const isVision = id.includes("vision") || id.includes("4o") || id.includes("glm-4.6v") || id.includes("4v")

  let score = 0
  const reasons: string[] = []

  // Provider preference (rough, adjustable by user later)
  const providerBase: Record<string, number> = {
    gmn: 120,
    openai: 110,
    anthropic: 100,
    google: 95,
    deepseek: 85,
    qwen: 80,
    minimax: 75,
    z: 70,
    glm: 70,
    kimi: 65,
    github: 60,
    opencode: 50,
  }
  score += providerBase[provider] ?? 0
  if (providerBase[provider] !== undefined) reasons.push(`provider:${provider}`)

  if (category === "quick") {
    if (isGeminiFlash) { score += 40; reasons.push("flash") }
    if (isClaudeHaiku) { score += 35; reasons.push("haiku") }
    if (isMini) { score += 30; reasons.push("mini") }
    if (isGptCodex) { score -= 10; reasons.push("codex_penalty") }
  }

  if (category === "deep") {
    if (isGptCodex) { score += 35; reasons.push("codex") }
    if (isClaudeSonnet) { score += 25; reasons.push("sonnet") }
    if (isGeminiPro) { score += 20; reasons.push("pro") }
    if (isMini) { score -= 15; reasons.push("mini_penalty") }
  }

  if (category === "ultrabrain") {
    if (isClaudeOpus) { score += 45; reasons.push("opus") }
    if (id.includes("5.4") || id.includes("gpt-5.4")) { score += 40; reasons.push("gpt-5.4") }
    if (isGeminiPro) { score += 15; reasons.push("pro") }
    if (isMini) { score -= 30; reasons.push("mini_penalty") }
  }

  if (category === "writing") {
    if (isGeminiFlash) { score += 25; reasons.push("flash") }
    if (isClaudeSonnet) { score += 20; reasons.push("sonnet") }
    if (isMini) { score += 5; reasons.push("mini_ok") }
  }

  if (category === "visual-engineering") {
    if (provider === "google" && (id.includes("gemini") || isGeminiPro || isGeminiFlash)) {
      score += 60
      reasons.push("google_visual")
    }
    if (isVision) {
      score += 20
      reasons.push("vision")
    }
  }

  return { score, reason: reasons.join(",") }
}

function getModelTagsFromRules(model: FullModelId, rules: RulesShape | null): string[] {
  const providerRules = rules?.providers?.[model.providerID.toLowerCase()]
  if (!providerRules) return []

  const tags: string[] = []
  const haystack = `${model.providerID}/${model.modelID}`.toLowerCase()

  for (const t of providerRules.tags ?? []) {
    if (haystack.includes(t.toLowerCase())) tags.push(t.toLowerCase())
  }

  for (const [variant, needles] of Object.entries(providerRules.variants ?? {})) {
    for (const needle of needles) {
      if (haystack.includes(needle.toLowerCase())) {
        tags.push(variant.toLowerCase())
        break
      }
    }
  }

  return [...new Set(tags)]
}

function scoreModelForCategoryWithRules(params: {
  model: FullModelId
  category: CategoryName
  rules: RulesShape | null
}): { score: number; reason: string } {
  const baseline = scoreModelForCategory(params.model, params.category)
  const prefer = params.rules?.categories?.[params.category]?.prefer ?? []
  const tags = getModelTagsFromRules(params.model, params.rules)

  const versionScore = extractVersionScore(params.model.modelID)

  let score = baseline.score
  const reasons = [baseline.reason]

  if (tags.length > 0) reasons.push(`rules:${tags.join("|")}`)

  for (const p of prefer) {
    if (tags.includes(p.toLowerCase())) {
      score += 25
      reasons.push(`prefer:${p.toLowerCase()}`)
    }
  }

  if (versionScore > 0) {
    const bump = Math.min(50, Math.floor(versionScore / 10))
    score += bump
    reasons.push(`version:+${bump}`)
  }

  return { score, reason: reasons.filter(Boolean).join(",") }
}

function extractVersionScore(modelID: string): number {
  const normalized = modelID.toLowerCase()
  const matches = [...normalized.matchAll(/(\d+)(?:[._-](\d+))?/g)]
  if (matches.length === 0) return 0

  let best = 0
  for (const match of matches) {
    const major = Number(match[1])
    const minor = match[2] ? Number(match[2]) : 0
    if (Number.isNaN(major) || Number.isNaN(minor)) continue
    const score = major * 100 + minor
    if (score > best) best = score
  }

  return best
}

function recommendModels(models: FullModelId[], rules: RulesShape | null): CategoryRecommendation[] {
  const categories: CategoryName[] = ["quick", "deep", "ultrabrain", "writing", "visual-engineering"]
  const maxFallbacks = 4
  const maxCandidates = 12

  return categories.map((category) => {
    const scored = models
      .map((m) => {
        const result = scoreModelForCategoryWithRules({ model: m, category, rules })
        return { model: m, score: result.score, reason: result.reason }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCandidates)

    const primary = scored[0]
    const fallback_models = scored
      .slice(1)
      .map((item) => item.model.full)
      .filter((value, index, all) => all.indexOf(value) === index)
      .slice(0, maxFallbacks)

    return {
      category,
      model: primary?.model.full ?? "",
      fallback_models,
      reason: primary ? `${primary.reason} (score=${primary.score})` : "no models found",
    }
  })
}

function ensureDir(path: string): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function defaultReportPath(pluginConfig: OhMyOpenCodeConfig): string {
  const userPath = pluginConfig.model_governor?.report?.path
  if (userPath && userPath.trim().length > 0) return userPath

  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const format = pluginConfig.model_governor?.report?.format ?? "md"
  return join(configDir, format === "json" ? "openagent-labforge.models.report.json" : "openagent-labforge.models.report.md")
}

function defaultRulesPath(pluginConfig: OhMyOpenCodeConfig): string {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const userPath = (pluginConfig.model_governor as any)?.rules_path as string | undefined
  if (userPath && userPath.trim().length > 0) return userPath
  return join(configDir, "openagent-labforge.models.rules.jsonc")
}

function ensureRulesFile(path: string): void {
  if (existsSync(path)) return
  ensureDir(path)

  const content = [
    "{",
    "  // Model matching rules for AUTO mode.",
    "  // Edit freely. Unknown fields are ignored.",
    "  // Version preference: AUTO favors higher numeric versions when present.",
    "  // Examples: gpt-5.4 > gpt-5.3 > gpt-5.2, claude-4-6 > claude-4-5, gemini-3.1 > gemini-3.0.",
    "  \"providers\": {",
    "    \"google\": {\"tags\": [\"gemini\"], \"variants\": {\"flash\": [\"flash\"], \"pro\": [\"pro\"]}},",
    "    \"anthropic\": {\"tags\": [\"claude\"], \"variants\": {\"opus\": [\"opus\"], \"sonnet\": [\"sonnet\"], \"haiku\": [\"haiku\"]}},",
    "    \"openai\": {\"tags\": [\"gpt\"], \"variants\": {\"codex\": [\"codex\"], \"mini\": [\"mini\"], \"max\": [\"max\"]}},",
    "    \"qwen\": {\"tags\": [\"qwen\"], \"variants\": {}},",
    "    \"deepseek\": {\"tags\": [\"deepseek\"], \"variants\": {}},",
    "    \"glm\": {\"tags\": [\"glm\"], \"variants\": {}},",
    "    \"minimax\": {\"tags\": [\"minimax\"], \"variants\": {}},",
    "    \"gmn\": {\"tags\": [\"gpt\"], \"variants\": {\"codex\": [\"codex\"], \"mini\": [\"mini\"], \"max\": [\"max\"]}}",
    "  },",
    "  \"categories\": {",
    "    \"quick\": {\"prefer\": [\"flash\", \"haiku\", \"mini\"]},",
    "    \"deep\": {\"prefer\": [\"codex\", \"sonnet\", \"pro\"]},",
    "    \"ultrabrain\": {\"prefer\": [\"opus\", \"pro\"]},",
    "    \"writing\": {\"prefer\": [\"sonnet\", \"flash\"]},",
    "    \"visual-engineering\": {\"prefer\": [\"pro\", \"flash\"]}",
    "  }",
    "}",
    "",
  ].join("\n")

  writeFileSync(path, content, "utf-8")
}

function tryLoadRules(path: string): RulesShape | null {
  if (!existsSync(path)) return null
  try {
    const content = readFileSync(path, "utf-8")
    return parseJsonc<RulesShape>(content)
  } catch {
    return null
  }
}

function applyCategoryDefaultsFromRecommendations(params: {
  pluginConfig: OhMyOpenCodeConfig
  recommendations: CategoryRecommendation[]
}): void {
  const categories = (params.pluginConfig.categories ?? {}) as Record<string, any>
  let applied = 0

  const recMap = new Map<CategoryName, CategoryRecommendation>(
    params.recommendations.map((rec) => [rec.category, rec])
  )

  const quickDefault = recMap.get("quick")?.model
  const deepDefault = recMap.get("deep")?.model

  for (const rec of params.recommendations) {
    if (!rec.model) continue
    const existing = categories[rec.category] ?? {}
    if (typeof existing.model === "string" && existing.model.trim().length > 0) continue
    categories[rec.category] = { ...existing, model: rec.model }
    applied += 1
  }

  for (const rec of params.recommendations) {
    const existing = categories[rec.category] ?? {}
    if (existing.fallback_models !== undefined) continue

    const fallbackList = [...rec.fallback_models]

    if (quickDefault && quickDefault !== rec.model && !fallbackList.includes(quickDefault)) {
      fallbackList.push(quickDefault)
    }
    if (deepDefault && deepDefault !== rec.model && !fallbackList.includes(deepDefault)) {
      fallbackList.push(deepDefault)
    }

    if (fallbackList.length === 0) continue
    categories[rec.category] = { ...existing, fallback_models: fallbackList }
  }

  if (applied > 0) {
    params.pluginConfig.categories = categories as any
    log("[model-governor] applied category defaults", { applied })
  }
}

function applyAgentFallbackDefaultsFromRecommendations(params: {
  pluginConfig: OhMyOpenCodeConfig
  recommendations: CategoryRecommendation[]
}): void {
  const recMap = new Map<CategoryName, CategoryRecommendation>(
    params.recommendations.map((rec) => [rec.category, rec])
  )

  const agentDefaults: AgentCategoryDefaults = {
    sisyphus: "ultrabrain",
    hephaestus: "deep",
    prometheus: "quick",
    atlas: "deep",
    oracle: "ultrabrain",
    metis: "deep",
    momus: "deep",
    librarian: "quick",
    explore: "quick",
    "multimodal-looker": "visual-engineering",
    "sisyphus-junior": "deep",
  }

  const agents = (params.pluginConfig.agents ?? {}) as Record<string, any>
  let applied = 0

  for (const [agentName, category] of Object.entries(agentDefaults)) {
    const rec = recMap.get(category)
    if (!rec || rec.fallback_models.length === 0) continue

    const existing = agents[agentName] ?? {}
    if (existing.fallback_models !== undefined) continue

    agents[agentName] = { ...existing, fallback_models: rec.fallback_models }
    applied += 1
  }

  if (applied > 0) {
    params.pluginConfig.agents = agents as any
    log("[model-governor] applied agent fallback defaults", { applied })
  }
}

function formatReportMarkdown(input: {
  models: FullModelId[]
  recommendations: CategoryRecommendation[]
  rulesPath: string
}): string {
  const byProvider = new Map<string, string[]>()
  for (const m of input.models) {
    const list = byProvider.get(m.providerID) ?? []
    list.push(m.modelID)
    byProvider.set(m.providerID, list)
  }

  const providers = [...byProvider.keys()].sort((a, b) => a.localeCompare(b))

  const lines: string[] = []
  lines.push("# OpenCode Models Report")
  lines.push("")
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push("")
  lines.push("## Recommendations")
  lines.push("")
  for (const rec of input.recommendations) {
    const fallbackText = rec.fallback_models.length > 0
      ? ` | fallback: ${rec.fallback_models.join(", ")}`
      : ""
    lines.push(`- ${rec.category}: ${rec.model}${fallbackText}  (${rec.reason})`)
  }
  lines.push("")
  lines.push("## AUTO Rules")
  lines.push("")
  lines.push(`Rules file: ${input.rulesPath}`)
  lines.push("")
  lines.push("## Version Preference")
  lines.push("")
  lines.push("AUTO favors newer versions when model names include numeric segments.")
  lines.push("Example: 5.4 > 5.3 > 5.2, 4.6 > 4.5, 3.1 > 3.0.")
  lines.push("")
  lines.push("## Providers")
  lines.push("")
  lines.push(`Detected providers: ${providers.join(", ") || "(none)"}`)
  lines.push(`Total models: ${input.models.length}`)
  lines.push("")
  lines.push("## Models")
  lines.push("")
  for (const provider of providers) {
    const modelIDs = (byProvider.get(provider) ?? []).sort((a, b) => a.localeCompare(b))
    lines.push(`### ${provider}`)
    lines.push("")
    for (const modelID of modelIDs) {
      lines.push(`- ${provider}/${modelID}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

export function applyModelGovernor(pluginConfig: OhMyOpenCodeConfig): void {
  const enabled = pluginConfig.model_governor?.enabled ?? false
  const mode = pluginConfig.model_governor?.mode ?? (enabled ? "auto" : "off")
  if (!enabled || mode === "off") return

  const cache = loadModelsCache()
  if (!cache) {
    log("[model-governor] model cache not found; skip")
    return
  }

  const models = listAvailableModels(cache)

  const rulesPath = defaultRulesPath(pluginConfig)
  ensureRulesFile(rulesPath)
  const rules = tryLoadRules(rulesPath)

  const recommendations = recommendModels(models, rules)

  const reportEnabled = pluginConfig.model_governor?.report?.enabled ?? true
  if (reportEnabled) {
    const outPath = defaultReportPath(pluginConfig)
    ensureDir(outPath)

    const format = pluginConfig.model_governor?.report?.format ?? "md"
    if (format === "json") {
      writeFileSync(outPath, JSON.stringify({ recommendations, models, rulesPath }, null, 2), "utf-8")
    } else {
      writeFileSync(outPath, formatReportMarkdown({ models, recommendations, rulesPath }), "utf-8")
    }

    log("[model-governor] report written", { path: outPath, modelCount: models.length })
  }

  if (mode === "auto") {
    applyCategoryDefaultsFromRecommendations({ pluginConfig, recommendations })
    applyAgentFallbackDefaultsFromRecommendations({ pluginConfig, recommendations })
  }
}
