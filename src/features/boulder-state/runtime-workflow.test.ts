import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"

import {
  appendRuntimeWorkflowNote,
  ensureRuntimeWorkflowGitExclude,
  ensureRuntimeWorkflowSession,
  getRuntimeWorkflowPaths,
  markRuntimeWorkflowCompacted,
  markRuntimeWorkflowTerminalMessageHandled,
  markRuntimeWorkflowReviewHandled,
  readRuntimeWorkflowState,
  reconcileRuntimeWorkflowTodoGraph,
  reopenRuntimeWorkflowAfterApprovedBatch,
  updateRuntimeWorkflowArtifactPolicy,
  updateRuntimeWorkflowManualBoundaries,
  updateRuntimeWorkflowStage,
  updateRuntimeWorkflowReviewOutcome,
} from "./runtime-workflow"
import {
  parseAcceptanceReviewBlocker,
  parseAcceptanceReviewOutcome,
  parseLatestAcceptanceReviewBlocker,
  parseLatestAcceptanceReviewOutcome,
} from "./review-outcome"

describe("runtime-workflow", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `runtime-workflow-test-${randomUUID()}`)
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, ".git", "info"), { recursive: true })
    writeFileSync(join(testDir, ".git", "info", "exclude"), "")
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  test("creates runtime workflow paths under repo-local .sisyphus runtime directory", () => {
    const paths = getRuntimeWorkflowPaths(testDir, "session:123")

    expect(paths.rootDir).toContain(".opencode")
    expect(paths.rootDir).toContain("openagent-labforge")
    expect(paths.rootDir).toContain("runtime")
    expect(paths.rootDir).toContain("session_123")
    expect(paths.papersDir).toEndWith("papers")
    expect(paths.documentsDir).toEndWith("documents")
    expect(paths.assetsDir).toEndWith("assets")
    expect(paths.stateFile).toEndWith("state.json")
    expect(paths.missionFile).toEndWith("mission.md")
    expect(paths.roadmapFile).toEndWith("roadmap.md")
    expect(paths.stageAnchorFile).toEndWith("stage-anchor.md")
    expect(paths.stageCapsuleFile).toEndWith("stage-capsule.md")
    expect(paths.planFile).toEndWith("plan.md")
    expect(paths.buildFile).toEndWith("build.md")
    expect(paths.reviewFile).toEndWith("review.md")
  })

  test("creates runtime workflow session files and writes state json", () => {
    const result = ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-abc",
      activePlan: "/repo/.sisyphus/plans/test.md",
      activeAgent: "atlas",
      worktreePath: "/repo",
      currentStage: "plan",
    })

    expect(existsSync(result.paths.rootDir)).toBe(true)
    expect(existsSync(result.paths.artifactsDir)).toBe(true)
    expect(existsSync(result.paths.papersDir)).toBe(true)
    expect(existsSync(result.paths.documentsDir)).toBe(true)
    expect(existsSync(result.paths.assetsDir)).toBe(true)
    expect(existsSync(result.paths.stateFile)).toBe(true)
    expect(existsSync(result.paths.missionFile)).toBe(true)
    expect(existsSync(result.paths.roadmapFile)).toBe(true)
    expect(existsSync(result.paths.stageAnchorFile)).toBe(true)
    expect(existsSync(result.paths.stageCapsuleFile)).toBe(true)
    expect(existsSync(result.paths.planFile)).toBe(true)
    expect(existsSync(result.paths.buildFile)).toBe(true)
    expect(existsSync(result.paths.reviewFile)).toBe(true)
    expect(existsSync(join(result.paths.rootDir, "wave-001-plan.md"))).toBe(true)
    expect(existsSync(join(result.paths.rootDir, "wave-001-build.md"))).toBe(true)
    expect(existsSync(join(result.paths.rootDir, "wave-001-review.md"))).toBe(true)

    const state = JSON.parse(readFileSync(result.paths.stateFile, "utf-8"))
    expect(state.session_id).toBe("session-abc")
    expect(state.active_plan).toBe("/repo/.sisyphus/plans/test.md")
    expect(state.active_agent).toBe("atlas")
    expect(state.current_stage).toBe("plan")
    expect(state.current_wave).toBe(1)
    expect(state.stage_anchor_epoch).toBe(1)
    expect(state.rehydration_level).toBe("full-anchor")
    expect(typeof state.stage_anchor_hash).toBe("string")
    expect(typeof state.auto_mode_level).toBe("string")
    expect(typeof state.interaction_mode).toBe("string")
  })

  test("marks runtime workflow as compacted and promotes capsule recovery", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-compacted-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "build",
    })

    const updated = markRuntimeWorkflowCompacted({
      directory: testDir,
      sessionId: "session-compacted-1",
      note: "Compaction happened.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-compacted-1")
    expect(updated?.rehydration_level).toBe("capsule")
    expect(updated?.last_rehydration_reason).toBe("compaction")
    expect(updated?.stage_anchor_epoch).toBe(2)
    expect(state?.last_compaction_at).toBeDefined()
  })

  test("adds runtime workflow path to .git/info/exclude without duplication", () => {
    const first = ensureRuntimeWorkflowGitExclude(testDir)
    const second = ensureRuntimeWorkflowGitExclude(testDir)

    expect(first).toBe(true)
    expect(second).toBe(true)

    const exclude = readFileSync(join(testDir, ".git", "info", "exclude"), "utf-8")
    const lines = exclude.split(/\r?\n/).filter(Boolean)
    expect(lines.filter((line) => line === ".opencode/")).toHaveLength(1)
    expect(exclude).toContain(".opencode/**")
  })

  test("updates runtime workflow stage and appends stage note", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-stage-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "plan",
    })

    const updated = updateRuntimeWorkflowStage({
      directory: testDir,
      sessionId: "session-stage-1",
      currentStage: "review",
      note: "Acceptance review started.",
    })

    const paths = getRuntimeWorkflowPaths(testDir, "session-stage-1")
    const reviewFile = readFileSync(paths.reviewFile, "utf-8")

    expect(updated?.current_stage).toBe("review")
    expect(readRuntimeWorkflowState(testDir, "session-stage-1")?.current_stage).toBe("review")
    expect(reviewFile).toContain("Acceptance review started.")
  })

  test("appends runtime workflow note to stage file", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-note-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "build",
    })

    const ok = appendRuntimeWorkflowNote({
      directory: testDir,
      sessionId: "session-note-1",
      stage: "build",
      content: "Build wave resumed after reviewer rejection.",
    })

    const paths = getRuntimeWorkflowPaths(testDir, "session-note-1")
    const buildFile = readFileSync(paths.buildFile, "utf-8")

    expect(ok).toBe(true)
    expect(buildFile).toContain("Build wave resumed after reviewer rejection.")
  })

  test("records reject review outcome with next-stage routing", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-review-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "build",
    })

    const updated = updateRuntimeWorkflowReviewOutcome({
      directory: testDir,
      sessionId: "session-review-1",
      verdict: "reject",
      blockingFindings: ["Missing acceptance evidence", "Result overstates evidence"],
      nextStage: "plan",
      signature: "reject:1",
      note: "Acceptance reviewer rejected the current delivery.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-review-1")
    const reviewFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-review-1").reviewFile, "utf-8")

    expect(updated?.last_review_verdict).toBe("reject")
    expect(updated?.next_stage).toBe("plan")
    expect(updated?.review_rejection_count).toBe(1)
    expect(updated?.last_review_signature).toBe("reject:1")
    expect(state?.blocking_findings).toEqual(["Missing acceptance evidence", "Result overstates evidence"])
    expect(reviewFile).toContain("Acceptance reviewer rejected the current delivery.")
  })

  test("updates artifact policy without rereading broad package structure each turn", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-artifact-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
      currentStage: "build",
    })

    const updated = updateRuntimeWorkflowArtifactPolicy({
      directory: testDir,
      sessionId: "session-artifact-1",
      artifactMode: "package-bundle",
      artifactRoot: "output_new/contest_bundle",
      artifactStrategy: "update-existing-first",
      activeWorkItem: "67/68 promoter figure set",
      artifactRationale: "Resume inside the existing bundle instead of spawning a new top-level package.",
      note: "Artifact policy restored from checkpoint handoff.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-artifact-1")
    const buildFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-artifact-1").buildFile, "utf-8")

    expect(updated?.artifact_mode).toBe("package-bundle")
    expect(updated?.artifact_root).toBe("output_new/contest_bundle")
    expect(updated?.artifact_strategy).toBe("update-existing-first")
    expect(updated?.active_work_item).toBe("67/68 promoter figure set")
    expect(state?.artifact_rationale).toContain("existing bundle")
    expect(buildFile).toContain("Artifact policy restored from checkpoint handoff.")
  })

  test("persists explicit user-owned manual boundaries in runtime workflow state", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-manual-boundary-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
      currentStage: "build",
    })

    const updated = updateRuntimeWorkflowManualBoundaries({
      directory: testDir,
      sessionId: "session-manual-boundary-1",
      boundaries: ["下载由我处理，我手动去下载。"],
      note: "User kept download work as a manual responsibility.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-manual-boundary-1")
    const buildFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-manual-boundary-1").stageAnchorFile, "utf-8")

    expect(updated?.manual_boundaries).toContain("下载由我处理，我手动去下载。")
    expect(state?.manual_boundary_updated_at).toBeDefined()
    expect(buildFile).toContain("User-Owned / Manual Boundaries")
  })

  test("reconciles a structured runtime todo graph with setup, verify, review-gate, and user-owned tasks", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-todo-graph-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
      currentStage: "build",
    })

    updateRuntimeWorkflowManualBoundaries({
      directory: testDir,
      sessionId: "session-todo-graph-1",
      boundaries: ["下载由我处理，我手动去下载。"],
    })

    const updated = reconcileRuntimeWorkflowTodoGraph({
      directory: testDir,
      sessionId: "session-todo-graph-1",
      todos: [
        { id: "1", content: "Install the minimal RNA-seq toolchain in WSL", status: "in_progress", priority: "high" },
        { id: "2", content: "Verify the installed WSL tools required for the first wave", status: "pending", priority: "high" },
        { id: "3", content: "Keep the acceptance-review blocker explicitly recorded for this checkpoint", status: "pending", priority: "medium" },
        { id: "4", content: "下载剩余数据文件", status: "pending", priority: "medium" },
      ],
      note: "Todo graph reconciled.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-todo-graph-1")
    expect(updated?.todo_graph_generation).toBe(1)
    expect(state?.structured_todos?.map((todo) => todo.kind)).toEqual([
      "setup",
      "verify",
      "review-gate",
      "user-owned",
    ])
    expect(state?.structured_todos?.map((todo) => todo.owner)).toEqual([
      "agent",
      "agent",
      "external",
      "user",
    ])
  })

  test("preserves wave and mode state when the runtime workflow session is re-initialized", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-reuse-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
      currentStage: "plan",
    })

    updateRuntimeWorkflowReviewOutcome({
      directory: testDir,
      sessionId: "session-reuse-1",
      verdict: "reject",
      blockingFindings: ["Need deeper verification"],
      nextStage: "build",
      signature: "reject:reuse",
    })
    markRuntimeWorkflowReviewHandled({
      directory: testDir,
      sessionId: "session-reuse-1",
      signature: "reject:reuse",
      nextStage: "build",
    })

    const resumed = ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-reuse-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
      currentStage: "build",
    })

    expect(resumed.state.current_wave).toBe(2)
    expect(resumed.state.auto_mode_level).toBeDefined()
    expect(resumed.state.interaction_mode).toBeDefined()
  })

  test("parses approve and reject acceptance-review outcomes", () => {
    const reject = parseAcceptanceReviewOutcome(`[REJECT]
Summary: Not ready.
Blocking Findings:
1. Missing verification evidence
2. Need stronger design logic
`)
    const approve = parseAcceptanceReviewOutcome(`[APPROVE]
Summary: Ready to ship.`)

    expect(reject?.verdict).toBe("reject")
    expect(reject?.blockingFindings).toContain("Missing verification evidence")
    expect(reject?.nextStage).toBe("plan")
    expect(typeof reject?.signature).toBe("string")
    expect(approve?.verdict).toBe("approve")
  })

  test("parses latest acceptance review outcome from assistant messages", () => {
    const parsed = parseLatestAcceptanceReviewOutcome([
      { info: { role: "assistant" }, parts: [{ type: "text", text: "normal output" }] },
      { info: { role: "assistant" }, parts: [{ type: "text", text: "[REJECT]\n1. Missing verification evidence" }] },
    ])

    expect(parsed?.verdict).toBe("reject")
    expect(parsed?.blockingFindings).toContain("Missing verification evidence")
  })

  test("parses acceptance review blocker from assistant closeout text", () => {
    const parsed = parseAcceptanceReviewBlocker(
      "正式 acceptance-review delegation 仍受工具不可用阻塞，因此当前只能先停在这里等待后续处理。",
    )

    expect(parsed?.reason).toContain("acceptance-review")
    expect(typeof parsed?.signature).toBe("string")
  })

  test("parses the latest acceptance review blocker from assistant messages", () => {
    const parsed = parseLatestAcceptanceReviewBlocker([
      { info: { role: "assistant", id: "msg-1" }, parts: [{ type: "text", text: "old blocker" }] },
      {
        info: { role: "assistant", id: "msg-2" },
        parts: [{
          type: "text",
          text: "正式 acceptance-review delegation 仍受工具不可用阻塞，因此当前只能先停在这里等待后续处理。",
        }],
      },
    ])

    expect(parsed?.messageId).toBe("msg-2")
    expect(parsed?.reason).toContain("工具不可用")
  })

  test("marks review rejection as handled and moves to next stage", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-handle-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "review",
    })

    updateRuntimeWorkflowReviewOutcome({
      directory: testDir,
      sessionId: "session-handle-1",
      verdict: "reject",
      blockingFindings: ["Need stronger evidence"],
      nextStage: "build",
      signature: "reject:sig",
    })

    const handled = markRuntimeWorkflowReviewHandled({
      directory: testDir,
      sessionId: "session-handle-1",
      signature: "reject:sig",
      nextStage: "build",
      note: "Review rejection routed back to build.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-handle-1")
    const buildFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-handle-1").buildFile, "utf-8")

    expect(handled?.current_stage).toBe("build")
    expect(handled?.current_wave).toBe(2)
    expect(state?.last_review_handled_signature).toBe("reject:sig")
    expect(buildFile).toContain("Review rejection routed back to build.")
    expect(existsSync(join(getRuntimeWorkflowPaths(testDir, "session-handle-1").rootDir, "wave-002-build.md"))).toBe(true)
  })

  test("reopens execution when fresh user guidance arrives after an approved batch", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-approve-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "review",
    })

    updateRuntimeWorkflowReviewOutcome({
      directory: testDir,
      sessionId: "session-approve-1",
      verdict: "approve",
      signature: "approve:sig",
      note: "Acceptance review approved the current delivery.",
    })

    const reopened = reopenRuntimeWorkflowAfterApprovedBatch({
      directory: testDir,
      sessionId: "session-approve-1",
      note: "Fresh user guidance reopened execution.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-approve-1")
    const buildFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-approve-1").buildFile, "utf-8")

    expect(reopened?.current_stage).toBe("build")
    expect(state?.last_review_verdict).toBeUndefined()
    expect(state?.next_stage).toBe("build")
    expect(buildFile).toContain("Fresh user guidance reopened execution.")
  })

  test("records the latest handled terminal completion signature", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-terminal-1",
      activePlan: "/repo/.sisyphus/plans/test.md",
      currentStage: "review",
    })

    const updated = markRuntimeWorkflowTerminalMessageHandled({
      directory: testDir,
      sessionId: "session-terminal-1",
      signature: "terminal:sig:1",
      note: "Batch completion was handled and should not be re-audited on the same message.",
    })

    const state = readRuntimeWorkflowState(testDir, "session-terminal-1")
    const reviewFile = readFileSync(getRuntimeWorkflowPaths(testDir, "session-terminal-1").reviewFile, "utf-8")

    expect(updated?.last_terminal_message_signature).toBe("terminal:sig:1")
    expect(state?.last_terminal_message_signature).toBe("terminal:sig:1")
    expect(reviewFile).toContain("should not be re-audited")
  })
})
