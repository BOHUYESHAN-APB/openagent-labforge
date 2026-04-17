import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"

import {
  LEGACY_RUNTIME_DIR,
  BOULDER_DIR,
  OPENCODE_LABFORGE_DIR,
  RUNTIME_SESSION_STALE_TTL_MS,
  RUNTIME_TOOL_DIR,
} from "./constants"
import type {
  DocumentWorkspaceAudience,
  DocumentWorkspaceAssetEntry,
  DocumentWorkspacePublishTarget,
  DocumentWorkspacePaths,
  DocumentWorkspaceManifest,
  DocumentWorkspaceOutputEntry,
  DocumentWorkspaceRevisionEntry,
  DocumentWorkspaceRegistry,
  DocumentWorkspaceRegistryEntry,
  DocumentWorkspaceTrackingPolicy,
  PaperCacheEntry,
  PaperCacheManifest,
  PaperCachePaths,
  RuntimeWorkflowPaths,
  RuntimeWorkflowAutoModeLevel,
  RuntimeWorkflowArtifactMode,
  RuntimeWorkflowArtifactStrategy,
  RuntimeWorkflowInteractionMode,
  RuntimeWorkflowCheckpointKind,
  RuntimeWorkflowCheckpointScope,
  RuntimeWorkflowRehydrationLevel,
  RuntimeWorkflowSessionSwitchRecommendation,
  RuntimeWorkflowStage,
  RuntimeWorkflowState,
  RuntimeWorkflowTodoKind,
  RuntimeWorkflowTodoNode,
  RuntimeWorkflowTodoOwner,
  RuntimeWorkflowTodoSource,
  RuntimeWorkflowVerdict,
} from "./types"

function sanitizeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function countMarkdownCheckboxes(content: string): number {
  return (content.match(/^\s*[-*]\s*\[[ xX]\]/gm) ?? []).length
}

function classifyRuntimeWorkflowMode(args: {
  activePlan: string
  userRequestText?: string
}): {
  autoModeLevel: RuntimeWorkflowAutoModeLevel
  interactionMode: RuntimeWorkflowInteractionMode
  rationale: string
} {
  const heavySignals = [
    "migrate",
    "migration",
    "refactor",
    "roadmap",
    "architecture",
    "paper",
    "survey",
    "literature",
    "bio",
    "bioinformatics",
    "pipeline",
    "end-to-end",
    "full-stack",
    "integration",
    "acceptance",
    "validation",
  ]
  const haystackParts = [args.activePlan.toLowerCase()]
  const userRequest = args.userRequestText?.trim() ?? ""
  if (userRequest.length > 0) {
    haystackParts.push(userRequest.toLowerCase())
  }
  let checkboxCount = 0

  if (existsSync(args.activePlan)) {
    try {
      const content = readFileSync(args.activePlan, "utf-8")
      haystackParts.push(content.toLowerCase())
      checkboxCount = countMarkdownCheckboxes(content)
    } catch {
      // Ignore read failures and classify from path only.
    }
  }

  const haystack = haystackParts.join("\n")
  const matchedSignals = heavySignals.filter((signal) => haystack.includes(signal))
  const userRequestSignalCount =
    userRequest.length > 0
      ? heavySignals.filter((signal) => userRequest.toLowerCase().includes(signal)).length
      : 0
  const isHeavy = checkboxCount >= 8 || matchedSignals.length >= 2 || userRequestSignalCount >= 2

  return {
    autoModeLevel: isHeavy ? "heavy" : "light",
    interactionMode: isHeavy ? "continuous" : "batch",
    rationale: isHeavy
      ? `Heavy mode selected from ${checkboxCount} checklist item(s), plan signal(s): ${matchedSignals.join(", ") || "plan-size"}, and user-request signal count: ${userRequestSignalCount}.`
      : `Light mode selected from ${checkboxCount} checklist item(s), user-request signal count: ${userRequestSignalCount}, and limited heavy-scope signals.`,
  }
}

export function getWorkflowRootDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR)
}

export function getPlansDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "plans")
}

export function getDraftsDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "drafts")
}

export function getEvidenceDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "evidence")
}

export function getNotepadsDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "notepads")
}

export function getRuntimeRootDir(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "runtime")
}

export function getRuntimeWorkflowPaths(directory: string, sessionId: string): RuntimeWorkflowPaths {
  const safeSessionId = sanitizeSessionId(sessionId)
  const rootDir = join(getRuntimeRootDir(directory), safeSessionId)

  return {
    rootDir,
    artifactsDir: join(rootDir, "artifacts"),
    papersDir: join(rootDir, "papers"),
    documentsDir: join(rootDir, "documents"),
    assetsDir: join(rootDir, "assets"),
    stateFile: join(rootDir, "state.json"),
    missionFile: join(rootDir, "mission.md"),
    roadmapFile: join(rootDir, "roadmap.md"),
    stageAnchorFile: join(rootDir, "stage-anchor.md"),
    stageCapsuleFile: join(rootDir, "stage-capsule.md"),
    planFile: join(rootDir, "plan.md"),
    buildFile: join(rootDir, "build.md"),
    reviewFile: join(rootDir, "review.md"),
  }
}

function getLegacyRuntimeWorkflowPaths(directory: string, sessionId: string): RuntimeWorkflowPaths {
  const safeSessionId = sanitizeSessionId(sessionId)
  const rootDir = join(directory, BOULDER_DIR, LEGACY_RUNTIME_DIR, RUNTIME_TOOL_DIR, safeSessionId)

  return {
    rootDir,
    artifactsDir: join(rootDir, "artifacts"),
    papersDir: join(rootDir, "papers"),
    documentsDir: join(rootDir, "documents"),
    assetsDir: join(rootDir, "assets"),
    stateFile: join(rootDir, "state.json"),
    missionFile: join(rootDir, "mission.md"),
    roadmapFile: join(rootDir, "roadmap.md"),
    stageAnchorFile: join(rootDir, "stage-anchor.md"),
    stageCapsuleFile: join(rootDir, "stage-capsule.md"),
    planFile: join(rootDir, "plan.md"),
    buildFile: join(rootDir, "build.md"),
    reviewFile: join(rootDir, "review.md"),
  }
}

function createStageTemplate(args: {
  stage: RuntimeWorkflowStage
  sessionId: string
  activePlan: string
  activeAgent?: string
  worktreePath?: string
  currentWave?: number
  autoModeLevel?: RuntimeWorkflowAutoModeLevel
  interactionMode?: RuntimeWorkflowInteractionMode
}): string {
  const {
    stage,
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave = 1,
    autoModeLevel = "light",
    interactionMode = "batch",
  } = args

  return `# ${stage.toUpperCase()}

- Session: \`${sessionId}\`
- Active plan: \`${activePlan}\`
- Active agent: \`${activeAgent ?? "unknown"}\`
- Worktree: \`${worktreePath ?? "not-set"}\`
- Wave: \`${String(currentWave).padStart(3, "0")}\`
- Auto mode: \`${autoModeLevel}\`
- Interaction mode: \`${interactionMode}\`

Use this file as repo-local temporary memory for the current **${stage}** stage.

Rules:
- keep only stage-relevant notes here
- do not duplicate the whole conversation
- update this file when stage-specific assumptions, blockers, or artifacts change
- treat this file as temporary runtime memory, not as a committed project document
`
}

function createMissionTemplate(args: {
  sessionId: string
  activePlan: string
  activeAgent?: string
  worktreePath?: string
  autoModeLevel: RuntimeWorkflowAutoModeLevel
  interactionMode: RuntimeWorkflowInteractionMode
  rationale: string
}): string {
  const {
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    autoModeLevel,
    interactionMode,
    rationale,
  } = args

  return `# Mission

- Session: \`${sessionId}\`
- Active plan: \`${activePlan}\`
- Active agent: \`${activeAgent ?? "unknown"}\`
- Worktree: \`${worktreePath ?? "not-set"}\`
- Auto mode: \`${autoModeLevel}\`
- Interaction mode: \`${interactionMode}\`

## Mission Statement

Record the durable objective, scope boundaries, and non-negotiable constraints for this run.

## Constraints

- keep this file focused on the long-horizon objective
- do not duplicate day-to-day execution chatter here
- update when the mission or risk posture materially changes

## Mode Rationale

${rationale}
`
}

function createRoadmapTemplate(args: {
  sessionId: string
  activePlan: string
  autoModeLevel: RuntimeWorkflowAutoModeLevel
  interactionMode: RuntimeWorkflowInteractionMode
  currentWave: number
  rationale: string
}): string {
  const {
    sessionId,
    activePlan,
    autoModeLevel,
    interactionMode,
    currentWave,
    rationale,
  } = args

  return `# Roadmap

- Session: \`${sessionId}\`
- Active plan: \`${activePlan}\`
- Auto mode: \`${autoModeLevel}\`
- Interaction mode: \`${interactionMode}\`
- Current wave: \`${String(currentWave).padStart(3, "0")}\`

## Workflow Contract

- \`light\` mode: smaller execution waves, lighter backlog pressure, stop naturally after a reviewed batch
- \`heavy\` mode: deep backlog expansion, stronger continuation pressure, and explicit multi-wave execution
- \`batch\` interaction: finish the current reviewed batch before pausing
- \`continuous\` interaction: keep rolling into the next execution wave when obvious work remains

## Current Rationale

${rationale}

## Wave Notes

- Use \`wave-XXX-plan.md\`, \`wave-XXX-build.md\`, and \`wave-XXX-review.md\` for stage-local memory
- Advance the wave when review rejection or a major re-plan creates a new execution cycle
`
}

function normalizeStageGuidance(stage: RuntimeWorkflowStage): string {
  if (stage === "plan") {
    return "Decide the next wave, keep scope disciplined, and avoid speculative backlog inflation."
  }
  if (stage === "review") {
    return "Accept, reject, or reopen the current wave using concrete findings instead of vibe-based completion."
  }
  return "Execute the current wave, verify real outputs, and update the state after each checkpoint."
}

function buildStageAnchorMemory(args: {
  state: RuntimeWorkflowState
  paths: RuntimeWorkflowPaths
}): string {
  const { state, paths } = args
  const lines = [
    "# Stage Anchor",
    "",
    `- Session: \`${state.session_id}\``,
    `- Stage: \`${state.current_stage}\``,
    `- Wave: \`${String(state.current_wave ?? 1).padStart(3, "0")}\``,
    `- Auto mode: \`${state.auto_mode_level ?? "light"}\``,
    `- Interaction mode: \`${state.interaction_mode ?? "batch"}\``,
    `- Active plan: \`${state.active_plan}\``,
    `- Stage file: \`${getStageFilePath(paths, state.current_stage)}\``,
    "",
    "## Durable Constraints",
    "",
    `- ${normalizeStageGuidance(state.current_stage)}`,
    "- Treat repo-local runtime files as the canonical execution memory when the chat history is compressed or degraded.",
    "- Do not reopen broad package trees if artifact policy already identifies the active root and work item.",
  ]

  if (state.artifact_mode) {
    lines.push(`- Artifact mode: \`${state.artifact_mode}\``)
  }
  if (state.artifact_root) {
    lines.push(`- Artifact root: \`${state.artifact_root}\``)
  }
  if (state.active_work_item) {
    lines.push(`- Active work item: ${state.active_work_item}`)
  }
  if (state.last_review_verdict) {
    lines.push(`- Last review verdict: \`${state.last_review_verdict}\``)
  }
  if (state.next_stage) {
    lines.push(`- Next stage on reopen: \`${state.next_stage}\``)
  }
  if (state.manual_boundaries && state.manual_boundaries.length > 0) {
    lines.push("", "## User-Owned / Manual Boundaries", "")
    for (const boundary of state.manual_boundaries) {
      lines.push(`- ${boundary}`)
    }
  }
  if (state.structured_todos && state.structured_todos.length > 0) {
    lines.push("", "## Structured Todo Graph", "")
    for (const todo of state.structured_todos) {
      lines.push(`- [${todo.status}] (${todo.kind}/${todo.owner}) ${todo.content}`)
    }
  }

  return `${lines.join("\n")}\n`
}

function buildStageCapsuleMemory(args: {
  state: RuntimeWorkflowState
}): string {
  const { state } = args
  const lines = [
    "# Stage Capsule",
    "",
    `- Stage: \`${state.current_stage}\``,
    `- Wave: \`${String(state.current_wave ?? 1).padStart(3, "0")}\``,
    `- Mode: \`${state.auto_mode_level ?? "light"} + ${state.interaction_mode ?? "batch"}\``,
    `- Anchor epoch: \`${state.stage_anchor_epoch ?? 1}\``,
    `- Guidance: ${normalizeStageGuidance(state.current_stage)}`,
    "- If context was compressed, reload this capsule before recreating a bigger stage prompt.",
  ]

  if (state.artifact_root) {
    lines.push(`- Artifact root: \`${state.artifact_root}\``)
  }
  if (state.active_work_item) {
    lines.push(`- Active work item: ${state.active_work_item}`)
  }
  if (state.last_rehydration_reason) {
    lines.push(`- Last rehydration reason: ${state.last_rehydration_reason}`)
  }
  if (state.manual_boundaries && state.manual_boundaries.length > 0) {
    lines.push(`- Manual boundaries: ${state.manual_boundaries.join(" | ")}`)
  }
  if (state.structured_todos && state.structured_todos.length > 0) {
    const activeTodos = state.structured_todos
      .filter((todo) => todo.status !== "completed" && todo.status !== "cancelled" && todo.status !== "deleted")
      .slice(0, 6)
      .map((todo) => `${todo.kind}/${todo.owner}:${todo.content}`)
    if (activeTodos.length > 0) {
      lines.push(`- Structured todos: ${activeTodos.join(" | ")}`)
    }
  }

  return `${lines.join("\n")}\n`
}

function normalizeTodoGraphSnapshot(todos: RuntimeWorkflowTodoNode[]): string {
  return JSON.stringify(
    todos.map((todo) => ({
      id: todo.id ?? null,
      content: todo.content,
      status: todo.status,
      priority: todo.priority,
      kind: todo.kind,
      owner: todo.owner,
      source: todo.source,
    })),
  )
}

function guessUserOwnedFromBoundaries(
  content: string,
  boundaries: string[] | undefined,
): boolean {
  if (!boundaries || boundaries.length === 0) return false

  const normalized = content.toLowerCase()
  const keywordGroups = [
    ["下载", "download"],
    ["安装", "install"],
    ["上传", "upload"],
    ["提交", "commit"],
    ["推送", "push"],
    ["运行", "run"],
    ["拉取", "pull"],
    ["执行", "execute"],
  ]

  return keywordGroups.some((group) => {
    const boundaryMatched = boundaries.some((boundary) =>
      group.some((keyword) => boundary.toLowerCase().includes(keyword)),
    )
    return boundaryMatched && group.some((keyword) => normalized.includes(keyword))
  })
}

function classifyRuntimeTodoNode(args: {
  todo: { id?: string; content: string; status: string; priority: string }
  manualBoundaries?: string[]
}): RuntimeWorkflowTodoNode {
  const { todo, manualBoundaries } = args
  const normalized = todo.content.toLowerCase()

  let kind: RuntimeWorkflowTodoKind = "implement"
  let owner: RuntimeWorkflowTodoOwner = "agent"
  let source: RuntimeWorkflowTodoSource = "model"

  if (todo.status === "blocked") {
    kind = "blocked"
    owner = "external"
    source = "system"
  } else if (
    /acceptance-review|acceptance reviewer|reviewer|验收|review blocker|review gate/i.test(normalized)
  ) {
    kind = "review-gate"
    owner = "external"
    source = "review"
  } else if (
    /verify|validation|validate|qa|re-verify|check|required tools|smoke|regression/i.test(normalized)
  ) {
    kind = "verify"
  } else if (
    /install|setup|toolchain|environment|bootstrap|wsl|conda|uv|fastqc|fastp|hisat2|samtools|salmon|featurecounts|sra-toolkit|bedtools|seqtk|minimap2|bwa/i.test(normalized)
  ) {
    kind = "setup"
  } else if (
    /record|write up|write-up|note|manifest|readme|doc|docs|说明|清单|记录|报告|summary|route|boundaries|prerequisites/i.test(normalized)
  ) {
    kind = "document"
  } else if (
    /inspect|locate|find|discover|audit|probe|identify|check which|核对|审计|确认/i.test(normalized)
  ) {
    kind = "discovery"
  }

  if (guessUserOwnedFromBoundaries(todo.content, manualBoundaries)) {
    kind = "user-owned"
    owner = "user"
    source = "manual-boundary"
  }

  return {
    id: todo.id,
    content: todo.content,
    status: todo.status,
    priority: todo.priority,
    kind,
    owner,
    source,
  }
}

function computeStageAnchorHash(content: string): string {
  return createHash("sha1").update(content).digest("hex").slice(0, 12)
}

function refreshRuntimeWorkflowMemoryFiles(args: {
  paths: RuntimeWorkflowPaths
  state: RuntimeWorkflowState
}): RuntimeWorkflowState {
  const { paths } = args
  const anchorContent = buildStageAnchorMemory(args)
  const capsuleContent = buildStageCapsuleMemory(args)
  const anchorHash = computeStageAnchorHash(anchorContent)

  writeFileSync(paths.stageAnchorFile, anchorContent, "utf-8")
  writeFileSync(paths.stageCapsuleFile, capsuleContent, "utf-8")

  return {
    ...args.state,
    stage_anchor_hash: anchorHash,
  }
}

function ensureDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

function writeFileIfMissing(path: string, content: string): void {
  if (!existsSync(path)) {
    ensureDirectory(dirname(path))
    writeFileSync(path, content, "utf-8")
  }
}

function writeJsonIfMissing(path: string, value: unknown): void {
  if (!existsSync(path)) {
    ensureDirectory(dirname(path))
    writeFileSync(path, JSON.stringify(value, null, 2), "utf-8")
  }
}

function readJsonIfExists<T>(path: string): T | null {
  if (!existsSync(path)) return null

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T
  } catch {
    return null
  }
}

function writeJson(path: string, value: unknown): void {
  ensureDirectory(dirname(path))
  writeFileSync(path, JSON.stringify(value, null, 2), "utf-8")
}

function getStageFilePath(paths: RuntimeWorkflowPaths, stage: RuntimeWorkflowStage): string {
  switch (stage) {
    case "plan":
      return paths.planFile
    case "build":
      return paths.buildFile
    case "review":
      return paths.reviewFile
  }
}

function getWaveStageFilePath(
  paths: RuntimeWorkflowPaths,
  wave: number,
  stage: RuntimeWorkflowStage,
): string {
  return join(paths.rootDir, `wave-${String(wave).padStart(3, "0")}-${stage}.md`)
}

function writeWaveFilesIfMissing(args: {
  paths: RuntimeWorkflowPaths
  sessionId: string
  activePlan: string
  activeAgent?: string
  worktreePath?: string
  currentWave: number
  autoModeLevel: RuntimeWorkflowAutoModeLevel
  interactionMode: RuntimeWorkflowInteractionMode
}): void {
  const {
    paths,
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave,
    autoModeLevel,
    interactionMode,
  } = args

  for (const stage of ["plan", "build", "review"] as const) {
    writeFileIfMissing(
      getWaveStageFilePath(paths, currentWave, stage),
      createStageTemplate({
        stage,
        sessionId,
        activePlan,
        activeAgent,
        worktreePath,
        currentWave,
        autoModeLevel,
        interactionMode,
      }),
    )
  }
}

function resolveGitDir(directory: string): string | null {
  try {
    const gitDir = execFileSync("git", ["rev-parse", "--git-dir"], {
      cwd: directory,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    return resolve(directory, gitDir)
  } catch {
    const directGitDir = join(directory, ".git")
    return existsSync(directGitDir) ? directGitDir : null
  }
}

export function ensureRuntimeWorkflowGitExclude(directory: string): boolean {
  const gitDir = resolveGitDir(directory)
  if (!gitDir) return false

  const infoDir = join(gitDir, "info")
  const excludePath = join(infoDir, "exclude")
  ensureDirectory(infoDir)

  const patterns = [
    ".opencode/",
    ".opencode/**",
  ]

  const existing = existsSync(excludePath) ? readFileSync(excludePath, "utf-8") : ""
  const lines = new Set(existing.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))

  let changed = false
  for (const pattern of patterns) {
    if (!lines.has(pattern)) {
      lines.add(pattern)
      changed = true
    }
  }

  if (!existsSync(excludePath) || changed) {
    const nextContent = `${Array.from(lines).join("\n")}\n`
    writeFileSync(excludePath, nextContent, "utf-8")
  }

  return true
}

export function ensureRuntimeWorkflowSession(args: {
  directory: string
  sessionId: string
  activePlan: string
  activeAgent?: string
  worktreePath?: string
  currentStage?: RuntimeWorkflowStage
  autoModeLevel?: RuntimeWorkflowAutoModeLevel
  interactionMode?: RuntimeWorkflowInteractionMode
  userRequestText?: string
}): { paths: RuntimeWorkflowPaths; state: RuntimeWorkflowState; excludeApplied: boolean } {
  const {
    directory,
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentStage = "plan",
    autoModeLevel,
    interactionMode,
    userRequestText,
  } = args

  const existing = readRuntimeWorkflowState(directory, sessionId)
  const mode = classifyRuntimeWorkflowMode({ activePlan, userRequestText })
  const resolvedAutoModeLevel =
    autoModeLevel ??
    existing?.auto_mode_level ??
    mode.autoModeLevel
  const resolvedInteractionMode =
    interactionMode ??
    existing?.interaction_mode ??
    mode.interactionMode
  const currentWave = existing?.current_wave ?? 1

  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  ensureDirectory(paths.rootDir)
  ensureDirectory(paths.artifactsDir)
  ensureDirectory(paths.papersDir)
  ensureDirectory(paths.documentsDir)
  ensureDirectory(paths.assetsDir)
  writeJsonIfMissing(join(paths.papersDir, "manifest.json"), {
    session_id: sessionId,
    entries: [],
  } satisfies PaperCacheManifest)
  writeJsonIfMissing(join(paths.documentsDir, "manifest.json"), {
    session_id: sessionId,
    documents: [],
  } satisfies DocumentWorkspaceRegistry)

  const now = new Date().toISOString()
  const state: RuntimeWorkflowState = {
    ...(existing ?? {}),
    schema_version: 1,
    session_id: sessionId,
    active_plan: activePlan,
    ...(activeAgent !== undefined ? { active_agent: activeAgent } : {}),
    ...(worktreePath !== undefined ? { worktree_path: worktreePath } : {}),
    current_stage: currentStage,
    current_wave: currentWave,
    auto_mode_level: resolvedAutoModeLevel,
    interaction_mode: resolvedInteractionMode,
    mode_rationale: existing?.mode_rationale ?? mode.rationale,
    stage_anchor_epoch: existing?.stage_anchor_epoch ?? 1,
    rehydration_level: existing?.rehydration_level ?? "full-anchor",
    manual_boundaries: existing?.manual_boundaries ?? [],
    manual_boundary_updated_at: existing?.manual_boundary_updated_at,
    structured_todos: existing?.structured_todos ?? [],
    todo_graph_generation: existing?.todo_graph_generation ?? 0,
    todo_graph_snapshot: existing?.todo_graph_snapshot,
    last_todo_reconciliation_at: existing?.last_todo_reconciliation_at,
    started_at: existing?.started_at ?? now,
    updated_at: now,
  }

  const hydratedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state,
  })
  writeFileSync(paths.stateFile, JSON.stringify(hydratedState, null, 2), "utf-8")
  writeFileIfMissing(paths.missionFile, createMissionTemplate({
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
    rationale: mode.rationale,
  }))
  writeFileIfMissing(paths.roadmapFile, createRoadmapTemplate({
    sessionId,
    activePlan,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
    currentWave,
    rationale: mode.rationale,
  }))
  writeFileIfMissing(paths.planFile, createStageTemplate({
    stage: "plan",
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
  }))
  writeFileIfMissing(paths.buildFile, createStageTemplate({
    stage: "build",
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
  }))
  writeFileIfMissing(paths.reviewFile, createStageTemplate({
    stage: "review",
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
  }))
  writeWaveFilesIfMissing({
    paths,
    sessionId,
    activePlan,
    activeAgent,
    worktreePath,
    currentWave,
    autoModeLevel: resolvedAutoModeLevel,
    interactionMode: resolvedInteractionMode,
  })

  return {
    paths,
    state: hydratedState,
    excludeApplied: ensureRuntimeWorkflowGitExclude(directory),
  }
}

function sanitizeDocumentId(documentId: string): string {
  return documentId.replace(/[^a-zA-Z0-9._-]/g, "_") || "document"
}

function getDocumentAudienceSegment(audience?: DocumentWorkspaceAudience): string | null {
  if (audience === "public-reader") return "public-reader"
  if (audience === "end-user") return "end-user"
  return null
}

function createDocumentWorkspacePaths(rootDir: string): DocumentWorkspacePaths {
  return {
    rootDir,
    sourceDir: join(rootDir, "source"),
    sectionsDir: join(rootDir, "source", "sections"),
    diagramsDir: join(rootDir, "source", "diagrams"),
    figuresDir: join(rootDir, "source", "figures"),
    assetsDir: join(rootDir, "source", "assets"),
    renderedDir: join(rootDir, "rendered"),
    outputDir: join(rootDir, "output"),
    manifestFile: join(rootDir, "manifest.json"),
  }
}

export function getDocumentWorkspacePaths(
  directory: string,
  sessionId: string,
  documentId: string,
  options?: { audience?: DocumentWorkspaceAudience },
): DocumentWorkspacePaths {
  const runtimePaths = getRuntimeWorkflowPaths(directory, sessionId)
  const safeDocumentId = sanitizeDocumentId(documentId)
  const audienceSegment = getDocumentAudienceSegment(options?.audience)
  const rootDir = audienceSegment
    ? join(runtimePaths.documentsDir, audienceSegment, safeDocumentId)
    : join(runtimePaths.documentsDir, safeDocumentId)

  return createDocumentWorkspacePaths(rootDir)
}

export interface RuntimeWorkflowCleanupResult {
  removedSessionIds: string[]
  keptSessionIds: string[]
}

export function cleanupStaleRuntimeWorkflowSessions(args: {
  directory: string
  maxAgeMs?: number
  now?: number
}): RuntimeWorkflowCleanupResult {
  const { directory, maxAgeMs = RUNTIME_SESSION_STALE_TTL_MS, now = Date.now() } = args
  const runtimeRoot = getRuntimeRootDir(directory)
  if (!existsSync(runtimeRoot)) {
    return { removedSessionIds: [], keptSessionIds: [] }
  }

  const removedSessionIds: string[] = []
  const keptSessionIds: string[] = []

  for (const entry of readdirSync(runtimeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const sessionId = entry.name
    const paths = getRuntimeWorkflowPaths(directory, sessionId)
    const state = readRuntimeWorkflowState(directory, sessionId)

    let stale = false
    if (state?.updated_at) {
      const updatedAt = Date.parse(state.updated_at)
      stale = Number.isFinite(updatedAt) ? now - updatedAt > maxAgeMs : false
    } else {
      const stat = statSync(paths.rootDir)
      stale = now - stat.mtimeMs > maxAgeMs
    }

    if (stale) {
      rmSync(paths.rootDir, { recursive: true, force: true })
      removedSessionIds.push(sessionId)
    } else {
      keptSessionIds.push(sessionId)
    }
  }

  return { removedSessionIds, keptSessionIds }
}

export function ensureDocumentWorkspace(args: {
  directory: string
  sessionId: string
  documentId: string
  title?: string
  documentType?: string
  audience?: DocumentWorkspaceAudience
  trackingPolicy?: DocumentWorkspaceTrackingPolicy
  publishTarget?: DocumentWorkspacePublishTarget
  preferredRepoPath?: string
  initializeGit?: boolean
}): DocumentWorkspacePaths {
  const paths = getDocumentWorkspacePaths(args.directory, args.sessionId, args.documentId, {
    audience: args.audience,
  })
  const {
    directory,
    sessionId,
    documentId,
    title,
    documentType,
    audience,
    trackingPolicy = "workspace-git",
    publishTarget,
    preferredRepoPath,
    initializeGit = true,
  } = args

  ensureDirectory(paths.rootDir)
  ensureDirectory(paths.sourceDir)
  ensureDirectory(paths.sectionsDir)
  ensureDirectory(paths.diagramsDir)
  ensureDirectory(paths.figuresDir)
  ensureDirectory(paths.assetsDir)
  ensureDirectory(paths.renderedDir)
  ensureDirectory(paths.outputDir)

  const now = new Date().toISOString()
  const manifest: DocumentWorkspaceManifest = {
    session_id: sessionId,
    document_id: sanitizeDocumentId(documentId),
    ...(title !== undefined ? { title } : {}),
    ...(documentType !== undefined ? { document_type: documentType } : {}),
    ...(audience !== undefined ? { audience } : {}),
    ...(trackingPolicy !== undefined ? { tracking_policy: trackingPolicy } : {}),
    ...(publishTarget !== undefined ? { publish_target: publishTarget } : {}),
    ...(preferredRepoPath !== undefined ? { preferred_repo_path: preferredRepoPath } : {}),
    assets: [],
    outputs: [],
    revisions: [],
  }
  writeJsonIfMissing(paths.manifestFile, manifest)

  writeFileIfMissing(join(paths.sourceDir, "main.md"), `# ${documentId}\n`)
  writeFileIfMissing(join(paths.rootDir, ".gitignore"), `output/\nrendered/\n*.docx\n*.pdf\n*.pptx\n*.png\n*.jpg\n*.jpeg\n`)

  const runtimePaths = getRuntimeWorkflowPaths(directory, sessionId)
  const registryPath = join(runtimePaths.documentsDir, "manifest.json")
  const existingRegistry = readJsonIfExists<DocumentWorkspaceRegistry>(registryPath) ?? {
    session_id: sessionId,
    documents: [],
  }
  const nextEntry: DocumentWorkspaceRegistryEntry = {
    document_id: sanitizeDocumentId(documentId),
    ...(title !== undefined ? { title } : {}),
    ...(documentType !== undefined ? { document_type: documentType } : {}),
    ...(audience !== undefined ? { audience } : {}),
    ...(trackingPolicy !== undefined ? { tracking_policy: trackingPolicy } : {}),
    ...(publishTarget !== undefined ? { publish_target: publishTarget } : {}),
    ...(preferredRepoPath !== undefined ? { preferred_repo_path: preferredRepoPath } : {}),
    root_dir: paths.rootDir,
    manifest_file: paths.manifestFile,
    initialized_at: now,
    updated_at: now,
  }
  const existingIndex = existingRegistry.documents.findIndex((entry) => entry.document_id === nextEntry.document_id)
  if (existingIndex >= 0) {
    existingRegistry.documents[existingIndex] = {
      ...existingRegistry.documents[existingIndex],
      ...nextEntry,
      initialized_at: existingRegistry.documents[existingIndex].initialized_at,
    }
  } else {
    existingRegistry.documents.push(nextEntry)
  }
  writeJson(registryPath, existingRegistry)

  if (initializeGit && trackingPolicy === "workspace-git") {
    ensureDocumentWorkspaceGitRepo(paths.rootDir)
  }

  return paths
}

export function ensureDocumentWorkspaceGitRepo(rootDir: string): boolean {
  const gitDir = join(rootDir, ".git")
  if (existsSync(gitDir)) {
    return true
  }

  try {
    execFileSync("git", ["init"], {
      cwd: rootDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return true
  } catch {
    return false
  }
}

export function readDocumentWorkspaceManifest(paths: DocumentWorkspacePaths): DocumentWorkspaceManifest | null {
  return readJsonIfExists<DocumentWorkspaceManifest>(paths.manifestFile)
}

export function appendDocumentWorkspaceRevision(args: {
  paths: DocumentWorkspacePaths
  summary: string
  metadata?: Record<string, unknown>
}): DocumentWorkspaceManifest | null {
  const manifest = readDocumentWorkspaceManifest(args.paths)
  if (!manifest) return null

  const nextManifest: DocumentWorkspaceManifest = {
    ...manifest,
    revisions: [
      ...manifest.revisions,
      {
        summary: args.summary,
        ...(args.metadata ? { metadata: args.metadata } : {}),
        created_at: new Date().toISOString(),
      },
    ],
  }
  writeJson(args.paths.manifestFile, nextManifest)
  return nextManifest
}

export function upsertDocumentWorkspaceAsset(args: {
  paths: DocumentWorkspacePaths
  asset: Omit<DocumentWorkspaceAssetEntry, "updated_at">
}): DocumentWorkspaceManifest | null {
  const manifest = readDocumentWorkspaceManifest(args.paths)
  if (!manifest) return null

  const nextAsset: DocumentWorkspaceAssetEntry = {
    ...args.asset,
    updated_at: new Date().toISOString(),
  }

  const nextAssets = [...manifest.assets]
  const index = nextAssets.findIndex((entry) => entry.asset_id === nextAsset.asset_id)
  if (index >= 0) {
    nextAssets[index] = { ...nextAssets[index], ...nextAsset }
  } else {
    nextAssets.push(nextAsset)
  }

  const nextManifest: DocumentWorkspaceManifest = {
    ...manifest,
    assets: nextAssets,
  }
  writeJson(args.paths.manifestFile, nextManifest)
  return nextManifest
}

export function appendDocumentWorkspaceOutput(args: {
  paths: DocumentWorkspacePaths
  output: Omit<DocumentWorkspaceOutputEntry, "updated_at">
}): DocumentWorkspaceManifest | null {
  const manifest = readDocumentWorkspaceManifest(args.paths)
  if (!manifest) return null

  const nextOutput: DocumentWorkspaceOutputEntry = {
    ...args.output,
    updated_at: new Date().toISOString(),
  }

  const nextManifest: DocumentWorkspaceManifest = {
    ...manifest,
    outputs: [...manifest.outputs, nextOutput],
  }
  writeJson(args.paths.manifestFile, nextManifest)
  return nextManifest
}

export function getPaperCachePaths(directory: string, sessionId: string): PaperCachePaths {
  const runtimePaths = getRuntimeWorkflowPaths(directory, sessionId)

  return {
    rootDir: runtimePaths.papersDir,
    manifestFile: join(runtimePaths.papersDir, "manifest.json"),
    pdfDir: join(runtimePaths.papersDir, "pdf"),
    markdownDir: join(runtimePaths.papersDir, "markdown"),
    notesDir: join(runtimePaths.papersDir, "notes"),
    citationsDir: join(runtimePaths.papersDir, "citations"),
  }
}

export function ensurePaperCache(args: {
  directory: string
  sessionId: string
}): PaperCachePaths {
  const paths = getPaperCachePaths(args.directory, args.sessionId)

  ensureDirectory(paths.rootDir)
  ensureDirectory(paths.pdfDir)
  ensureDirectory(paths.markdownDir)
  ensureDirectory(paths.notesDir)
  ensureDirectory(paths.citationsDir)
  writeJsonIfMissing(paths.manifestFile, {
    session_id: args.sessionId,
    entries: [],
  } satisfies PaperCacheManifest)

  return paths
}

export function readPaperCacheManifest(paths: PaperCachePaths): PaperCacheManifest | null {
  return readJsonIfExists<PaperCacheManifest>(paths.manifestFile)
}

export function upsertPaperCacheEntry(args: {
  paths: PaperCachePaths
  entry: Omit<PaperCacheEntry, "updated_at">
}): PaperCacheManifest {
  const existing = readPaperCacheManifest(args.paths) ?? {
    session_id: basename(dirname(args.paths.rootDir)),
    entries: [],
  }

  const nextEntry: PaperCacheEntry = {
    ...args.entry,
    updated_at: new Date().toISOString(),
  }

  const nextEntries = [...existing.entries]
  const index = nextEntries.findIndex((entry) => entry.paper_id === nextEntry.paper_id)
  if (index >= 0) {
    nextEntries[index] = {
      ...nextEntries[index],
      ...nextEntry,
    }
  } else {
    nextEntries.push(nextEntry)
  }

  const nextManifest: PaperCacheManifest = {
    ...existing,
    entries: nextEntries,
  }
  writeJson(args.paths.manifestFile, nextManifest)
  return nextManifest
}

export interface CacheCleanupResult {
  removedSessionIds: string[]
  trimmedDocumentOutputs: string[]
}

export function cleanupDocumentWorkspaceOutputs(args: {
  paths: DocumentWorkspacePaths
  maxOutputFiles?: number
}): number {
  const { paths, maxOutputFiles = 20 } = args
  const manifest = readDocumentWorkspaceManifest(paths)
  if (!manifest) return 0

  if (manifest.outputs.length <= maxOutputFiles) {
    return 0
  }

  const keptOutputs = manifest.outputs.slice(-maxOutputFiles)
  const removedCount = manifest.outputs.length - keptOutputs.length
  const nextManifest: DocumentWorkspaceManifest = {
    ...manifest,
    outputs: keptOutputs,
  }
  writeJson(paths.manifestFile, nextManifest)
  return removedCount
}

export function cleanupWorkflowCaches(args: {
  directory: string
  maxAgeMs?: number
  now?: number
  maxDocumentOutputs?: number
}): CacheCleanupResult {
  const {
    directory,
    maxAgeMs,
    now,
    maxDocumentOutputs = 20,
  } = args

  const runtimeCleanup = cleanupStaleRuntimeWorkflowSessions({
    directory,
    ...(maxAgeMs !== undefined ? { maxAgeMs } : {}),
    ...(now !== undefined ? { now } : {}),
  })

  const trimmedDocumentOutputs: string[] = []
  const runtimeRoot = getRuntimeRootDir(directory)
  if (existsSync(runtimeRoot)) {
    for (const sessionEntry of readdirSync(runtimeRoot, { withFileTypes: true })) {
      if (!sessionEntry.isDirectory()) continue

      const documentsDir = join(runtimeRoot, sessionEntry.name, "documents")
      if (!existsSync(documentsDir)) continue

      const documentRoots: string[] = []
      for (const docEntry of readdirSync(documentsDir, { withFileTypes: true })) {
        if (!docEntry.isDirectory()) continue
        const candidateRoot = join(documentsDir, docEntry.name)
        if (existsSync(join(candidateRoot, "manifest.json"))) {
          documentRoots.push(candidateRoot)
          continue
        }

        for (const nestedEntry of readdirSync(candidateRoot, { withFileTypes: true })) {
          if (!nestedEntry.isDirectory()) continue
          const nestedRoot = join(candidateRoot, nestedEntry.name)
          if (existsSync(join(nestedRoot, "manifest.json"))) {
            documentRoots.push(nestedRoot)
          }
        }
      }

      for (const rootDir of documentRoots) {
        const paths = createDocumentWorkspacePaths(rootDir)
        const removed = cleanupDocumentWorkspaceOutputs({
          paths,
          maxOutputFiles: maxDocumentOutputs,
        })
        if (removed > 0) {
          trimmedDocumentOutputs.push(basename(rootDir))
        }
      }
    }
  }

  return {
    removedSessionIds: runtimeCleanup.removedSessionIds,
    trimmedDocumentOutputs,
  }
}

export function readRuntimeWorkflowState(directory: string, sessionId: string): RuntimeWorkflowState | null {
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const legacyPaths = getLegacyRuntimeWorkflowPaths(directory, sessionId)
  const candidatePaths = existsSync(paths.stateFile)
    ? paths
    : existsSync(legacyPaths.stateFile)
      ? legacyPaths
      : null
  if (!candidatePaths) return null

  try {
    return JSON.parse(readFileSync(candidatePaths.stateFile, "utf-8")) as RuntimeWorkflowState
  } catch {
    return null
  }
}

export function clearRuntimeWorkflowSession(directory: string, sessionId: string): boolean {
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const legacyPaths = getLegacyRuntimeWorkflowPaths(directory, sessionId)

  try {
    rmSync(paths.rootDir, { recursive: true, force: true })
    rmSync(legacyPaths.rootDir, { recursive: true, force: true })
    return true
  } catch {
    return false
  }
}

export function updateRuntimeWorkflowStage(args: {
  directory: string
  sessionId: string
  currentStage: RuntimeWorkflowStage
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, currentStage, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    current_stage: currentStage,
    rehydration_level: "full-anchor",
    last_rehydration_reason: `stage-switch:${currentStage}`,
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })
  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: currentStage,
      content: note,
    })
  }

  return refreshedState
}

export function updateRuntimeWorkflowArtifactPolicy(args: {
  directory: string
  sessionId: string
  artifactMode?: RuntimeWorkflowArtifactMode
  artifactRoot?: string
  artifactStrategy?: RuntimeWorkflowArtifactStrategy
  activeWorkItem?: string
  artifactRationale?: string
  note?: string
}): RuntimeWorkflowState | null {
  const {
    directory,
    sessionId,
    artifactMode,
    artifactRoot,
    artifactStrategy,
    activeWorkItem,
    artifactRationale,
    note,
  } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    ...(artifactMode !== undefined ? { artifact_mode: artifactMode } : {}),
    ...(artifactRoot !== undefined ? { artifact_root: artifactRoot } : {}),
    ...(artifactStrategy !== undefined ? { artifact_strategy: artifactStrategy } : {}),
    ...(activeWorkItem !== undefined ? { active_work_item: activeWorkItem } : {}),
    ...(artifactRationale !== undefined ? { artifact_rationale: artifactRationale } : {}),
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: nextState.current_stage,
      content: note,
    })
  }

  return refreshedState
}

export function updateRuntimeWorkflowManualBoundaries(args: {
  directory: string
  sessionId: string
  boundaries: string[]
  merge?: boolean
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, boundaries, merge = true, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const normalizedBoundaries = boundaries
    .map((entry) => entry.trim())
    .filter((entry, index, array) => entry.length > 0 && array.indexOf(entry) === index)

  const nextManualBoundaries = merge
    ? Array.from(new Set([...(existing.manual_boundaries ?? []), ...normalizedBoundaries]))
    : normalizedBoundaries

  const nextState: RuntimeWorkflowState = {
    ...existing,
    manual_boundaries: nextManualBoundaries,
    manual_boundary_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })
  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: refreshedState.current_stage,
      content: note,
    })
  }

  return refreshedState
}

export function reconcileRuntimeWorkflowTodoGraph(args: {
  directory: string
  sessionId: string
  todos: Array<{ id?: string; content: string; status: string; priority: string }>
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, todos, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const structuredTodos = todos.map((todo) =>
    classifyRuntimeTodoNode({
      todo,
      manualBoundaries: existing.manual_boundaries,
    }),
  )
  const snapshot = normalizeTodoGraphSnapshot(structuredTodos)
  const nextGeneration =
    snapshot !== existing.todo_graph_snapshot
      ? (existing.todo_graph_generation ?? 0) + 1
      : (existing.todo_graph_generation ?? 0)

  const nextState: RuntimeWorkflowState = {
    ...existing,
    structured_todos: structuredTodos,
    todo_graph_snapshot: snapshot,
    todo_graph_generation: nextGeneration,
    last_todo_reconciliation_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })
  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note && snapshot !== existing.todo_graph_snapshot) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: refreshedState.current_stage,
      content: note,
    })
  }

  return refreshedState
}

export function updateRuntimeWorkflowReviewOutcome(args: {
  directory: string
  sessionId: string
  verdict: RuntimeWorkflowVerdict
  blockingFindings?: string[]
  nextStage?: RuntimeWorkflowStage
  signature?: string
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, verdict, blockingFindings, nextStage, signature, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    current_stage: "review",
    last_review_verdict: verdict,
    ...(nextStage !== undefined ? { next_stage: nextStage } : {}),
    ...(blockingFindings !== undefined ? { blocking_findings: blockingFindings } : {}),
    ...(signature !== undefined ? { last_review_signature: signature } : {}),
    review_rejection_count:
      verdict === "reject"
        ? (existing.review_rejection_count ?? 0) + 1
        : (existing.review_rejection_count ?? 0),
    rehydration_level: "capsule",
    last_rehydration_reason: `review:${verdict}`,
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: "review",
      content: note,
    })
  }

  return refreshedState
}

export function markRuntimeWorkflowReviewHandled(args: {
  directory: string
  sessionId: string
  signature: string
  nextStage: RuntimeWorkflowStage
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, signature, nextStage, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const shouldAdvanceWave =
    existing.last_review_verdict === "reject" &&
    (existing.last_review_signature === signature || existing.last_review_signature === undefined)
  const nextWave = shouldAdvanceWave
    ? Math.max(1, (existing.current_wave ?? 1) + 1)
    : (existing.current_wave ?? 1)

  if (shouldAdvanceWave) {
    writeWaveFilesIfMissing({
      paths,
      sessionId,
      activePlan: existing.active_plan,
      activeAgent: existing.active_agent,
      worktreePath: existing.worktree_path,
      currentWave: nextWave,
      autoModeLevel: existing.auto_mode_level ?? "light",
      interactionMode: existing.interaction_mode ?? "batch",
    })
  }

  const nextState: RuntimeWorkflowState = {
    ...existing,
    current_stage: nextStage,
    current_wave: nextWave,
    next_stage: nextStage,
    last_review_handled_signature: signature,
    rehydration_level: "full-anchor",
    last_rehydration_reason: `review-handled:${nextStage}`,
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: nextStage,
      content: note,
    })
  }

  return refreshedState
}

export function reopenRuntimeWorkflowAfterApprovedBatch(args: {
  directory: string
  sessionId: string
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null
  if (existing.last_review_verdict !== "approve") return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    current_stage: "build",
    next_stage: "build",
    last_review_verdict: undefined,
    blocking_findings: undefined,
    last_review_signature: undefined,
    last_review_handled_signature: undefined,
    last_terminal_message_signature: undefined,
    rehydration_level: "full-anchor",
    last_rehydration_reason: "approved-batch-reopened",
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: "build",
      content: note,
    })
  }

  return refreshedState
}

export function markRuntimeWorkflowTerminalMessageHandled(args: {
  directory: string
  sessionId: string
  signature: string
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, signature, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  if (existing.last_terminal_message_signature === signature) {
    return existing
  }

  const nextState: RuntimeWorkflowState = {
    ...existing,
    last_terminal_message_signature: signature,
    rehydration_level: "capsule",
    last_rehydration_reason: "terminal-message-handled",
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: nextState.current_stage,
      content: note,
    })
  }

  return refreshedState
}

export function markRuntimeWorkflowCompacted(args: {
  directory: string
  sessionId: string
  note?: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, note } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    stage_anchor_epoch: (existing.stage_anchor_epoch ?? 1) + 1,
    rehydration_level: "capsule",
    last_rehydration_reason: "compaction",
    last_compaction_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })

  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")

  if (note) {
    appendRuntimeWorkflowNote({
      directory,
      sessionId,
      stage: refreshedState.current_stage,
      content: note,
    })
  }

  return refreshedState
}

export function markRuntimeWorkflowPromptRehydrated(args: {
  directory: string
  sessionId: string
  level: RuntimeWorkflowRehydrationLevel
  reason: string
}): RuntimeWorkflowState | null {
  const { directory, sessionId, level, reason } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const now = new Date().toISOString()
  const nextState: RuntimeWorkflowState = {
    ...existing,
    rehydration_level: level,
    last_rehydration_reason: reason,
    ...(level === "full-anchor" ? { last_full_anchor_at: now } : {}),
    ...(level === "capsule" ? { last_capsule_at: now } : {}),
    updated_at: now,
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })
  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")
  return refreshedState
}

export function markRuntimeWorkflowCheckpoint(args: {
  directory: string
  sessionId: string
  checkpointKind: RuntimeWorkflowCheckpointKind
  checkpointScope: RuntimeWorkflowCheckpointScope
  sessionSwitchRecommendation: RuntimeWorkflowSessionSwitchRecommendation
}): RuntimeWorkflowState | null {
  const {
    directory,
    sessionId,
    checkpointKind,
    checkpointScope,
    sessionSwitchRecommendation,
  } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const existing = readRuntimeWorkflowState(directory, sessionId)
  if (!existing) return null

  const nextState: RuntimeWorkflowState = {
    ...existing,
    last_checkpoint_kind: checkpointKind,
    last_checkpoint_scope: checkpointScope,
    last_session_switch_recommendation: sessionSwitchRecommendation,
    rehydration_level: checkpointKind === "heavy" ? "full-anchor" : "capsule",
    last_rehydration_reason: `checkpoint:${checkpointKind}`,
    updated_at: new Date().toISOString(),
  }
  const refreshedState = refreshRuntimeWorkflowMemoryFiles({
    paths,
    state: nextState,
  })
  writeFileSync(paths.stateFile, JSON.stringify(refreshedState, null, 2), "utf-8")
  return refreshedState
}

export function appendRuntimeWorkflowNote(args: {
  directory: string
  sessionId: string
  stage: RuntimeWorkflowStage
  content: string
}): boolean {
  const { directory, sessionId, stage, content } = args
  const paths = getRuntimeWorkflowPaths(directory, sessionId)
  const state = readRuntimeWorkflowState(directory, sessionId)
  const currentWave = state?.current_wave ?? 1
  const targetFiles = [
    getStageFilePath(paths, stage),
    getWaveStageFilePath(paths, currentWave, stage),
  ]
  const existingTargets = targetFiles.filter((targetFile) => existsSync(targetFile))
  if (existingTargets.length === 0) return false

  const stamped = `\n## ${new Date().toISOString()}\n\n${content.trim()}\n`
  for (const targetFile of existingTargets) {
    const current = readFileSync(targetFile, "utf-8")
    writeFileSync(targetFile, `${current}${stamped}`, "utf-8")
  }
  return true
}
