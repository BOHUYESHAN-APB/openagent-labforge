import { beforeEach, describe, expect, test } from "bun:test"
import { createInteractiveBashSessionHook } from "./hook"
import { subagentSessions } from "../../features/claude-code-session-state"

describe("interactive-bash-session hook", () => {
  beforeEach(() => {
    subagentSessions.clear()
  })

  test("#given deleted session #when handling event #then does not abort global subagent sessions", async () => {
    const abortCalls: string[] = []
    const hook = createInteractiveBashSessionHook({
      client: {
        session: {
          abort: async ({ path }: { path: { id: string } }) => {
            abortCalls.push(path.id)
            return {}
          },
        },
      },
      directory: process.cwd(),
    } as any)

    subagentSessions.add("subagent-A")
    subagentSessions.add("subagent-B")

    await hook.event({
      event: {
        type: "session.deleted",
        properties: { info: { id: "main-session-1" } },
      },
    })

    expect(abortCalls).toEqual([])
  })
})
