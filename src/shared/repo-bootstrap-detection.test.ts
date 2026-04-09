import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { detectFreshRepositoryBootstrap } from "./repo-bootstrap-detection"

describe("detectFreshRepositoryBootstrap", () => {
  test("detects a near-empty initialized repo as fresh", () => {
    const root = join(tmpdir(), `fresh-repo-${Date.now()}`)
    mkdirSync(join(root, ".git"), { recursive: true })
    writeFileSync(join(root, "README.md"), "# Demo\n", "utf-8")
    writeFileSync(join(root, ".gitignore"), "node_modules/\n", "utf-8")

    const result = detectFreshRepositoryBootstrap(root)

    expect(result.isFresh).toBe(false)
    expect(result.reason).toContain("no git history")

    rmSync(root, { recursive: true, force: true })
  })

  test("does not treat a structured repo as fresh", () => {
    const root = join(tmpdir(), `structured-repo-${Date.now()}`)
    mkdirSync(join(root, ".git"), { recursive: true })
    mkdirSync(join(root, "src"), { recursive: true })
    writeFileSync(join(root, "src", "main.ts"), "export const x = 1\n", "utf-8")

    const result = detectFreshRepositoryBootstrap(root)

    expect(result.isFresh).toBe(false)

    rmSync(root, { recursive: true, force: true })
  })

  test("detects a git-backed unborn repo as fresh", async () => {
    const root = join(tmpdir(), `git-fresh-repo-${Date.now()}`)
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, "README.md"), "# Demo\n", "utf-8")

    // Initialize a real unborn git repo.
    await Bun.$`git init ${root}`.quiet()

    const result = detectFreshRepositoryBootstrap(root)

    expect(result.hasGit).toBe(true)
    expect(result.isUnbornHead).toBe(true)
    expect(result.isFresh).toBe(true)
    expect(result.reason).toContain("Fresh git-backed repository matched")

    rmSync(root, { recursive: true, force: true })
  })
})
