import { describe, test, expect, mock } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import type { BackgroundManager } from "../../features/background-agent"
import { createCallOmoAgent } from "./tools"

describe("createCallOmoAgent", () => {
  const mockCtx = {
    client: {
      app: {
        agents: async () => ({
          data: [
            { name: "explore", mode: "subagent" },
            { name: "librarian", mode: "subagent" },
          ],
        }),
      },
    },
    directory: "/test",
  } as unknown as PluginInput

  const mockBackgroundManager = {
    launch: mock(() => Promise.resolve({
      id: "test-task-id",
      sessionID: "test-session-id",
      description: "Test task",
      agent: "test-agent",
      status: "pending",
    })),
    getTask: mock(() => ({
      id: "test-task-id",
      sessionID: "test-session-id",
      description: "Test task",
      agent: "test-agent",
      status: "pending",
    })),
  } as unknown as BackgroundManager

  test("should reject agent in disabled_agents list", async () => {
    //#given
    const toolDef = createCallOmoAgent(mockCtx, mockBackgroundManager, ["explore"], { directory: "/test" })
    const executeFunc = toolDef.execute as Function

    //#when
    const result = await executeFunc(
      {
        description: "Test",
        prompt: "Test prompt",
        subagent_type: "explore",
        run_in_background: true,
      },
      { sessionID: "test", messageID: "msg", agent: "test", abort: new AbortController().signal }
    )

    //#then
    expect(result).toContain("disabled via disabled_agents")
  })

  test("should reject agent in disabled_agents list with case-insensitive matching", async () => {
    //#given
    const toolDef = createCallOmoAgent(mockCtx, mockBackgroundManager, ["Explore"], { directory: "/test" })
    const executeFunc = toolDef.execute as Function

    //#when
    const result = await executeFunc(
      {
        description: "Test",
        prompt: "Test prompt",
        subagent_type: "explore",
        run_in_background: true,
      },
      { sessionID: "test", messageID: "msg", agent: "test", abort: new AbortController().signal }
    )

    //#then
    expect(result).toContain("disabled via disabled_agents")
  })

  test("should allow agent not in disabled_agents list", async () => {
    //#given
    const toolDef = createCallOmoAgent(mockCtx, mockBackgroundManager, ["librarian"], { directory: "/test" })
    const executeFunc = toolDef.execute as Function

    //#when
    const result = await executeFunc(
      {
        description: "Test",
        prompt: "Test prompt",
        subagent_type: "explore",
        run_in_background: true,
      },
      { sessionID: "test", messageID: "msg", agent: "test", abort: new AbortController().signal }
    )

    //#then
    // Disabled-agent gate should pass and the compatibility wrapper should be able to launch through delegate-task.
    expect(result).not.toContain("disabled via disabled_agents")
    expect(result).toContain("Background task launched")
  })

  test("should allow all agents when disabled_agents is empty", async () => {
    //#given
    const toolDef = createCallOmoAgent(mockCtx, mockBackgroundManager, [], { directory: "/test" })
    const executeFunc = toolDef.execute as Function

    //#when
    const result = await executeFunc(
      {
        description: "Test",
        prompt: "Test prompt",
        subagent_type: "explore",
        run_in_background: true,
      },
      { sessionID: "test", messageID: "msg", agent: "test", abort: new AbortController().signal }
    )

    //#then
    expect(result).not.toContain("disabled via disabled_agents")
    expect(result).toContain("Background task launched")
  })
})
