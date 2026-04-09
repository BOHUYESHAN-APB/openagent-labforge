import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  getRepoBootstrapSelectionPath,
  readRepoBootstrapSelection,
  writeRepoBootstrapSelection,
} from "./bootstrap-mode-storage"

describe("bootstrap-mode-storage", () => {
  test("writes and reads repo bootstrap selection under the unified .opencode root", () => {
    const root = join(tmpdir(), `bootstrap-storage-${Date.now()}`)
    mkdirSync(root, { recursive: true })

    const record = writeRepoBootstrapSelection({
      directory: root,
      sessionId: "ses_bootstrap_storage",
      selection: {
        category: "bio",
        primary: {
          category: "bio",
          key: "mainline-material-pack",
          labelZh: "综合主线材料包（推荐）",
          labelEn: "mainline material pack",
          summaryZh: "按主线材料包推进。",
          summaryEn: "Use a mainline material pack.",
        },
        secondary: [
          {
            category: "bio",
            key: "bio-figure-assets",
            labelZh: "图件 / 投稿资产仓",
            labelEn: "bio figure / submission-asset workspace",
            summaryZh: "补图件与投稿资产。",
            summaryEn: "Add figure and submission assets.",
          },
        ],
      },
    })

    const path = getRepoBootstrapSelectionPath(root)
    const readBack = readRepoBootstrapSelection(root)

    expect(path).toContain(".opencode")
    expect(record?.primary.key).toBe("mainline-material-pack")
    expect(readBack?.secondary[0]?.key).toBe("bio-figure-assets")

    rmSync(root, { recursive: true, force: true })
  })
})
