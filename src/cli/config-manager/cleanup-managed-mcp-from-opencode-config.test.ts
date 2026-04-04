import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { cleanupManagedMcpFromOpenCodeConfig } from "./cleanup-managed-mcp-from-opencode-config"
import { initConfigContext, resetConfigContext } from "./config-context"

describe("cleanupManagedMcpFromOpenCodeConfig", () => {
  let tempDir: string
  let originalEnv: string | undefined

  beforeEach(() => {
    tempDir = join(tmpdir(), `omo-cleanup-managed-mcp-${Date.now()}`)
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

  test("removes managed plugin MCPs but preserves user custom MCPs", () => {
    const configPath = join(tempDir, "opencode.json")
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          mcp: {
            context7: { type: "remote", url: "https://mcp.context7.com/mcp" },
            grep_app: { type: "remote", url: "https://mcp.grep.app" },
            custom_docs: { type: "remote", url: "https://example.com/mcp" },
          },
        },
        null,
        2,
      ),
    )

    const result = cleanupManagedMcpFromOpenCodeConfig()

    expect(result.success).toBe(true)
    const next = JSON.parse(readFileSync(configPath, "utf-8")) as {
      mcp?: Record<string, unknown>
    }
    expect(Object.keys(next.mcp ?? {})).toEqual(["custom_docs"])
  })
})
