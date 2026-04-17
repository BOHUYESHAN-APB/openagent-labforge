import { describe, expect, test } from "bun:test"
import { createImageGenerateTool } from "./tools"

function createMockFetch(response: { ok: boolean; status: number; body: Record<string, unknown> }, capture: { url?: string; init?: RequestInit }) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    capture.url = typeof url === "string" ? url : url.toString()
    capture.init = init
    return {
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    } as unknown as Response
  }) as typeof fetch
}

describe("image-generate tool", () => {
  test("returns disabled message when image_bus is not enabled", async () => {
    const tool = createImageGenerateTool({
      imageBusConfig: {
        enabled: false,
      },
    })

    const result = await tool.execute({ prompt: "draw cell" } as never)
    expect(result).toContain("image_bus is disabled")
  })

  test("routes scientific task to google first when forced", async () => {
    const capture: { url?: string; init?: RequestInit } = {}
    const previousKey = process.env.GOOGLE_API_KEY
    process.env.GOOGLE_API_KEY = "test-key"

    const tool = createImageGenerateTool({
      fetchFn: createMockFetch({ ok: true, status: 200, body: { request_id: "g-1", output_url: "https://img/g.png" } }, capture),
      imageBusConfig: {
        enabled: true,
        routing: {
          strategy: "local-first",
          force_google_for_scientific: true,
          allow_google_for_general: false,
        },
        providers: {
          google_nano_banana: {
            enabled: true,
            base_url: "https://generativelanguage.googleapis.com",
            api_key_env: "GOOGLE_API_KEY",
            model: "nano-banana-2",
          },
          comfyui: {
            enabled: true,
            base_url: "http://127.0.0.1:8188",
            workflow_endpoint: "/prompt",
          },
        },
      },
    })

    try {
      const result = await tool.execute({ prompt: "scientific pathway", task_type: "scientific" } as never)
      expect(result).toContain('"provider": "google"')
      expect(capture.url).toContain("/v1beta/models/nano-banana-2:generateImages")
    } finally {
      if (previousKey === undefined) {
        delete process.env.GOOGLE_API_KEY
      } else {
        process.env.GOOGLE_API_KEY = previousKey
      }
    }
  })

  test("uses comfyui for general task under local-first when google for general is disabled", async () => {
    const capture: { url?: string; init?: RequestInit } = {}
    const tool = createImageGenerateTool({
      fetchFn: createMockFetch({ ok: true, status: 200, body: { prompt_id: "c-1", status: "queued" } }, capture),
      imageBusConfig: {
        enabled: true,
        routing: {
          strategy: "local-first",
          force_google_for_scientific: true,
          allow_google_for_general: false,
        },
        providers: {
          comfyui: {
            enabled: true,
            base_url: "http://127.0.0.1:8188",
            workflow_endpoint: "/prompt",
          },
          google_nano_banana: {
            enabled: true,
            base_url: "https://generativelanguage.googleapis.com",
            api_key_env: "GOOGLE_API_KEY",
          },
        },
      },
    })

    const result = await tool.execute({ prompt: "article illustration", task_type: "general" } as never)
    expect(result).toContain('"provider": "comfyui"')
    expect(capture.url).toBe("http://127.0.0.1:8188/prompt")
  })

  test("uses configured Google relay endpoint when provided", async () => {
    const capture: { url?: string; init?: RequestInit } = {}
    const previousKey = process.env.GOOGLE_API_KEY
    process.env.GOOGLE_API_KEY = "test-key"

    const tool = createImageGenerateTool({
      fetchFn: createMockFetch({ ok: true, status: 200, body: { request_id: "relay-1", output_url: "https://relay/img.png" } }, capture),
      imageBusConfig: {
        enabled: true,
        routing: {
          strategy: "google-first",
          force_google_for_scientific: true,
          allow_google_for_general: true,
        },
        providers: {
          google_nano_banana: {
            enabled: true,
            base_url: "https://relay.example.com",
            generate_endpoint: "/proxy/google/{model}/images",
            api_key_env: "GOOGLE_API_KEY",
            model: "nano-banana-2",
          },
        },
      },
    })

    try {
      const result = await tool.execute({ prompt: "relay route test", task_type: "general" } as never)
      expect(result).toContain('"provider": "google"')
      expect(capture.url).toBe("https://relay.example.com/proxy/google/nano-banana-2/images")
    } finally {
      if (previousKey === undefined) {
        delete process.env.GOOGLE_API_KEY
      } else {
        process.env.GOOGLE_API_KEY = previousKey
      }
    }
  })
})
