import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createBoulderState, ensureRuntimeWorkflowSession, writeBoulderState } from "../../features/boulder-state"
import { createBatchTool } from "./tools"

describe("batch tool", () => {
  test("executes multiple recall calls and aggregates results", async () => {
    const testDir = join(tmpdir(), `batch-tool-${Date.now()}`)
    const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
    const planPath = join(planDir, "plan.md")
    mkdirSync(planDir, { recursive: true })
    writeFileSync(planPath, "# Plan\n\n- [ ] Task 1\n", "utf-8")
    writeBoulderState(testDir, createBoulderState(planPath, "ses_batch", "bio-autopilot", testDir))

    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "ses_batch",
      activePlan: planPath,
      currentStage: "build",
    })

    const tool = createBatchTool({ directory: testDir } as never)
    const result = await tool.execute({
      tool_calls: [
        { tool: "recall", parameters: { sections: ["state", "session-origin"] } },
        { tool: "recall", parameters: { sections: ["roadmap"] } },
      ],
    }, {
      sessionID: "ses_batch",
    } as never)

    expect(result).toContain("Batch execution")
    expect(result).toContain("## 1. recall (ok)")
    expect(result).toContain("## 2. recall (ok)")
    expect(result).toContain("## State")
    expect(result).toContain("## Session Origin")
    expect(result).toContain("## Roadmap")

    rmSync(testDir, { recursive: true, force: true })
  })
})
