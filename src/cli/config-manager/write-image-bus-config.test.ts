import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { getPluginConfigPath, resetConfigContext } from "./config-context"
import { writeImageBusConfig } from "./write-image-bus-config"

describe("writeImageBusConfig", () => {
  let testConfigDir = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omo-write-image-bus-${Date.now()}-${Math.random().toString(36).slice(2)}`)

    mkdirSync(testConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = testConfigDir
    resetConfigContext()
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
    resetConfigContext()
    delete process.env.OPENCODE_CONFIG_DIR
  })

  it("writes image_bus config into plugin config file", () => {
    const result = writeImageBusConfig({
      enabled: true,
      review_with_main_model: true,
      default_output_format: "svg",
      routing: {
        strategy: "local-first",
        force_google_for_scientific: true,
        allow_google_for_general: false,
      },
      subscription: {
        mode: "self-managed",
        plan_name: "google-banana-pro",
      },
      providers: {
        google_nano_banana: {
          enabled: true,
          base_url: "https://generativelanguage.googleapis.com",
          api_key_env: "GOOGLE_API_KEY",
          model: "nano-banana-2",
        },
      },
    })

    expect(result.success).toBe(true)
  const testConfigPath = getPluginConfigPath()
    const saved = JSON.parse(readFileSync(testConfigPath, "utf-8")) as Record<string, unknown>
    const imageBus = saved.image_bus as Record<string, unknown>
    expect(imageBus.enabled).toBe(true)
    expect((imageBus.routing as Record<string, unknown>).strategy).toBe("local-first")
  })

  it("preserves existing keys while merging image_bus", () => {
    writeFileSync(
      getPluginConfigPath(),
      JSON.stringify(
        {
          agents: {
            sisyphus: {
              model: "anthropic/claude-sonnet-4-6",
            },
          },
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    )

    const result = writeImageBusConfig({
      enabled: true,
      review_with_main_model: false,
      default_output_format: "png",
      routing: {
        strategy: "balanced",
        force_google_for_scientific: true,
        allow_google_for_general: true,
      },
      subscription: {
        mode: "self-managed",
      },
      providers: {},
    })

    expect(result.success).toBe(true)
  const testConfigPath = getPluginConfigPath()
    const saved = JSON.parse(readFileSync(testConfigPath, "utf-8")) as Record<string, unknown>
    const agents = saved.agents as Record<string, unknown>
    expect(agents.sisyphus).toBeDefined()
    expect(saved.image_bus).toBeDefined()
  })

  it("overrides existing image_bus when wizard writes a disabled switch", () => {
    writeFileSync(
      getPluginConfigPath(),
      JSON.stringify(
        {
          image_bus: {
            enabled: true,
            providers: {
              google_nano_banana: {
                enabled: true,
                base_url: "https://generativelanguage.googleapis.com",
                api_key_env: "GOOGLE_API_KEY",
                model: "nano-banana-2",
              },
            },
          },
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    )

    const result = writeImageBusConfig({
      enabled: false,
      review_with_main_model: false,
      default_output_format: "svg",
      routing: {
        strategy: "local-first",
        force_google_for_scientific: true,
        allow_google_for_general: false,
      },
      subscription: {
        mode: "disabled",
      },
      providers: {},
    })

    expect(result.success).toBe(true)
    const saved = JSON.parse(readFileSync(getPluginConfigPath(), "utf-8")) as Record<string, unknown>
    const imageBus = saved.image_bus as Record<string, unknown>
    expect(imageBus.enabled).toBe(false)
    const providers = imageBus.providers as Record<string, unknown>
    expect(providers.google_nano_banana).toBeUndefined()
  })

  it("writes context_guard_profile and hides bio agents when requested", () => {
    const result = writeImageBusConfig({
      enabled: true,
      review_with_main_model: true,
      default_output_format: "svg",
      context_guard_profile: "aggressive",
      bio_agents_visible: false,
      context_memory: {
        enabled: true,
        carry_prompt_context: true,
        max_history_turns: 5,
        include_provider_decision_trace: false,
      },
      routing: {
        strategy: "local-first",
        force_google_for_scientific: true,
        allow_google_for_general: false,
      },
      subscription: {
        mode: "self-managed",
      },
      providers: {
        stable_diffusion: {
          enabled: true,
          base_url: "http://127.0.0.1:7860",
          txt2img_endpoint: "/sdapi/v1/txt2img",
          model: "sdxl",
        },
      },
    })

    expect(result.success).toBe(true)
    const saved = JSON.parse(readFileSync(getPluginConfigPath(), "utf-8")) as Record<string, unknown>
    const experimental = saved.experimental as Record<string, unknown>
    expect(experimental.context_guard_profile).toBe("aggressive")

    const disabledAgents = saved.disabled_agents as string[]
    expect(disabledAgents).toContain("bio-autopilot")
    expect(disabledAgents).toContain("bio-orchestrator")

    const imageBus = saved.image_bus as Record<string, unknown>
    expect(imageBus.context_guard_profile).toBeUndefined()
    expect(imageBus.bio_agents_visible).toBeUndefined()
  })

  it("unhides bio agents when bio_agents_visible is true", () => {
    writeFileSync(
      getPluginConfigPath(),
      JSON.stringify(
        {
          disabled_agents: ["bio-autopilot", "bio-orchestrator", "sisyphus"],
        },
        null,
        2,
      ) + "\n",
      "utf-8",
    )

    const result = writeImageBusConfig({
      enabled: false,
      review_with_main_model: false,
      default_output_format: "svg",
      bio_agents_visible: true,
      context_memory: {
        enabled: false,
        carry_prompt_context: false,
        max_history_turns: 0,
        include_provider_decision_trace: false,
      },
      routing: {
        strategy: "local-first",
        force_google_for_scientific: true,
        allow_google_for_general: false,
      },
      subscription: {
        mode: "disabled",
      },
      providers: {},
    })

    expect(result.success).toBe(true)
    const saved = JSON.parse(readFileSync(getPluginConfigPath(), "utf-8")) as Record<string, unknown>
    const disabledAgents = saved.disabled_agents as string[]
    expect(disabledAgents).toEqual(["sisyphus"])
  })
})