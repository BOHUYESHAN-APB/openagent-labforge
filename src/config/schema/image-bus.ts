import { z } from "zod"

const GoogleNanoBananaConfigSchema = z.object({
  enabled: z.boolean().optional(),
  base_url: z.string().optional(),
  api_key_env: z.string().optional(),
  model: z.string().optional(),
})

const ComfyUiImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  base_url: z.string().optional(),
  workflow_endpoint: z.string().optional(),
  output_dir: z.string().optional(),
})

const CustomImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().optional(),
  base_url: z.string().optional(),
  api_key_env: z.string().optional(),
  model: z.string().optional(),
})

export const ImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  review_with_main_model: z.boolean().optional(),
  default_output_format: z.enum(["svg", "png", "pdf"]).optional(),
  providers: z.object({
    google_nano_banana: GoogleNanoBananaConfigSchema.optional(),
    comfyui: ComfyUiImageBusConfigSchema.optional(),
    custom: z.array(CustomImageBusConfigSchema).optional(),
  }).optional(),
})

export type ImageBusConfig = z.infer<typeof ImageBusConfigSchema>
