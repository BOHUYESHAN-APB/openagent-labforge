import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  createBoulderState,
  ensureRuntimeWorkflowSession,
  getLatestCheckpointMetadataPath,
  reconcileRuntimeWorkflowTodoGraph,
  writeBoulderState,
} from "../../features/boulder-state"
import { createRecallTool, executeRecallOperation } from "./tools"

describe("recall tool", () => {
  test("reads runtime workflow state, session origin, and structured todos", async () => {
    const testDir = join(tmpdir(), `recall-tool-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    const checkpointDir = join(testDir, ".opencode", "openagent-labforge", "checkpoints")
    mkdirSync(planDir, { recursive: true })
    mkdirSync(checkpointDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")
    writeBoulderState(testDir, createBoulderState(planPath, "ses_recall", "bio-autopilot", testDir))
    writeFileSync(getLatestCheckpointMetadataPath(testDir), JSON.stringify({
      source_session_id: "ses_parent",
      consumed_by_session_id: "ses_recall",
      checkpoint_kind: "heavy",
      checkpoint_scope: "cross-session",
      source_stage: "review",
    }, null, 2))

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_recall",
      activePlan: planPath,
      activeAgent: "bio-autopilot",
      currentStage: "build",
    })
    reconcileRuntimeWorkflowTodoGraph({
      directory: testDir,
      sessionId: "ses_recall",
      todos: [
        {
          id: "1",
          content: "Install the minimal RNA-seq toolchain in WSL",
          status: "in_progress",
          priority: "high",
        },
      ],
    })

    const result = await executeRecallOperation({
      directory: testDir,
      sessionID: "ses_recall",
    })

    expect(result).toContain("# Recall")
    expect(result).toContain("## State")
    expect(result).toContain("## Session Origin")
    expect(result).toContain("Active-plan session origin: `direct`")
    expect(result).toContain("Checkpoint source session: `ses_parent`")
    expect(result).toContain("## Structured Todos")
    expect(result).toContain("(setup/agent/model) Install the minimal RNA-seq toolchain in WSL")

    rmSync(testDir, { recursive: true, force: true })
  })

  test("tool execute reads current session by default", async () => {
    const testDir = join(tmpdir(), `recall-tool-exec-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_current",
      activePlan: planPath,
      currentStage: "review",
    })

    const tool = createRecallTool({ directory: testDir } as never)
    const result = await tool.execute({}, {
      sessionID: "ses_current",
      directory: testDir,
    } as never)

    expect(result).toContain("Session: `ses_current`")
    expect(result).toContain("Stage: `review`")

    rmSync(testDir, { recursive: true, force: true })
  })
})
