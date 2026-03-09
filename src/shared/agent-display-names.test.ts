import { describe, expect, test } from "bun:test"

import {
  getAgentConfigKey,
  getAgentDisplayName,
  resolveAgentDisplayLanguage,
  setAgentDisplayLanguage,
} from "./agent-display-names"

describe("agent-display-names", () => {
  test("returns Chinese names for oracle/librarian when language is zh", () => {
    setAgentDisplayLanguage("zh")

    expect(getAgentDisplayName("oracle")).toBe("研判官")
    expect(getAgentDisplayName("librarian")).toBe("资料官")

    setAgentDisplayLanguage("en")
  })

  test("resolves Chinese display names back to config keys", () => {
    expect(getAgentConfigKey("研判官")).toBe("oracle")
    expect(getAgentConfigKey("资料官")).toBe("librarian")
  })

  test("resolves zh-cn locale config language to zh", () => {
    expect(resolveAgentDisplayLanguage("zh-CN")).toBe("zh")
  })

  test("returns English defaults when language is en", () => {
    setAgentDisplayLanguage("en")
    expect(getAgentDisplayName("oracle")).toBe("oracle")
    expect(getAgentDisplayName("librarian")).toBe("librarian")
  })
})
