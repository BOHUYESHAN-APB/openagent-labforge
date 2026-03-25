import { describe, expect, test } from "bun:test"

import { transformMcpServer } from "./transformer"

describe("transformMcpServer", () => {
  test("normalizes Windows npx stdio servers and preserves timeout", () => {
    const originalPlatform = process.platform

    Object.defineProperty(process, "platform", {
      value: "win32",
      configurable: true,
    })

    try {
      const result = transformMcpServer("open_websearch_mcp", {
        command: "npx",
    args: ["-y", "open-websearch@2.0.0"],
        timeout: 30000,
        type: "stdio",
      })

      expect(result).toEqual({
        type: "local",
      command: ["cmd", "/c", "npx", "-y", "open-websearch@2.0.0"],
        enabled: true,
        timeout: 30000,
      })
    } finally {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      })
    }
  })

  test("maps env to environment for stdio servers", () => {
    const result = transformMcpServer("search", {
      command: "uvx",
      args: ["paper-search-mcp"],
      env: {
        SEARCH_MODE: "auto",
      },
      type: "stdio",
    })

    expect(result).toEqual({
      type: "local",
      command: ["uvx", "paper-search-mcp"],
      enabled: true,
      environment: {
        SEARCH_MODE: "auto",
      },
    })
  })

  test("preserves timeout for remote servers", () => {
    const result = transformMcpServer("remote-search", {
      type: "http",
      url: "https://example.com/mcp",
      timeout: 15000,
    })

    expect(result).toEqual({
      type: "remote",
      url: "https://example.com/mcp",
      enabled: true,
      timeout: 15000,
    })
  })
})
