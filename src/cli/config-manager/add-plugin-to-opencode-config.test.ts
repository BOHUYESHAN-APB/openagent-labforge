import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import * as pluginNameWithVersion from "./plugin-name-with-version"
import { addPluginToOpenCodeConfig } from "./add-plugin-to-opencode-config"
import { initConfigContext, resetConfigContext } from "./config-context"

describe("addPluginToOpenCodeConfig", () => {
  let tempConfigDir: string

  beforeEach(() => {
    tempConfigDir = join(tmpdir(), `openagent-labforge-plugin-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tempConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = tempConfigDir
    resetConfigContext()
    initConfigContext("opencode", null)
  })

  afterEach(() => {
    delete process.env.OPENCODE_CONFIG_DIR
    resetConfigContext()
    rmSync(tempConfigDir, { recursive: true, force: true })
  })

  test("writes plugin entry into both opencode.json and tui.jsonc when config files do not exist", async () => {
    const pluginEntry = "file:///D:/dev/openagent-labforge"
    const spy = spyOn(pluginNameWithVersion, "getPluginNameWithVersion").mockResolvedValue(pluginEntry)

    try {
      const result = await addPluginToOpenCodeConfig("3.13.4")

      expect(result.success).toBe(true)
      expect(existsSync(join(tempConfigDir, "opencode.json"))).toBe(true)
      expect(existsSync(join(tempConfigDir, "tui.jsonc"))).toBe(true)

      const opencodeConfig = JSON.parse(readFileSync(join(tempConfigDir, "opencode.json"), "utf-8")) as { plugin?: string[] }
      const tuiConfig = JSON.parse(readFileSync(join(tempConfigDir, "tui.jsonc"), "utf-8")) as { plugin?: string[] }

      expect(opencodeConfig.plugin).toEqual([pluginEntry])
      expect(tuiConfig.plugin).toEqual([pluginEntry])
    } finally {
      spy.mockRestore()
    }
  })

  test("updates existing opencode.jsonc and tui.jsonc entries for the same plugin without touching unrelated plugins", async () => {
    const pluginEntry = "@bohuyeshan/openagent-labforge-core"
    const spy = spyOn(pluginNameWithVersion, "getPluginNameWithVersion").mockResolvedValue(pluginEntry)

    writeFileSync(
      join(tempConfigDir, "opencode.jsonc"),
      `{
  "plugin": [
    "file:///D:/old/openagent-labforge/dist/index.js",
    "other-plugin"
  ]
}
`,
      "utf-8",
    )
    writeFileSync(
      join(tempConfigDir, "tui.jsonc"),
      `{
  "plugin": [
    "file:///D:/old/openagent-labforge",
    "other-plugin"
  ]
}
`,
      "utf-8",
    )

    try {
      const result = await addPluginToOpenCodeConfig("3.13.4")

      expect(result.success).toBe(true)
      const opencodeConfig = JSON.parse(readFileSync(join(tempConfigDir, "opencode.jsonc"), "utf-8")) as { plugin?: string[] }
      const tuiConfig = JSON.parse(readFileSync(join(tempConfigDir, "tui.jsonc"), "utf-8")) as { plugin?: string[] }

      expect(opencodeConfig.plugin).toEqual([pluginEntry, "other-plugin"])
      expect(tuiConfig.plugin).toEqual([pluginEntry, "other-plugin"])
    } finally {
      spy.mockRestore()
    }
  })
})
