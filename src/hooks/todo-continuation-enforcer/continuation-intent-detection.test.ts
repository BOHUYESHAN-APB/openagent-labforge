import { describe, expect, test } from "bun:test"

import { hasContinuationIntent } from "./continuation-intent-detection"

describe("hasContinuationIntent", () => {
  test("returns false for a completed-wave handoff that only offers future edits on request", () => {
    const result = hasContinuationIntent([
      {
        info: { role: "assistant" },
        parts: [{
          type: "text",
          text: "所以这一轮 reviewed wave 已完成。后续如果你继续想修改，我就直接基于这三个最终文件继续改。",
        }],
      },
    ])

    expect(result).toBe(false)
  })

  test("returns true for explicit autonomous next-round backlog wording", () => {
    const result = hasContinuationIntent([
      {
        info: { role: "assistant" },
        parts: [{
          type: "text",
          text: "还剩下最值得继续打磨的两个点：\n1. 把主屏再做一步真正的大屏编排\n2. 继续削前端重包\n如果你继续让我自主迭代，我下一轮就专门打这两个点。",
        }],
      },
    ])

    expect(result).toBe(true)
  })
})
