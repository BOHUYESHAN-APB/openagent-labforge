import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { cleanupStaleManagedAgentsFromOpenCodeConfig } from "./cleanup-stale-managed-agents"
import { initConfigContext, resetConfigContext } from "./config-context"

describe("cleanupStaleManagedAgentsFromOpenCodeConfig", () => {
  let tempDir: string
  let originalEnv: string | undefined

  beforeEach(() => {
    tempDir = join(tmpdir(), `omo-cleanup-managed-agents-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    originalEnv = process.env.OPENCODE_CONFIG_DIR
    process.env.OPENCODE_CONFIG_DIR = tempDir
    resetConfigContext()
    initConfigContext("opencode", null)
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENCODE_CONFIG_DIR = originalEnv
    } else {
      delete process.env.OPENCODE_CONFIG_DIR
    }

    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    resetConfigContext()
  })

  test("removes managed plugin agents but preserves user custom agents", () => {
    //#given
    const configPath = join(tempDir, "opencode.json")
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          plugin: ["@bohuyeshan/openagent-labforge-core"],
          agent: {
            "总调度器 (超脑)": { model: "github-copilot/claude-opus-4.6" },
            "代码工匠 (深度)": { model: "openai/gpt-5.3-codex" },
            "my-custom-reviewer": { model: "openai/gpt-5.4" },
          },
        },
        null,
        2,
      ),
    )

    //#when
    const result = cleanupStaleManagedAgentsFromOpenCodeConfig()

    //#then
    expect(result.success).toBe(true)
    const next = JSON.parse(readFileSync(configPath, "utf-8")) as {
      agent?: Record<string, unknown>
    }
    expect(next.agent).toBeDefined()
    expect(Object.keys(next.agent ?? {})).toEqual(["my-custom-reviewer"])
  })

  test("removes empty managed agent block and managed default agent", () => {
    const configPath = join(tempDir, "opencode.json")
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          agent: {
            sisyphus: { model: "anthropic/claude-opus-4.5" },
          },
          default_agent: "sisyphus",
        },
        null,
        2,
      ),
    )

    const result = cleanupStaleManagedAgentsFromOpenCodeConfig()

    expect(result.success).toBe(true)
    const next = JSON.parse(readFileSync(configPath, "utf-8")) as {
      agent?: Record<string, unknown>
      default_agent?: string
    }
    expect(next.agent).toBeUndefined()
    expect(next.default_agent).toBeUndefined()
  })
})
