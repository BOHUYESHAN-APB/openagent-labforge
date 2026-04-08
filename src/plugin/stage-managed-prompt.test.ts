import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { ensureRuntimeWorkflowSession } from "../features/boulder-state"
import {
  buildAutonomousUserDirectiveContext,
  buildStageManagedPromptContext,
} from "./stage-managed-prompt"

describe("buildStageManagedPromptContext", () => {
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

    rmSync(testDir, { recursive: true, force: true })
  })

  test("builds autonomous user update context for real user guidance", () => {
    const result = buildAutonomousUserDirectiveContext({
      agent: "wase",
      promptText: "Please also adjust the current backlog to prioritize the API contract work.",
      guidanceMode: "postcommit-guidance",
      promptChanged: true,
    })

    expect(result).toContain("[autonomous-user-update]")
    expect(result).toContain("update, drop, or reorder stale todo items immediately")
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
})
