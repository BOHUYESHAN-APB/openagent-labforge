import { existsSync, readFileSync, promises as fs } from "fs"
import { dirname, extname, isAbsolute, join, relative, resolve } from "path"
import { fileURLToPath } from "url"
import picomatch from "picomatch"
import type { SkillsConfig } from "../../config/schema"
import { log } from "../../shared"
import { resolveSymlinkAsync } from "../../shared/file-utils"
import { normalizeSkillsConfig } from "./merger/skills-config-normalizer"
import { deduplicateSkillsByName } from "./skill-deduplication"
import { loadSkillsFromDir } from "./skill-directory-loader"
import { inferSkillNameFromFileName, loadSkillFromPath } from "./loaded-skill-from-path"
import type { LoadedSkill } from "./types"

const MAX_RECURSIVE_DEPTH = 10
const CONFIG_SOURCE_CACHE_TTL_MS = 5000

const configSourceSkillsCache = new Map<string, { expiresAt: number; skills: LoadedSkill[] }>()
const configSourceSkillsInFlight = new Map<string, Promise<LoadedSkill[]>>()

let packageRootDirCache: string | null = null

function getPackageRootDir(): string {
  if (packageRootDirCache) return packageRootDirCache

  let currentDir = dirname(fileURLToPath(import.meta.url))
  while (true) {
    const packageJsonPath = join(currentDir, "package.json")
    if (existsSync(packageJsonPath)) {
      try {
        const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string }
        if (
          parsed.name === "@bohuyeshan/openagent-labforge-core" ||
          parsed.name === "@labforge/openagent-labforge-core" ||
          parsed.name === "oh-my-opencode"
        ) {
          packageRootDirCache = currentDir
          return currentDir
        }
      } catch {
        // Continue climbing for a valid package root.
      }
    }

    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  // Fallback for unusual runtime layouts.
  packageRootDirCache = resolve(fileURLToPath(new URL("..", import.meta.url)))
  return packageRootDirCache
}

function buildConfigSourceCacheKey(options: {
  configDir: string
  bundle?: "full" | "paper"
  sources: Array<string | { path: string; recursive?: boolean; glob?: string }>
}): string {
  return JSON.stringify({
    configDir: normalizePathForGlob(options.configDir),
    bundle: options.bundle ?? null,
    sources: options.sources,
  })
}

function getGeneratedBundleSource(options: { configDir: string; bundle?: "full" | "paper" }): { path: string; recursive: true; glob?: string } | null {
  if (!options.bundle) return null

  const configDirCandidate = join(options.configDir, "generated", "skills-bundles", options.bundle, "skills")
  if (existsSync(configDirCandidate)) {
    return {
      path: configDirCandidate,
      recursive: true,
    }
  }

  const packageCandidate = join(getPackageRootDir(), "generated", "skills-bundles", options.bundle, "skills")
  return {
    path: packageCandidate,
    recursive: true,
  }
}

function isHttpUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://")
}

function toAbsolutePath(path: string, configDir: string): string {
  if (isAbsolute(path)) {
    return path
  }
  return join(configDir, path)
}

function isMarkdownPath(path: string): boolean {
  return extname(path).toLowerCase() === ".md"
}

export function normalizePathForGlob(path: string): string {
  return path.split("\\").join("/")
}

function filterByGlob(skills: LoadedSkill[], sourceBaseDir: string, globPattern?: string): LoadedSkill[] {
  if (!globPattern) return skills

  return skills.filter((skill) => {
    if (!skill.path) return false
    const rel = normalizePathForGlob(relative(sourceBaseDir, skill.path))
    return picomatch.isMatch(rel, globPattern, { dot: true, bash: true })
  })
}

async function loadSourcePath(options: {
  sourcePath: string
  recursive: boolean
  globPattern?: string
  configDir: string
}): Promise<LoadedSkill[]> {
  if (isHttpUrl(options.sourcePath)) {
    return []
  }

  const absolutePath = toAbsolutePath(options.sourcePath, options.configDir)
  const stat = await fs.stat(absolutePath).catch(() => null)
  if (!stat) return []

  if (stat.isFile()) {
    if (!isMarkdownPath(absolutePath)) return []
    const loaded = await loadSkillFromPath({
      skillPath: absolutePath,
      resolvedPath: dirname(absolutePath),
      defaultName: inferSkillNameFromFileName(absolutePath),
      scope: "config",
    })
    if (!loaded) return []
    return filterByGlob([loaded], dirname(absolutePath), options.globPattern)
  }

  if (!stat.isDirectory()) return []

  const resolvedBasePath = await resolveSymlinkAsync(absolutePath)

  const directorySkills = await loadSkillsFromDir({
    skillsDir: resolvedBasePath,
    scope: "config",
    maxDepth: options.recursive ? MAX_RECURSIVE_DEPTH : 0,
  })
  return filterByGlob(directorySkills, resolvedBasePath, options.globPattern)
}

export async function discoverConfigSourceSkills(options: {
  config: SkillsConfig | undefined
  configDir: string
}): Promise<LoadedSkill[]> {
  const startedAt = performance.now()
  const normalized = normalizeSkillsConfig(options.config)
  const generatedBundleSource = getGeneratedBundleSource({
    configDir: options.configDir,
    bundle: normalized.bundle,
  })

  const effectiveSources = generatedBundleSource
    ? [generatedBundleSource, ...normalized.sources]
    : normalized.sources

  const cacheKey = buildConfigSourceCacheKey({
    configDir: options.configDir,
    bundle: normalized.bundle,
    sources: effectiveSources,
  })

  const now = Date.now()
  const cached = configSourceSkillsCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    log("[perf] discoverConfigSourceSkills", {
      elapsedMs: Math.round(performance.now() - startedAt),
      configuredBundle: normalized.bundle,
      sourceCount: effectiveSources.length,
      resolvedBundlePath: generatedBundleSource?.path,
      loadedSkillCount: cached.skills.length,
      cache: "memory-hit",
    })
    return cached.skills
  }

  const inFlight = configSourceSkillsInFlight.get(cacheKey)
  if (inFlight) {
    const skills = await inFlight
    log("[perf] discoverConfigSourceSkills", {
      elapsedMs: Math.round(performance.now() - startedAt),
      configuredBundle: normalized.bundle,
      sourceCount: effectiveSources.length,
      resolvedBundlePath: generatedBundleSource?.path,
      loadedSkillCount: skills.length,
      cache: "inflight-hit",
    })
    return skills
  }

  const loadPromise = (async (): Promise<LoadedSkill[]> => {
    if (effectiveSources.length === 0) return []

    const loadedBySource = await Promise.all(
      effectiveSources.map((source) => {
        if (typeof source === "string") {
          return loadSourcePath({
            sourcePath: source,
            recursive: false,
            configDir: options.configDir,
          })
        }

        return loadSourcePath({
          sourcePath: source.path,
          recursive: source.recursive ?? false,
          globPattern: source.glob,
          configDir: options.configDir,
        })
      }),
    )

    return deduplicateSkillsByName(loadedBySource.flat())
  })()

  configSourceSkillsInFlight.set(cacheKey, loadPromise)

  try {
    const deduplicated = await loadPromise
    configSourceSkillsCache.set(cacheKey, {
      expiresAt: Date.now() + CONFIG_SOURCE_CACHE_TTL_MS,
      skills: deduplicated,
    })

    log("[perf] discoverConfigSourceSkills", {
      elapsedMs: Math.round(performance.now() - startedAt),
      configuredBundle: normalized.bundle,
      sourceCount: effectiveSources.length,
      resolvedBundlePath: generatedBundleSource?.path,
      loadedSkillCount: deduplicated.length,
      cache: "miss",
    })
    return deduplicated
  } finally {
    configSourceSkillsInFlight.delete(cacheKey)
  }
}
