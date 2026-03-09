import { describe, expect, test } from "bun:test"

import { applyProviderConfig } from "./provider-config-handler"

describe("applyProviderConfig", () => {
  test("injects AUTO provider and model presets", () => {
    //#given
    const config: Record<string, unknown> = {
      provider: {
        openai: {
          models: {
            "gpt-5.4": {},
          },
        },
      },
    }
    const modelCacheState = {
      anthropicContext1MEnabled: false,
      modelContextLimitsCache: new Map<string, number>(),
    }

    //#when
    applyProviderConfig({ config, modelCacheState })

    //#then
    const providers = config.provider as Record<string, { models?: Record<string, unknown> }>
    expect(providers.auto).toBeDefined()
    expect(providers.auto?.models).toBeDefined()
    expect(Object.keys(providers.auto?.models ?? {})).toContain("auto")
    expect(Object.keys(providers.auto?.models ?? {})).toContain("auto/deep")
    expect(Object.keys(providers.auto?.models ?? {})).toContain("auto/visual-engineering")
  })
})
