import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { extname, join } from "node:path"

const IGNORED_TOP_LEVEL = new Set([
  ".git",
  ".opencode",
  ".idea",
  ".vscode",
  "node_modules",
  "dist",
  "build",
  "target",
  "out",
  ".next",
  ".turbo",
  ".cache",
  ".venv",
  "venv",
  "__pycache__",
  "coverage",
])

const STRUCTURE_DIR_SIGNALS = new Set([
  "src",
  "app",
  "lib",
  "packages",
  "backend",
  "frontend",
  "docs",
  "test",
  "tests",
  "scripts",
  "server",
  "client",
])

const CODELIKE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rs",
  ".go",
  ".java",
  ".kt",
  ".dart",
  ".rb",
  ".php",
  ".cs",
  ".cpp",
  ".cc",
  ".c",
  ".h",
  ".hpp",
  ".swift",
  ".sh",
])

export interface FreshRepositoryDetection {
  isFresh: boolean
  reason?: string
  topLevelEntries: string[]
  codeLikeFileCount: number
  hasGit: boolean
  commitCount?: number
  trackedFileCount?: number
  isUnbornHead?: boolean
}

function readGitSignal(directory: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: directory,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return null
  }
}

function countTrackedFiles(directory: string): number | undefined {
  const output = readGitSignal(directory, ["ls-files"])
  if (output === null) return undefined
  if (output.length === 0) return 0
  return output.split(/\r?\n/).filter(Boolean).length
}

function getGitBootstrapState(directory: string): {
  hasGit: boolean
  commitCount?: number
  trackedFileCount?: number
  isUnbornHead?: boolean
} {
  const gitPath = join(directory, ".git")
  if (!existsSync(gitPath)) {
    return { hasGit: false }
  }

  const insideWorkTree = readGitSignal(directory, ["rev-parse", "--is-inside-work-tree"])
  if (insideWorkTree !== "true") {
    return { hasGit: false }
  }

  const head = readGitSignal(directory, ["rev-parse", "--verify", "HEAD"])
  const isUnbornHead = head === null
  const commitCount = isUnbornHead
    ? 0
    : Number.parseInt(readGitSignal(directory, ["rev-list", "--count", "HEAD"]) ?? "0", 10)
  const trackedFileCount = countTrackedFiles(directory)

  return {
    hasGit: true,
    commitCount: Number.isFinite(commitCount) ? commitCount : undefined,
    trackedFileCount,
    isUnbornHead,
  }
}

function countCodeLikeFiles(rootDir: string, depth = 0): number {
  if (depth > 2 || !existsSync(rootDir)) return 0

  let count = 0
  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_TOP_LEVEL.has(entry.name)) continue
      count += countCodeLikeFiles(join(rootDir, entry.name), depth + 1)
      continue
    }

    if (CODELIKE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      count += 1
    }
  }

  return count
}

export function detectFreshRepositoryBootstrap(directory: string): FreshRepositoryDetection {
  if (!existsSync(directory)) {
    return {
      isFresh: false,
      topLevelEntries: [],
      codeLikeFileCount: 0,
      hasGit: false,
    }
  }

  const gitState = getGitBootstrapState(directory)
  if (!gitState.hasGit) {
    return {
      isFresh: false,
      reason: "Bootstrap gate skipped because the repository has no git history or .git metadata is missing.",
      topLevelEntries: [],
      codeLikeFileCount: 0,
      hasGit: false,
    }
  }

  const topLevelEntries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !IGNORED_TOP_LEVEL.has(entry.name))
    .map((entry) => entry.name)

  const codeLikeFileCount = countCodeLikeFiles(directory)
  const hasStructureDir = topLevelEntries.some((name) => STRUCTURE_DIR_SIGNALS.has(name.toLowerCase()))
  const hasLargeTopLevelFile = topLevelEntries.some((name) => {
    const filePath = join(directory, name)
    try {
      return statSync(filePath).isFile() && statSync(filePath).size > 40_000
    } catch {
      return false
    }
  })

  const looksFresh =
    gitState.hasGit &&
    (gitState.isUnbornHead === true || (gitState.commitCount ?? 99) <= 1) &&
    (gitState.trackedFileCount ?? 999) <= 24 &&
    !hasStructureDir &&
    !hasLargeTopLevelFile &&
    topLevelEntries.length <= 8 &&
    codeLikeFileCount <= 8

  return {
    isFresh: looksFresh,
    reason: looksFresh
      ? `Fresh git-backed repository matched: commits=${gitState.commitCount ?? 0}, tracked=${gitState.trackedFileCount ?? 0}, visible_top_level=${topLevelEntries.length}, code_like=${codeLikeFileCount}.`
      : undefined,
    topLevelEntries,
    codeLikeFileCount,
    hasGit: gitState.hasGit,
    commitCount: gitState.commitCount,
    trackedFileCount: gitState.trackedFileCount,
    isUnbornHead: gitState.isUnbornHead,
  }
}
