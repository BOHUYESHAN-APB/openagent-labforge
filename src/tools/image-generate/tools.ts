import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { ImageBusConfig } from "../../config/schema/image-bus"
import { IMAGE_GENERATE_DESCRIPTION } from "./constants"
import type { ImageGenerateArgs, ImageGenerateResult, ImageGenerateToolOptions, ImageTaskType, ProviderKind } from "./types"

function resolveProviderOrder(args: {
  taskType: ImageTaskType
  config: ImageBusConfig
  providerOverride?: ProviderKind
}): ProviderKind[] {
  if (args.providerOverride) {
    return [args.providerOverride]
  }

  const routing = args.config.routing
  const strategy = routing?.strategy ?? "local-first"
  const forceGoogleForScientific = routing?.force_google_for_scientific === true
  const allowGoogleForGeneral = routing?.allow_google_for_general === true

  if (args.taskType === "scientific" && forceGoogleForScientific) {
    return ["google", "comfyui"]
  }

  if (strategy === "google-first") {
    if (args.taskType === "general" && !allowGoogleForGeneral) {
      return ["comfyui"]
    }
    return ["google", "comfyui"]
  }

  if (strategy === "balanced") {
    if (args.taskType === "scientific") {
      return ["google", "comfyui"]
    }
    if (args.taskType === "general" && !allowGoogleForGeneral) {
      return ["comfyui"]
    }
    return ["comfyui", "google"]
  }

  if (args.taskType === "general" && !allowGoogleForGeneral) {
    return ["comfyui"]
  }
  return ["comfyui", "google"]
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

function resolveGoogleGenerateUrl(args: {
  baseUrl: string
  model: string
  generateEndpoint?: string
}): string {
  const normalizedBase = normalizeBaseUrl(args.baseUrl)
  const endpointTemplate = args.generateEndpoint?.trim()
  const defaultEndpoint = `/v1beta/models/${args.model}:generateImages`

  if (!endpointTemplate) {
    return `${normalizedBase}${defaultEndpoint}`
  }

  const renderedEndpoint = endpointTemplate.replaceAll("{model}", args.model)
  if (/^https?:\/\//i.test(renderedEndpoint)) {
    return renderedEndpoint
  }

  return `${normalizedBase}${renderedEndpoint.startsWith("/") ? renderedEndpoint : `/${renderedEndpoint}`}`
}

async function callComfyUi(args: {
  fetchFn: typeof fetch
  config: NonNullable<ImageBusConfig["providers"]>["comfyui"]
  request: ImageGenerateArgs
  outputFormat: "svg" | "png" | "pdf"
}): Promise<ImageGenerateResult> {
  if (!args.config?.enabled) {
    throw new Error("ComfyUI provider is not enabled")
  }
  const baseUrl = args.config.base_url?.trim()
  if (!baseUrl) {
    throw new Error("ComfyUI base_url is missing")
  }

  const endpoint = args.config.workflow_endpoint?.trim() || "/prompt"
  const url = `${normalizeBaseUrl(baseUrl)}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const response = await args.fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt: args.request.prompt,
      task_type: args.request.task_type ?? "general",
      output_format: args.outputFormat,
      reference_images: args.request.reference_images ?? [],
    }),
  })

  if (!response.ok) {
    throw new Error(`ComfyUI request failed: HTTP ${response.status}`)
  }

  const data = await response.json() as Record<string, unknown>
  return {
    provider: "comfyui",
    status: (typeof data.status === "string" && data.status === "completed") ? "completed" : "queued",
    request_id: typeof data.prompt_id === "string" ? data.prompt_id : (typeof data.request_id === "string" ? data.request_id : undefined),
    output_url: typeof data.output_url === "string" ? data.output_url : undefined,
    raw: data,
  }
}

async function callGoogle(args: {
  fetchFn: typeof fetch
  config: NonNullable<ImageBusConfig["providers"]>["google_nano_banana"]
  request: ImageGenerateArgs
  outputFormat: "svg" | "png" | "pdf"
}): Promise<ImageGenerateResult> {
  if (!args.config?.enabled) {
    throw new Error("Google provider is not enabled")
  }
  const baseUrl = args.config.base_url?.trim()
  if (!baseUrl) {
    throw new Error("Google provider base_url is missing")
  }

  const apiKeyEnv = args.config.api_key_env?.trim()
  if (!apiKeyEnv) {
    throw new Error("Google provider api_key_env is missing")
  }

  const apiKey = process.env[apiKeyEnv]
  if (!apiKey) {
    throw new Error(`Environment variable ${apiKeyEnv} is not set`)
  }

  const model = args.config.model?.trim() || "nano-banana-2"
  const url = resolveGoogleGenerateUrl({
    baseUrl,
    model,
    generateEndpoint: args.config.generate_endpoint,
  })

  const response = await args.fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      prompt: args.request.prompt,
      taskType: args.request.task_type ?? "general",
      outputFormat: args.outputFormat,
      referenceImages: args.request.reference_images ?? [],
    }),
  })

  if (!response.ok) {
    throw new Error(`Google request failed: HTTP ${response.status}`)
  }

  const data = await response.json() as Record<string, unknown>
  const requestId = typeof data.request_id === "string"
    ? data.request_id
    : (typeof data.id === "string" ? data.id : undefined)

  const outputUrl = typeof data.output_url === "string"
    ? data.output_url
    : undefined

  return {
    provider: "google",
    status: outputUrl ? "completed" : "queued",
    request_id: requestId,
    output_url: outputUrl,
    raw: data,
  }
}

export function createImageGenerateTool(options: ImageGenerateToolOptions): ToolDefinition {
  const fetchFn = options.fetchFn ?? fetch

  return tool({
    description: IMAGE_GENERATE_DESCRIPTION,
    args: {
      prompt: tool.schema.string().describe("Image generation prompt"),
      task_type: tool.schema.enum(["general", "illustration", "scientific"]).optional().describe("Task category for routing policy"),
      provider: tool.schema.enum(["comfyui", "google"]).optional().describe("Optional provider override"),
      output_format: tool.schema.enum(["svg", "png", "pdf"]).optional().describe("Optional output format override"),
      reference_images: tool.schema.array(tool.schema.string()).optional().describe("Optional reference image URLs or local file paths"),
    },
    async execute(args: ImageGenerateArgs): Promise<string> {
      const imageBusConfig = options.imageBusConfig
      if (!imageBusConfig || imageBusConfig.enabled !== true) {
        return "image_bus is disabled. Enable image_bus.enabled=true to activate image generation."
      }

      const taskType = args.task_type ?? "general"
      const outputFormat = args.output_format ?? imageBusConfig.default_output_format ?? "svg"
      const providers = resolveProviderOrder({
        taskType,
        config: imageBusConfig,
        providerOverride: args.provider,
      })

      const failures: string[] = []
      for (const provider of providers) {
        try {
          if (provider === "comfyui") {
            const result = await callComfyUi({
              fetchFn,
              config: imageBusConfig.providers?.comfyui,
              request: args,
              outputFormat,
            })
            return JSON.stringify(result, null, 2)
          }

          const result = await callGoogle({
            fetchFn,
            config: imageBusConfig.providers?.google_nano_banana,
            request: args,
            outputFormat,
          })
          return JSON.stringify(result, null, 2)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          failures.push(`${provider}: ${message}`)
        }
      }

      return `Image generation failed across routed providers. ${failures.join(" | ")}`
    },
  })
}
