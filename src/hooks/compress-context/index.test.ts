import { describe, expect, test, mock } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { OhMyOpenCodeConfig } from "../../config"
import { COMPRESS_CONTEXT_TEMPLATE } from "../../features/builtin-commands/templates/compress-context"
import { createCompressContextHook } from "./index"

function buildCommandPrompt(args: string): string {
  return `<command-instruction>
${COMPRESS_CONTEXT_TEMPLATE}
</command-instruction>

<session-context>
Session ID: ses_test
Timestamp: 2026-04-16T00:00:00.000Z
</session-context>

<user-request>
${args}
</user-request>`
}

function createCtx(directory: string) {
  return {
    directory,
    client: {
      session: {
        summarize: mock(() => Promise.resolve({})),
      },
    },
  } as any
}

describe("compress-context hook", () => {
  test("status mode reports current files without requesting native summarize", async () => {
    const directory = mkdtempSync(join(tmpdir(), "compress-status-"))
    const sessionID = "ses_status"
    const runtimeDir = join(directory, ".opencode", "openagent-labforge", "runtime", sessionID)
    mkdirSync(runtimeDir, { recursive: true })
    writeFileSync(join(runtimeDir, "context-pressure.json"), JSON.stringify({
      carried_tokens: 320000,
      cache_read_tokens: 300000,
      context_limit: 1000000,
      usage_ratio: 0.32,
      level: 2,
      removed_tokens: 200000,
      removed_messages: 10,
      compacted_tool_outputs: 20,
      updated_at: new Date().toISOString(),
    }), "utf-8")

    const ctx = createCtx(directory)
    const hook = createCompressContextHook(ctx, {} as OhMyOpenCodeConfig)
    const output = {
      parts: [{ type: "text", text: buildCommandPrompt("status") }],
    }

    await hook["chat.message"](
      { sessionID, agent: "bio-autopilot", model: { providerID: "openai", modelID: "gpt-5.4" } },
      output,
    )

    expect(ctx.client.session.summarize).not.toHaveBeenCalled()
    expect(String(output.parts[0].text)).toContain("Compression command already executed by the plugin runtime")
    expect(String(output.parts[0].text)).toContain("Requested mode: status")
    expect(String(output.parts[0].text)).toContain("Applied mode: status")

    rmSync(directory, { recursive: true, force: true })
  })

  test("l1 mode requests native summarize and refreshes runtime files", async () => {
    const directory = mkdtempSync(join(tmpdir(), "compress-l1-"))
    const sessionID = "ses_l1"
    const ctx = createCtx(directory)
    const hook = createCompressContextHook(ctx, {} as OhMyOpenCodeConfig)
    const output = {
      parts: [{ type: "text", text: buildCommandPrompt("l1") }],
    }

    await hook["chat.message"](
      { sessionID, agent: "wase", model: { providerID: "openai", modelID: "gpt-5.4" } },
      output,
    )

    expect(ctx.client.session.summarize).toHaveBeenCalledTimes(1)
    expect(String(output.parts[0].text)).toContain("Requested mode: l1")
    expect(String(output.parts[0].text)).toContain("Applied mode: l1")
    expect(String(output.parts[0].text)).toContain("Native summarize: requested")
    expect(existsSync(join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-capsule.md"))).toBe(true)
    expect(existsSync(join(directory, ".opencode", "openagent-labforge", "runtime", sessionID, "context-pressure.json"))).toBe(true)

    rmSync(directory, { recursive: true, force: true })
  })
})
