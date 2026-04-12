import { describe, expect, test } from "bun:test"

import { detectLatestAssistantCompletionPosture } from "./completion-posture-detection"

describe("detectLatestAssistantCompletionPosture", () => {
  test("detects clean terminal completion when the assistant only offers future edits conditionally", () => {
    const result = detectLatestAssistantCompletionPosture([
      {
        info: { role: "assistant", id: "msg-1" },
        parts: [{
          type: "text",
          text: "这轮 reviewed wave 已完成。后续如果你继续想修改，我就直接基于这三个最终文件继续改。",
        }],
      },
    ])

    expect(result.kind).toBe("terminal_complete")
    expect(result.signature).toBeTruthy()
  })

  test("detects pseudo completion when completion is followed by explicit next-wave scope", () => {
    const result = detectLatestAssistantCompletionPosture([
      {
        info: { role: "assistant", id: "msg-2" },
        parts: [{
          type: "text",
          text: "这一小波完成了，但我已经把下一最小波锁好了。新增文件：84_下一波范围_先做DWF4普通荞麦与苦荞基因结构对照图.txt",
        }],
      },
    ])

    expect(result.kind).toBe("pseudo_complete")
    expect(result.blockingFindings[0]).toContain("Completion claim conflicts")
  })

  test("detects pseudo completion for conditional follow-up that already lists concrete remaining items", () => {
    const result = detectLatestAssistantCompletionPosture([
      {
        info: { role: "assistant", id: "msg-3" },
        parts: [{
          type: "text",
          text: "当前这轮检查已完成。如果你要我继续，同一文件里下一轮最自然的批次是：\n- 按章节再筛一遍投资人口吻重灾区\n- 专抓重复的平台/系统/能力叠词句",
        }],
      },
    ])

    expect(result.kind).toBe("pseudo_complete")
  })

  test("treats conditional next-step lists as pseudo completion", () => {
    const result = detectLatestAssistantCompletionPosture([
      {
        info: { role: "assistant", id: "msg-4" },
        parts: [{
          type: "text",
          text: "这一波已经完成。如果你要，我下一步可以直接给你：\n1. 一份剩余 run 的下载命令清单\n2. 一份更省空间的分析顺序",
        }],
      },
    ])

    expect(result.kind).toBe("pseudo_complete")
  })
})
