import type { ImageBusConfig } from "../../config/schema/image-bus"

export type ImageTaskType = "general" | "illustration" | "scientific"
export type ProviderKind = "comfyui" | "google"

export interface ImageGenerateArgs {
  prompt: string
  task_type?: ImageTaskType
  provider?: ProviderKind
  output_format?: "svg" | "png" | "pdf"
  reference_images?: string[]
}

export interface ImageGenerateResult {
  provider: ProviderKind
  status: "queued" | "completed"
  request_id?: string
  output_url?: string
  raw?: unknown
}

export interface ImageGenerateToolOptions {
  imageBusConfig?: ImageBusConfig
  fetchFn?: typeof fetch
}
