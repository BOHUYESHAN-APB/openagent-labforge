import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  ensureRuntimeWorkflowSession,
  reconcileRuntimeWorkflowTodoGraph,
  writeRepoBootstrapSelection,
  updateRuntimeWorkflowArtifactPolicy,
} from "../features/boulder-state"
import {
  resetSessionBootstrapModesForTesting,
  setSessionBootstrapMode,
} from "../features/claude-code-session-state"
import {
  buildAutonomousUserDirectiveContext,
  buildFreshRepoBootstrapContext,
  buildStageManagedPromptContext,
} from "./stage-managed-prompt"

describe("buildStageManagedPromptContext", () => {
  afterEach(() => {
    resetSessionBootstrapModesForTesting()
  })

  test("uses light batch defaults for wase without runtime workflow state", () => {
    const result = buildStageManagedPromptContext({
      directory: process.cwd(),
      sessionID: "ses_default",
      agent: "wase",
    })

    expect(result).toContain("Agent: wase")
    expect(result).toContain("Stage: build")
    expect(result).toContain("Auto mode: light")
    expect(result).toContain("Interaction mode: batch")
    expect(result).toContain("## Engineering Orchestration Reload")
    expect(result).toContain("## Engineering Execution Reload")
  })

  test("uses explicit heavy review workflow state for bio autopilot", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_bio",
      activePlan: planPath,
      activeAgent: "bio-autopilot",
      currentStage: "review",
      autoModeLevel: "heavy",
      interactionMode: "continuous",
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_bio",
      agent: "bio-autopilot",
    })

    expect(result).toContain("Stage: review")
    expect(result).toContain("Auto mode: heavy")
    expect(result).toContain("Interaction mode: continuous")
    expect(result).toContain("Acceptance review belongs here")
    expect(result).toContain("## Autonomous Acceptance Reload")
    expect(result).toContain("## Autonomous Closeout Reload")
    expect(result).toContain("## Engineering Execution Reload")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("does not inject runtime stage guidance for sisyphus without workflow state", () => {
    const result = buildStageManagedPromptContext({
      directory: process.cwd(),
      sessionID: "ses_no_runtime",
      agent: "sisyphus",
    })

    expect(result).toBeNull()
  })

  test("injects runtime stage guidance for sisyphus when workflow state exists", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-sisyphus-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n- [ ] Task 2\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_sisyphus",
      activePlan: planPath,
      activeAgent: "sisyphus",
      currentStage: "build",
      autoModeLevel: "light",
      interactionMode: "batch",
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_sisyphus",
      agent: "sisyphus",
    })

    expect(result).toContain("Agent: sisyphus")
    expect(result).toContain("## Engineering Orchestration Reload")
    expect(result).toContain("## Engineering Execution Reload")
    expect(result).toContain("## Autonomous Acceptance Reload")
    expect(result).not.toContain("## Autonomous Closeout Reload")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("injects compact artifact policy context from runtime workflow state", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-artifact-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_artifact",
      activePlan: planPath,
      activeAgent: "bio-autopilot",
      currentStage: "build",
      autoModeLevel: "heavy",
      interactionMode: "continuous",
    })
    updateRuntimeWorkflowArtifactPolicy({
      directory: testDir,
      sessionId: "ses_artifact",
      artifactMode: "package-bundle",
      artifactRoot: "output_new/contest_bundle",
      artifactStrategy: "update-existing-first",
      activeWorkItem: "67/68 promoter figure set",
      artifactRationale: "Checkpoint resume should continue inside the current package.",
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_artifact",
      agent: "bio-autopilot",
    })

    expect(result).toContain("[artifact-policy-reload]")
    expect(result).toContain("Artifact mode: package-bundle")
    expect(result).toContain("output_new/contest_bundle")
    expect(result).toContain("67/68 promoter figure set")
    expect(result).toContain("Token discipline")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("injects structured todo graph context from runtime workflow state", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-todo-graph-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_todo_graph",
      activePlan: planPath,
      activeAgent: "bio-autopilot",
      currentStage: "build",
      autoModeLevel: "heavy",
      interactionMode: "continuous",
    })
    reconcileRuntimeWorkflowTodoGraph({
      directory: testDir,
      sessionId: "ses_todo_graph",
      todos: [
        { id: "1", content: "Install the minimal RNA-seq toolchain in WSL", status: "in_progress", priority: "high" },
        { id: "2", content: "Verify the installed WSL tools required for the first wave", status: "pending", priority: "high" },
      ],
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_todo_graph",
      agent: "bio-autopilot",
    })

    expect(result).toContain("[todo-graph]")
    expect(result).toContain("(setup/agent) Install the minimal RNA-seq toolchain in WSL")
    expect(result).toContain("(verify/agent) Verify the installed WSL tools required for the first wave")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("injects compact artifact policy context from consumed checkpoint metadata when runtime state has none", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-checkpoint-${Date.now()}`)
    const checkpointDir = join(testDir, ".opencode", "openagent-labforge", "checkpoints")
    mkdirSync(checkpointDir, { recursive: true })
    writeFileSync(join(checkpointDir, "latest.meta.json"), JSON.stringify({
      consumed_by_session_id: "ses_checkpoint",
      artifact_mode: "package-bundle",
      artifact_root: "output_new/contest_bundle",
      artifact_strategy: "update-existing-first",
      active_work_item: "67/68 promoter figure set",
    }, null, 2), "utf-8")

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_checkpoint",
      agent: "wase",
    })

    expect(result).toContain("[artifact-policy-reload]")
    expect(result).toContain("output_new/contest_bundle")
    expect(result).toContain("Recovered from latest checkpoint metadata")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("builds stage capsule context for internal autonomous continuation", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-capsule-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_capsule",
      activePlan: planPath,
      activeAgent: "bio-autopilot",
      currentStage: "build",
      autoModeLevel: "heavy",
      interactionMode: "continuous",
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_capsule",
      agent: "bio-autopilot",
      promptMode: "capsule",
    })

    expect(result).toContain("[stage-managed-capsule]")
    expect(result).toContain("Mode: heavy + continuous")
    expect(result).toContain("Build rule")
    expect(result).not.toContain("## Engineering Execution Reload")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("builds stage delta context for ordinary internal same-stage continuation", () => {
    const testDir = join(tmpdir(), `stage-managed-prompt-delta-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_delta",
      activePlan: planPath,
      activeAgent: "wase",
      currentStage: "build",
      autoModeLevel: "light",
      interactionMode: "batch",
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_delta",
      agent: "wase",
      promptMode: "delta",
    })

    expect(result).toContain("[stage-managed-delta]")
    expect(result).toContain("wase :: build")
    expect(result).toContain("Keep executing the current checkpoint")
    expect(result).not.toContain("## Engineering Orchestration Reload")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("builds autonomous user update context for real user guidance", () => {
    const result = buildAutonomousUserDirectiveContext({
      agent: "wase",
      promptText: "Please also adjust the current backlog to prioritize the API contract work.",
      guidanceMode: "postcommit-guidance",
      promptChanged: true,
      approvedBatchCarryover: true,
    })

    expect(result).toContain("[autonomous-user-update]")
    expect(result).toContain("update, drop, or reorder stale todo items immediately")
    expect(result).toContain("treat any still-pending todo items from that batch as stale")
  })

  test("builds precommit revision context for fast autonomous corrections", () => {
    const result = buildAutonomousUserDirectiveContext({
      agent: "bio-autopilot",
      promptText: "Actually, only continue with the DEG branch.",
      guidanceMode: "precommit-revision",
      promptChanged: true,
      likelyUndoFailed: true,
    })

    expect(result).toContain("before a stable execution wave was committed")
    expect(result).toContain("delayed corrective override")
  })

  test("skips autonomous user update context for the first autonomous prompt", () => {
    const result = buildAutonomousUserDirectiveContext({
      agent: "wase",
      promptText: "Start the task.",
      guidanceMode: "initial",
      promptChanged: true,
    })

    expect(result).toBeNull()
  })

  test("does not build autonomous user update context for command templates", () => {
    const result = buildAutonomousUserDirectiveContext({
      agent: "wase",
      promptText: "<command-instruction>\n# Command\n</command-instruction>\n<user-request>x</user-request>",
      guidanceMode: "postcommit-guidance",
      promptChanged: true,
    })

    expect(result).toBeNull()
  })

  test("builds fresh repo bootstrap context for autonomous engineering sessions", () => {
    const result = buildFreshRepoBootstrapContext({
      agent: "wase",
      promptText: "Help me build this project from scratch.",
      detectionReason: "Fresh repository heuristic matched.",
    })

    expect(result).toContain("[fresh-repo-bootstrap]")
    expect(result).toContain("ask exactly ONE setup question with the `question` tool")
    expect(result).toContain("allow multi-select")
    expect(result).toContain("product app / workspace repo")
    expect(result).toContain("bootstrap-first scaffold")
    expect(result).toContain("让 AI 自行设计工程姿态")
    expect(result).toContain("custom project posture")
  })

  test("skips fresh repo bootstrap context when the user already specified the engineering system", () => {
    const result = buildFreshRepoBootstrapContext({
      agent: "wase",
      promptText: "Create a Flutter dashboard app in this repo.",
      detectionReason: "Fresh repository heuristic matched.",
    })

    expect(result).toBeNull()
  })

  test("builds bio-specific fresh repo bootstrap choices for bio autonomous sessions", () => {
    const result = buildFreshRepoBootstrapContext({
      agent: "bio-autopilot",
      promptText: "Help me organize this new bio repo.",
      detectionReason: "Fresh repository heuristic matched.",
    })

    expect(result).toContain("bio dry-lab pipeline workspace")
    expect(result).toContain("mainline material pack")
    expect(result).toContain("bootstrap-first bio scaffold")
  })

  test("explains the AI-designed bootstrap scale in fresh repo bootstrap context", () => {
    const result = buildFreshRepoBootstrapContext({
      agent: "wase",
      promptText: "Help me set up this repo.",
      detectionReason: "Fresh repository heuristic matched.",
    })

    expect(result).toContain("repo main type / 仓库主类型")
    expect(result).toContain("default question policy / 默认提问策略")
  })

  test("injects sticky bootstrap mode context after the user selected a repo posture", () => {
    setSessionBootstrapMode("ses_bootstrap_mode", {
      category: "engineering",
      primary: {
        category: "engineering",
        key: "backend-service-tooling",
        labelZh: "后端 / 服务 / 工具链仓",
        labelEn: "backend / service / tooling repo",
        summaryZh: "按服务端工程体系起步，优先模块边界、配置、运行链路、验证和运维可观测性。",
        summaryEn: "Treat the repo as backend/service/tooling and prioritize module boundaries, config, runtime paths, verification, and observability.",
      },
      secondary: [],
    })

    const result = buildStageManagedPromptContext({
      directory: process.cwd(),
      sessionID: "ses_bootstrap_mode",
      agent: "wase",
    })

    expect(result).toContain("[bootstrap-mode]")
    expect(result).toContain("后端 / 服务 / 工具链仓")
    expect(result).toContain("Do not re-ask the bootstrap question every turn")
  })

  test("injects sticky bootstrap mode context from repo-local bootstrap storage when session memory is empty", () => {
    const testDir = join(tmpdir(), `stage-managed-bootstrap-storage-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    writeRepoBootstrapSelection({
      directory: testDir,
      sessionId: "ses_bootstrap_storage",
      selection: {
        category: "engineering",
        primary: {
          category: "engineering",
          key: "bootstrap-first-scaffold",
          labelZh: "工程骨架优先（推荐）",
          labelEn: "bootstrap-first scaffold",
          summaryZh: "先搭工程骨架。",
          summaryEn: "Bootstrap the repo first.",
        },
        secondary: [],
      },
    })

    const result = buildStageManagedPromptContext({
      directory: testDir,
      sessionID: "ses_bootstrap_storage",
      agent: "wase",
    })

    expect(result).toContain("[bootstrap-mode]")
    expect(result).toContain("工程骨架优先（推荐）")

    rmSync(testDir, { recursive: true, force: true })
  })
})
