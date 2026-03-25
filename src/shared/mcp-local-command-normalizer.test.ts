import { describe, expect, test } from "bun:test"

import { normalizeLocalMcpCommand } from "./mcp-local-command-normalizer"

describe("normalizeLocalMcpCommand", () => {
  test("wraps npx commands with cmd on Windows", () => {
    const result = normalizeLocalMcpCommand(["npx", "-y", "bing-cn-mcp"], "win32")

    expect(result).toEqual(["cmd", "/c", "npx", "-y", "bing-cn-mcp"])
  })

  test("leaves uvx commands untouched on Windows", () => {
    const result = normalizeLocalMcpCommand(["uvx", "paper-search-mcp"], "win32")

    expect(result).toEqual(["uvx", "paper-search-mcp"])
  })

  test("leaves npx commands untouched on non-Windows platforms", () => {
    const result = normalizeLocalMcpCommand(["npx", "-y", "bing-cn-mcp"], "linux")

    expect(result).toEqual(["npx", "-y", "bing-cn-mcp"])
  })
})
