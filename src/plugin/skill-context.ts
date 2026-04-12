import type { AvailableSkill } from "../agents/dynamic-agent-prompt-builder"
import type { OhMyOpenCodeConfig } from "../config"
import type { BrowserAutomationProvider } from "../config/schema/browser-automation"
import type {
  LoadedSkill,
  SkillScope,
} from "../features/opencode-skill-loader/types"

import {
  discoverConfigSourceSkills,
  discoverUserClaudeSkills,
  discoverProjectClaudeSkills,
  discoverOpencodeGlobalSkills,
  discoverOpencodeProjectSkills,
  discoverProjectAgentsSkills,
  discoverGlobalAgentsSkills,
  filterDiscoveryVisibleSkills,
  mergeSkills,
} from "../features/opencode-skill-loader"
import { createBuiltinSkills } from "../features/builtin-skills"
import { getSystemMcpServerNames } from "../features/claude-code-mcp-loader"
import { log } from "../shared"

const SKILL_CONTEXT_CACHE_TTL_MS = 30000

const skillContextCache = new Map<string, { expiresAt: number; value: SkillContext }>()
const skillContextInFlight = new Map<string, Promise<SkillContext>>()
const mergedSkillsCache = new Map<string, { expiresAt: number; value: LoadedSkill[] }>()
const mergedSkillsInFlight = new Map<string, Promise<LoadedSkill[]>>()

export type SkillContext = {
  availableSkills: AvailableSkill[]
  browserProvider: BrowserAutomationProvider
  disabledSkills: Set<string>
  getMergedSkills: () => Promise<LoadedSkill[]>
}

function mapScopeToLocation(scope: SkillScope): AvailableSkill["location"] {
  if (scope === "user" || scope === "opencode") return "user"
  if (scope === "project" || scope === "opencode-project") return "project"
  return "plugin"
}

function buildSkillContextCacheKey(args: {
  directory: string
  pluginConfig: OhMyOpenCodeConfig
  browserProvider: BrowserAutomationProvider
}): string {
  return JSON.stringify({
    directory: args.directory,
    browserProvider: args.browserProvider,
    disabledSkills: args.pluginConfig.disabled_skills ?? [],
    bundle: Array.isArray(args.pluginConfig.skills) ? undefined : args.pluginConfig.skills?.bundle,
    skillsSources: Array.isArray(args.pluginConfig.skills)
      ? []
      : (args.pluginConfig.skills?.sources ?? []),
    includeClaudeSkills: args.pluginConfig.claude_code?.skills !== false,
  })
}

async function loadMergedSkills(args: {
  cacheKey: string
  directory: string
  pluginConfig: OhMyOpenCodeConfig
  browserProvider: BrowserAutomationProvider
  phaseTimings?: Record<string, number>
}): Promise<LoadedSkill[]> {
  const now = Date.now()
  const cached = mergedSkillsCache.get(args.cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const inFlight = mergedSkillsInFlight.get(args.cacheKey)
  if (inFlight) {
    return await inFlight
  }

  const loadPromise = (async (): Promise<LoadedSkill[]> => {
    const builtinStartedAt = performance.now()
    const disabledSkills = new Set<string>(args.pluginConfig.disabled_skills ?? [])
    const systemMcpNames = getSystemMcpServerNames()

    const builtinSkills = createBuiltinSkills({
      browserProvider: args.browserProvider,
      disabledSkills,
    }).filter((skill) => {
      if (skill.mcpConfig) {
        for (const mcpName of Object.keys(skill.mcpConfig)) {
          if (systemMcpNames.has(mcpName)) return false
        }
      }
      return true
    })
    args.phaseTimings && (args.phaseTimings.builtinMs = Math.round(performance.now() - builtinStartedAt))

    const includeClaudeSkills = args.pluginConfig.claude_code?.skills !== false
    const discoverStartedAt = performance.now()
    const [configSourceSkills, userSkills, globalSkills, projectSkills, opencodeProjectSkills, agentsProjectSkills, agentsGlobalSkills] =
      await Promise.all([
        discoverConfigSourceSkills({
          config: args.pluginConfig.skills,
          configDir: args.directory,
        }),
        includeClaudeSkills ? discoverUserClaudeSkills() : Promise.resolve([]),
        discoverOpencodeGlobalSkills(),
        includeClaudeSkills ? discoverProjectClaudeSkills(args.directory) : Promise.resolve([]),
        discoverOpencodeProjectSkills(args.directory),
        discoverProjectAgentsSkills(args.directory),
        discoverGlobalAgentsSkills(),
      ])
    args.phaseTimings && (args.phaseTimings.discoverTotalMs = Math.round(performance.now() - discoverStartedAt))

    const mergeStartedAt = performance.now()
    const mergedSkills = mergeSkills(
      builtinSkills,
      args.pluginConfig.skills,
      configSourceSkills,
      [...userSkills, ...agentsGlobalSkills],
      globalSkills,
      [...projectSkills, ...agentsProjectSkills],
      opencodeProjectSkills,
      { configDir: args.directory },
    )
    args.phaseTimings && (args.phaseTimings.mergeMs = Math.round(performance.now() - mergeStartedAt))

    return mergedSkills
  })()

  mergedSkillsInFlight.set(args.cacheKey, loadPromise)
  try {
    const mergedSkills = await loadPromise
    mergedSkillsCache.set(args.cacheKey, {
      expiresAt: Date.now() + SKILL_CONTEXT_CACHE_TTL_MS,
      value: mergedSkills,
    })
    return mergedSkills
  } finally {
    mergedSkillsInFlight.delete(args.cacheKey)
  }
}

export async function createSkillContext(args: {
  directory: string
  pluginConfig: OhMyOpenCodeConfig
}): Promise<SkillContext> {
  const startedAt = performance.now()
  const { directory, pluginConfig } = args

  const browserProvider: BrowserAutomationProvider =
    pluginConfig.browser_automation_engine?.provider ?? "playwright"

  const cacheKey = buildSkillContextCacheKey({
    directory,
    pluginConfig,
    browserProvider,
  })

  const now = Date.now()
  const cached = skillContextCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    log("[perf] createSkillContext", {
      elapsedMs: Math.round(performance.now() - startedAt),
      availableSkillCount: cached.value.availableSkills.length,
      cache: "memory-hit",
    })
    return cached.value
  }

  const inFlight = skillContextInFlight.get(cacheKey)
  if (inFlight) {
    const context = await inFlight
    log("[perf] createSkillContext", {
      elapsedMs: Math.round(performance.now() - startedAt),
      availableSkillCount: context.availableSkills.length,
      cache: "inflight-hit",
    })
    return context
  }

  const buildPromise = (async (): Promise<SkillContext> => {
    const phaseTimings: Record<string, number> = {}
    const disabledSkills = new Set<string>(pluginConfig.disabled_skills ?? [])
    const mergedSkills = await loadMergedSkills({
      cacheKey,
      directory,
      pluginConfig,
      browserProvider,
      phaseTimings,
    })

    const availableStartedAt = performance.now()
    const availableSkills: AvailableSkill[] = filterDiscoveryVisibleSkills(mergedSkills).map((skill) => ({
      name: skill.name,
      description: skill.definition.description ?? "",
      location: mapScopeToLocation(skill.scope),
      category: skill.previewCategory,
    }))
    phaseTimings.availableMs = Math.round(performance.now() - availableStartedAt)

    const context: SkillContext = {
      availableSkills,
      browserProvider,
      disabledSkills,
      getMergedSkills: () => loadMergedSkills({
        cacheKey,
        directory,
        pluginConfig,
        browserProvider,
      }),
    }

    log("[perf] createSkillContext", {
      elapsedMs: Math.round(performance.now() - startedAt),
      mergedSkillCount: mergedSkills.length,
      availableSkillCount: availableSkills.length,
      cache: "miss",
      phaseTimings,
    })

    return context
  })()

  skillContextInFlight.set(cacheKey, buildPromise)

  try {
    const context = await buildPromise
    skillContextCache.set(cacheKey, {
      expiresAt: Date.now() + SKILL_CONTEXT_CACHE_TTL_MS,
      value: context,
    })
    return context
  } finally {
    skillContextInFlight.delete(cacheKey)
  }
}
