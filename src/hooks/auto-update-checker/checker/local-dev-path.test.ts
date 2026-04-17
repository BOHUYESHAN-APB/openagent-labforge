import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { pathToFileURL } from "node:url"
import { getLocalDevPath, isLocalDevMode } from "./local-dev-path"

describe("local-dev-path", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omo-local-dev-"))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test("detects local dev mode from file:// dist entry even when the path does not include package name", () => {
    const pluginRoot = path.join(tempDir, "workspace", "plugin-copy")
    const distDir = path.join(pluginRoot, "dist")
    const projectConfigDir = path.join(tempDir, "project", ".opencode")
    fs.mkdirSync(distDir, { recursive: true })
    fs.mkdirSync(projectConfigDir, { recursive: true })

    fs.writeFileSync(
      path.join(pluginRoot, "package.json"),
      JSON.stringify({
        name: "@bohuyeshan/openagent-labforge-core",
        version: "3.13.4",
      }, null, 2),
      "utf-8",
    )
    fs.writeFileSync(path.join(distDir, "index.js"), "export default {}", "utf-8")

    const fileEntry = pathToFileURL(path.join(distDir, "index.js")).href
    fs.writeFileSync(
      path.join(projectConfigDir, "opencode.json"),
      JSON.stringify({ plugin: [fileEntry] }, null, 2),
      "utf-8",
    )

    expect(getLocalDevPath(path.join(tempDir, "project"))).toBe(path.join(distDir, "index.js"))
    expect(isLocalDevMode(path.join(tempDir, "project"))).toBe(true)
  })
})
