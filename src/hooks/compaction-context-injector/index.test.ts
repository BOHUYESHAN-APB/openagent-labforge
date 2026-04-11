import { afterEach, describe, expect, it, mock } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

mock.module("../../shared/system-directive", () => ({
  createSystemDirective: (type: string) => `[DIRECTIVE:${type}]`,
  SystemDirectiveTypes: {
    TODO_CONTINUATION: "TODO CONTINUATION",
    RALPH_LOOP: "RALPH LOOP",
    BOULDER_CONTINUATION: "BOULDER CONTINUATION",
    DELEGATION_REQUIRED: "DELEGATION REQUIRED",
    SINGLE_TASK_ONLY: "SINGLE TASK ONLY",
    COMPACTION_CONTEXT: "COMPACTION CONTEXT",
    CONTEXT_WINDOW_MONITOR: "CONTEXT WINDOW MONITOR",
    PROMETHEUS_READ_ONLY: "PROMETHEUS READ-ONLY",
  },
}))

import { createCompactionContextInjector } from "./index"
import { TaskHistory } from "../../features/background-agent/task-history"
import { ensureRuntimeWorkflowSession } from "../../features/boulder-state"
import { _resetForTesting } from "../../features/claude-code-session-state"
import { resetCompactionAgentConfigCheckpointForTesting } from "../../shared/compaction-agent-config-checkpoint"

function createMockContext(
  messageResponses: Array<Array<{ info?: Record<string, unknown> }>>,
  promptAsyncMock = mock(async () => ({})),
) {
  let callIndex = 0

  return {
    client: {
      session: {
        messages: mock(async () => {
          const response =
            messageResponses[Math.min(callIndex, messageResponses.length - 1)] ??
            []
          callIndex += 1
          return { data: response }
        }),
        promptAsync: promptAsyncMock,
      },
    },
    directory: "/tmp/test",
  }
}

describe("createCompactionContextInjector", () => {
  afterEach(() => {
    _resetForTesting()
    resetCompactionAgentConfigCheckpointForTesting()
  })

  describe("Agent Verification State preservation", () => {
    it("includes Agent Verification State section in compaction prompt", async () => {
      //#given
      const injector = createCompactionContextInjector()

      //#when
      const prompt = injector()

      //#then
      expect(prompt).toContain("Agent Verification State")
      expect(prompt).toContain("Current Agent")
      expect(prompt).toContain("Verification Progress")
    })

    it("includes reviewer-agent continuity fields", async () => {
      //#given
      const injector = createCompactionContextInjector()

      //#when
      const prompt = injector()

      //#then
      expect(prompt).toContain("Previous Rejections")
      expect(prompt).toContain("Acceptance Status")
      expect(prompt).toContain("reviewer agents")
    })

    it("preserves file verification progress fields", async () => {
      //#given
      const injector = createCompactionContextInjector()

      //#when
      const prompt = injector()

      //#then
      expect(prompt).toContain("Pending Verifications")
      expect(prompt).toContain("Files already verified")
    })
  })

  it("restricts constraints to explicit verbatim statements", async () => {
    //#given
    const injector = createCompactionContextInjector()

    //#when
    const prompt = injector()

    //#then
    expect(prompt).toContain("Explicit Constraints (Verbatim Only)")
    expect(prompt).toContain("Do NOT invent")
    expect(prompt).toContain("Quote constraints verbatim")
  })

  describe("Delegated Agent Sessions", () => {
    it("includes delegated sessions section in compaction prompt", async () => {
      //#given
      const injector = createCompactionContextInjector()

      //#when
      const prompt = injector()

      //#then
      expect(prompt).toContain("Delegated Agent Sessions")
      expect(prompt).toContain("RESUME, DON'T RESTART")
      expect(prompt).toContain("session_id")
    })

    it("injects actual task history when backgroundManager and sessionID provided", async () => {
      //#given
      const mockManager = { taskHistory: new TaskHistory() } as any
      mockManager.taskHistory.record("ses_parent", { id: "t1", sessionID: "ses_child", agent: "explore", description: "Find patterns", status: "completed", category: "quick" })
      const injector = createCompactionContextInjector(mockManager)

      //#when
      const prompt = injector("ses_parent")

      //#then
      expect(prompt).toContain("Active/Recent Delegated Sessions")
      expect(prompt).toContain("**explore**")
      expect(prompt).toContain("[quick]")
      expect(prompt).toContain("`ses_child`")
    })

    it("does not inject task history section when no entries exist", async () => {
      //#given
      const mockManager = { taskHistory: new TaskHistory() } as any
      const injector = createCompactionContextInjector(mockManager)

      //#when
      const prompt = injector("ses_empty")

      //#then
      expect(prompt).not.toContain("Active/Recent Delegated Sessions")
    })

    it("includes runtime workflow anchor context when directory and session runtime memory exist", async () => {
      const testDir = join(tmpdir(), `compaction-anchor-${Date.now()}`)
      const planDir = join(testDir, ".opencode", "openagent-labforge", "plans")
      mkdirSync(planDir, { recursive: true })
      writeFileSync(join(planDir, "plan.md"), "# plan\n- [ ] x\n", "utf-8")

      ensureRuntimeWorkflowSession({
        directory: testDir,
        sessionId: "ses_runtime_anchor",
        activePlan: join(planDir, "plan.md"),
        currentStage: "build",
        activeAgent: "wase",
      })

      const injector = createCompactionContextInjector(undefined, testDir)
      const prompt = injector("ses_runtime_anchor")

      expect(prompt).toContain("Runtime Workflow Anchor")
      expect(prompt).toContain("Stage Capsule")
      expect(prompt).toContain("Anchor epoch")

      rmSync(testDir, { recursive: true, force: true })
    })
  })

  describe("agent checkpoint recovery", () => {
    it("re-injects checkpointed agent config after compaction when latest agent is lost", async () => {
      //#given
      const promptAsyncMock = mock(async () => ({}))
      const ctx = createMockContext(
        [
          [
            {
              info: {
                role: "user",
                agent: "atlas",
                model: { providerID: "openai", modelID: "gpt-5" },
                tools: { bash: "allow" },
              },
            },
          ],
          [
            {
              info: {
                role: "user",
                agent: "compaction",
                model: {
                  providerID: "anthropic",
                  modelID: "claude-opus-4-1",
                },
              },
            },
          ],
        ],
        promptAsyncMock,
      )
      const injector = createCompactionContextInjector(undefined, "/tmp/test")

      //#when
      await injector.capture?.("ses_checkpoint", ctx.client)
      await injector.event?.(
        {
          event: {
            type: "session.compacted",
            properties: { sessionID: "ses_checkpoint" },
          },
        },
        { client: ctx.client },
      )

      //#then
      expect(promptAsyncMock).toHaveBeenCalledWith({
        path: { id: "ses_checkpoint" },
        body: {
          noReply: true,
          agent: "atlas",
          model: { providerID: "openai", modelID: "gpt-5" },
          tools: { bash: true },
          parts: [
            expect.objectContaining({
              type: "text",
              text: expect.stringContaining(
                "restore checkpointed session agent configuration",
              ),
            }),
          ],
        },
        query: { directory: "/tmp/test" },
      })
    })

    it("recovers after five consecutive assistant messages with no text", async () => {
      //#given
      const promptAsyncMock = mock(async () => ({}))
      const ctx = createMockContext(
        [
          [
            {
              info: {
                role: "user",
                agent: "atlas",
                model: { providerID: "openai", modelID: "gpt-5" },
                tools: { bash: "allow" },
              },
            },
          ],
          [
            {
              info: {
                role: "user",
                agent: "atlas",
                model: { providerID: "openai", modelID: "gpt-5" },
                tools: { bash: "allow" },
              },
            },
          ],
          [
            {
              info: {
                role: "user",
                agent: "atlas",
                model: { providerID: "openai", modelID: "gpt-5" },
                tools: { bash: "allow" },
              },
            },
          ],
        ],
        promptAsyncMock,
      )
      const injector = createCompactionContextInjector(undefined, "/tmp/test")

      await injector.capture?.("ses_no_text_tail", ctx.client)
      await injector.event?.(
        {
          event: {
            type: "session.compacted",
            properties: { sessionID: "ses_no_text_tail" },
          },
        },
        { client: ctx.client },
      )

      //#when
      for (let index = 1; index <= 5; index++) {
        await injector.event?.(
          {
            event: {
              type: "message.updated",
              properties: {
                info: {
                  id: `msg_${index}`,
                  role: "assistant",
                  sessionID: "ses_no_text_tail",
                },
              },
            },
          },
          { client: ctx.client },
        )
      }
      await injector.event?.(
        {
          event: {
            type: "session.idle",
            properties: { sessionID: "ses_no_text_tail" },
          },
        },
        { client: ctx.client },
      )

      //#then
      expect(promptAsyncMock).toHaveBeenCalledTimes(1)
      expect(promptAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { id: "ses_no_text_tail" },
          body: expect.objectContaining({
            noReply: true,
            agent: "atlas",
          }),
        }),
      )
    })
  })
})
