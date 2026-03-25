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

  test("should keep research and bio agents in explicit stable order", () => {
    //#given
    setAgentDisplayLanguage("zh")
    const input = {
      "生信执行官": { description: "Bio Pipeline" },
      "前沿技术侦察官": { description: "Tech Scout" },
      "总调度器 (超脑)": { description: "Sisyphus" },
      "GitHub 侦察官": { description: "GitHub Scout" },
      "代码工匠 (深度)": { description: "Hephaestus" },
      "资料官": { description: "Librarian" },
      "生信方法官": { description: "Bio Methodologist" },
      "科研写作官": { description: "Scientific Writer" },
      build: { description: "Build" },
      plan: { description: "Plan" },
    }

    //#when
    const ordered = reorderAgentsByPriority(input)

    //#then
    expect(Object.keys(ordered)).toEqual([
      "总调度器 (超脑)",
      "代码工匠 (深度)",
      "资料官",
      "GitHub 侦察官",
      "前沿技术侦察官",
      "生信方法官",
      "生信执行官",
      "科研写作官",
      "build",
      "plan",
    ])

    setAgentDisplayLanguage("en")
  })
})
