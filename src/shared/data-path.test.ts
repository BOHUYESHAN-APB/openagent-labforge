import { afterEach, describe, expect, it, mock } from "bun:test"

describe("data-path writable fallback", () => {
  const originalXdgDataHome = process.env.XDG_DATA_HOME
  const originalXdgCacheHome = process.env.XDG_CACHE_HOME

  afterEach(() => {
    process.env.XDG_DATA_HOME = originalXdgDataHome
    process.env.XDG_CACHE_HOME = originalXdgCacheHome
    mock.restore()
  })

  it("falls back to tmpdir when data dir is not writable", async () => {
    process.env.XDG_DATA_HOME = "Z:/not-writable"

    const fs = await import("node:fs")
    mock.module("node:fs", () => ({
      ...fs,
      mkdirSync: () => {
        throw new Error("no write")
      },
      accessSync: () => {
        throw new Error("no write")
      },
    }))

    const os = await import("node:os")
    const { getDataDir } = await import("./data-path")
    expect(getDataDir()).toBe(os.tmpdir())
  })

  it("falls back to tmpdir when cache dir is not writable", async () => {
    process.env.XDG_CACHE_HOME = "Z:/not-writable-cache"

    const fs = await import("node:fs")
    mock.module("node:fs", () => ({
      ...fs,
      mkdirSync: () => {
        throw new Error("no write")
      },
      accessSync: () => {
        throw new Error("no write")
      },
    }))

    const os = await import("node:os")
    const { getCacheDir } = await import("./data-path")
    expect(getCacheDir()).toBe(os.tmpdir())
  })
})
