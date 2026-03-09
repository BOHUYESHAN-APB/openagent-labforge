import { describe, expect, test } from "bun:test"

import { reorderAgentsByPriority } from "./agent-priority-order"
import { setAgentDisplayLanguage } from "../shared/agent-display-names"

describe("reorderAgentsByPriority", () => {
  test("should prioritize core agents in English", () => {
    //#given
    setAgentDisplayLanguage("en")
    const input = {
      build: { description: "Build" },
      "Hephaestus (Deep Agent)": { description: "Hephaestus" },
      "Sisyphus (Ultraworker)": { description: "Sisyphus" },
      "Atlas (Plan Executor)": { description: "Atlas" },
      "Prometheus (Plan Builder)": { description: "Prometheus" },
    }

    //#when
    const ordered = reorderAgentsByPriority(input)

    //#then
    expect(Object.keys(ordered)).toEqual([
      "Sisyphus (Ultraworker)",
      "Hephaestus (Deep Agent)",
      "Prometheus (Plan Builder)",
      "Atlas (Plan Executor)",
      "build",
    ])
  })

  test("should prioritize core agents in Chinese after language switch", () => {
    //#given
    setAgentDisplayLanguage("zh")
    const input = {
      build: { description: "Build" },
      "代码工匠 (深度)": { description: "Hephaestus" },
      "总调度器 (超脑)": { description: "Sisyphus" },
      "执行官 (计划执行)": { description: "Atlas" },
      "规划师 (计划构建)": { description: "Prometheus" },
    }

    //#when
    const ordered = reorderAgentsByPriority(input)

    //#then
    expect(Object.keys(ordered)).toEqual([
      "总调度器 (超脑)",
      "代码工匠 (深度)",
      "规划师 (计划构建)",
      "执行官 (计划执行)",
      "build",
    ])

    setAgentDisplayLanguage("en")
  })
})
