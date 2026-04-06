import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"

import {
  cleanupStaleRuntimeWorkflowSessions,
  cleanupWorkflowCaches,
  appendDocumentWorkspaceRevision,
  appendDocumentWorkspaceOutput,
  ensureDocumentWorkspace,
  ensureDocumentWorkspaceGitRepo,
  ensurePaperCache,
  ensureRuntimeWorkflowSession,
  getRuntimeRootDir,
  getDocumentWorkspacePaths,
  getPaperCachePaths,
  readDocumentWorkspaceManifest,
  readPaperCacheManifest,
  upsertDocumentWorkspaceAsset,
  upsertPaperCacheEntry,
} from "./runtime-workflow"

describe("document workspace and paper cache", () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `doc-workspace-test-${randomUUID()}`)
    mkdirSync(join(testDir, ".git", "info"), { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  test("creates a document workspace under the unified .opencode root", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-doc-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = ensureDocumentWorkspace({
      directory: testDir,
      sessionId: "session-doc-1",
      documentId: "business-plan-v1",
    })

    expect(paths.rootDir).toContain(".opencode")
    expect(paths.rootDir).toContain("openagent-labforge")
    expect(existsSync(paths.sourceDir)).toBe(true)
    expect(existsSync(paths.sectionsDir)).toBe(true)
    expect(existsSync(paths.diagramsDir)).toBe(true)
    expect(existsSync(paths.figuresDir)).toBe(true)
    expect(existsSync(paths.assetsDir)).toBe(true)
    expect(existsSync(paths.renderedDir)).toBe(true)
    expect(existsSync(paths.outputDir)).toBe(true)
    expect(existsSync(paths.manifestFile)).toBe(true)
    expect(readFileSync(join(paths.sourceDir, "main.md"), "utf-8")).toContain("# business-plan-v1")
    expect(existsSync(join(paths.rootDir, ".git"))).toBe(true)
  })

  test("creates a paper cache under the unified .opencode root", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-paper-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = ensurePaperCache({
      directory: testDir,
      sessionId: "session-paper-1",
    })

    expect(paths.rootDir).toContain(".opencode")
    expect(existsSync(paths.pdfDir)).toBe(true)
    expect(existsSync(paths.markdownDir)).toBe(true)
    expect(existsSync(paths.notesDir)).toBe(true)
    expect(existsSync(paths.citationsDir)).toBe(true)
    expect(existsSync(paths.manifestFile)).toBe(true)
  })

  test("document and paper path helpers are stable for repeated calls", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-repeat-1",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const docA = getDocumentWorkspacePaths(testDir, "session-repeat-1", "proposal-a")
    const docB = getDocumentWorkspacePaths(testDir, "session-repeat-1", "proposal-a")
    const paperA = getPaperCachePaths(testDir, "session-repeat-1")
    const paperB = getPaperCachePaths(testDir, "session-repeat-1")

    expect(docA.rootDir).toBe(docB.rootDir)
    expect(paperA.rootDir).toBe(paperB.rootDir)
  })

  test("can append document workspace revisions and read manifest", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-doc-2",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = ensureDocumentWorkspace({
      directory: testDir,
      sessionId: "session-doc-2",
      documentId: "roadmap",
      title: "Roadmap",
      documentType: "proposal",
      initializeGit: false,
    })

    const nextManifest = appendDocumentWorkspaceRevision({
      paths,
      summary: "Drafted first roadmap revision.",
      metadata: { phase: 1 },
    })

    const manifest = readDocumentWorkspaceManifest(paths)
    expect(nextManifest?.revisions).toHaveLength(1)
    expect(manifest?.title).toBe("Roadmap")
    expect(manifest?.document_type).toBe("proposal")
    expect(manifest?.revisions[0]?.summary).toBe("Drafted first roadmap revision.")
  })

  test("can upsert document assets and append outputs", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-doc-4",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = ensureDocumentWorkspace({
      directory: testDir,
      sessionId: "session-doc-4",
      documentId: "whitepaper",
      initializeGit: false,
    })

    upsertDocumentWorkspaceAsset({
      paths,
      asset: {
        asset_id: "fig-1",
        source_path: join(paths.assetsDir, "fig-1.svg"),
        rendered_path: join(paths.figuresDir, "fig-1.png"),
        caption: "Workflow overview",
        placement: "section:introduction",
        asset_type: "svg",
      },
    })
    appendDocumentWorkspaceOutput({
      paths,
      output: {
        output_id: "out-1",
        format: "docx",
        path: join(paths.outputDir, "whitepaper.docx"),
        stage: "draft",
      },
    })

    const manifest = readDocumentWorkspaceManifest(paths)
    expect(manifest?.assets).toHaveLength(1)
    expect(manifest?.assets[0]?.asset_id).toBe("fig-1")
    expect(manifest?.outputs).toHaveLength(1)
    expect(manifest?.outputs[0]?.format).toBe("docx")
  })

  test("can initialize document workspace git repo explicitly", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-doc-3",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = getDocumentWorkspacePaths(testDir, "session-doc-3", "whitepaper")
    mkdirSync(paths.rootDir, { recursive: true })

    const ok = ensureDocumentWorkspaceGitRepo(paths.rootDir)
    expect(ok).toBe(true)
    expect(existsSync(join(paths.rootDir, ".git"))).toBe(true)
  })

  test("paper cache manifest supports upsert", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-paper-2",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const paths = ensurePaperCache({
      directory: testDir,
      sessionId: "session-paper-2",
    })

    const first = upsertPaperCacheEntry({
      paths,
      entry: {
        paper_id: "paper-1",
        title: "A Published Paper",
        publication_status: "published",
        year: 2024,
        weight: "high",
        pdf_path: join(paths.pdfDir, "paper-1.pdf"),
      },
    })
    const second = upsertPaperCacheEntry({
      paths,
      entry: {
        paper_id: "paper-1",
        title: "A Published Paper",
        publication_status: "published",
        year: 2024,
        weight: "high",
        markdown_path: join(paths.markdownDir, "paper-1.md"),
      },
    })

    const manifest = readPaperCacheManifest(paths)
    expect(first.entries).toHaveLength(1)
    expect(second.entries).toHaveLength(1)
    expect(manifest?.entries[0]?.pdf_path).toContain("paper-1.pdf")
    expect(manifest?.entries[0]?.markdown_path).toContain("paper-1.md")
  })

  test("can clean up stale runtime workflow sessions", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "stale-session",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "fresh-session",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })

    const staleStatePath = join(getRuntimeRootDir(testDir), "stale-session", "state.json")
    const staleState = JSON.parse(readFileSync(staleStatePath, "utf-8"))
    staleState.updated_at = "2000-01-01T00:00:00.000Z"
    writeFileSync(staleStatePath, JSON.stringify(staleState, null, 2), "utf-8")

    const result = cleanupStaleRuntimeWorkflowSessions({
      directory: testDir,
      now: Date.parse("2026-04-06T00:00:00.000Z"),
    })

    expect(result.removedSessionIds).toContain("stale-session")
    expect(result.keptSessionIds).toContain("fresh-session")
    expect(existsSync(join(getRuntimeRootDir(testDir), "stale-session"))).toBe(false)
  })

  test("cleanup trims document output history without deleting source workspace", () => {
    ensureRuntimeWorkflowSession({
      directory: testDir,
      sessionId: "session-doc-5",
      activePlan: "/repo/.opencode/openagent-labforge/plans/test.md",
    })
    const paths = ensureDocumentWorkspace({
      directory: testDir,
      sessionId: "session-doc-5",
      documentId: "multi-output-doc",
      initializeGit: false,
    })

    for (let index = 0; index < 5; index++) {
      appendDocumentWorkspaceOutput({
        paths,
        output: {
          output_id: `out-${index}`,
          format: "pdf",
          path: join(paths.outputDir, `doc-${index}.pdf`),
        },
      })
    }

    const cleanup = cleanupWorkflowCaches({
      directory: testDir,
      maxDocumentOutputs: 2,
    })
    const manifest = readDocumentWorkspaceManifest(paths)

    expect(cleanup.trimmedDocumentOutputs).toContain("multi-output-doc")
    expect(manifest?.outputs).toHaveLength(2)
    expect(existsSync(paths.sourceDir)).toBe(true)
  })
})
