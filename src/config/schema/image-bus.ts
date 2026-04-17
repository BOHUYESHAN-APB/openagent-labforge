import { z } from "zod"

const ImageBusRoutingPolicySchema = z.object({
  strategy: z.enum(["local-first", "balanced", "google-first"]).optional(),
  force_google_for_scientific: z.boolean().optional(),
  allow_google_for_general: z.boolean().optional(),
})

const ImageBusSubscriptionPolicySchema = z.object({
  mode: z.enum(["self-managed", "disabled"]).optional(),
  plan_name: z.string().optional(),
})

const GoogleNanoBananaConfigSchema = z.object({
  enabled: z.boolean().optional(),
  base_url: z.string().optional(),
  generate_endpoint: z.string().optional(),
  api_key_env: z.string().optional(),
  model: z.string().optional(),
})

const ComfyUiImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  base_url: z.string().optional(),
  workflow_endpoint: z.string().optional(),
  output_dir: z.string().optional(),
})

const StableDiffusionImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  base_url: z.string().optional(),
  txt2img_endpoint: z.string().optional(),
  api_key_env: z.string().optional(),
  model: z.string().optional(),
})

const CustomImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().optional(),
  base_url: z.string().optional(),
  api_key_env: z.string().optional(),
  model: z.string().optional(),
})

const ImageBusContextMemoryConfigSchema = z.object({
  enabled: z.boolean().optional(),
  carry_prompt_context: z.boolean().optional(),
  max_history_turns: z.number().int().min(0).max(20).optional(),
  include_provider_decision_trace: z.boolean().optional(),
})

export const ImageBusConfigSchema = z.object({
  enabled: z.boolean().optional(),
  review_with_main_model: z.boolean().optional(),
  default_output_format: z.enum(["svg", "png", "pdf"]).optional(),
  context_memory: ImageBusContextMemoryConfigSchema.optional(),
  routing: ImageBusRoutingPolicySchema.optional(),
  subscription: ImageBusSubscriptionPolicySchema.optional(),
  providers: z.object({
    google_nano_banana: GoogleNanoBananaConfigSchema.optional(),
    comfyui: ComfyUiImageBusConfigSchema.optional(),
    stable_diffusion: StableDiffusionImageBusConfigSchema.optional(),
    custom: z.array(CustomImageBusConfigSchema).optional(),
  }).optional(),
})

export type ImageBusConfig = z.infer<typeof ImageBusConfigSchema>
