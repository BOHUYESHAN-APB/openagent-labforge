import * as p from "@clack/prompts"

type ContextGuardProfile = "conservative" | "balanced" | "aggressive"

export interface ImageBusWizardConfig {
  enabled: boolean
  review_with_main_model: boolean
  default_output_format: "svg" | "png" | "pdf"
  context_guard_profile?: ContextGuardProfile
  bio_agents_visible?: boolean
  context_memory: {
    enabled: boolean
    carry_prompt_context: boolean
    max_history_turns: number
    include_provider_decision_trace: boolean
  }
  routing: {
    strategy: "local-first" | "balanced" | "google-first"
    force_google_for_scientific: boolean
    allow_google_for_general: boolean
  }
  subscription: {
    mode: "self-managed" | "disabled"
    plan_name?: string
  }
  providers: {
    google_nano_banana?: {
      enabled: boolean
      base_url?: string
      generate_endpoint?: string
      api_key_env?: string
      model?: string
    }
    comfyui?: {
      enabled: boolean
      base_url?: string
      workflow_endpoint?: string
      output_dir?: string
    }
    stable_diffusion?: {
      enabled: boolean
      base_url?: string
      txt2img_endpoint?: string
      api_key_env?: string
      model?: string
    }
  }
}

async function promptGeneralSettings(args: {
  includeGeneralSettings: boolean
}): Promise<{ contextGuardProfile?: ContextGuardProfile; bioAgentsVisible?: boolean } | null> {
  if (!args.includeGeneralSettings) {
    return {}
  }

  const contextGuardProfile = await p.select<ContextGuardProfile>({
    message: "Context guard threshold preset (L1/L2/L3)",
    options: [
      {
        value: "aggressive",
        label: "Aggressive",
        hint: "Earlier reminders and earlier auto-compaction",
      },
      {
        value: "balanced",
        label: "Balanced (recommended)",
        hint: "Current default behavior",
      },
      {
        value: "conservative",
        label: "Conservative",
        hint: "Later reminders and later auto-compaction",
      },
    ],
    initialValue: "balanced",
  })
  if (p.isCancel(contextGuardProfile)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const bioAgentsVisible = await p.confirm({
    message: "Show bioinformatics agents in routing/selection lists?",
    initialValue: true,
  })
  if (p.isCancel(bioAgentsVisible)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  return {
    contextGuardProfile,
    bioAgentsVisible,
  }
}

export async function promptImageBusConfig(options?: {
  includeGeneralSettings?: boolean
}): Promise<ImageBusWizardConfig | null> {
  const includeGeneralSettings = options?.includeGeneralSettings === true
  const enabled = await p.confirm({
    message: "Enable image bus for drawing/visual generation routing?",
    initialValue: true,
  })
  if (p.isCancel(enabled)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  if (!enabled) {
    const generalSettings = await promptGeneralSettings({ includeGeneralSettings })
    if (!generalSettings) {
      return null
    }

    return {
      enabled: false,
      review_with_main_model: false,
      default_output_format: "svg",
      ...(generalSettings.contextGuardProfile
        ? { context_guard_profile: generalSettings.contextGuardProfile }
        : {}),
      ...(generalSettings.bioAgentsVisible !== undefined
        ? { bio_agents_visible: generalSettings.bioAgentsVisible }
        : {}),
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
    }
  }

  const strategy = await p.select<"local-first" | "balanced" | "google-first">({
    message: "Select routing strategy",
    options: [
      {
        value: "local-first",
        label: "Local-first (recommended)",
        hint: "Prefer local ComfyUI/SD for general tasks, reserve Google for pro/scientific",
      },
      {
        value: "balanced",
        label: "Balanced",
        hint: "Use local and Google more evenly",
      },
      {
        value: "google-first",
        label: "Google-first",
        hint: "Prioritize Google image path whenever available",
      },
    ],
    initialValue: "local-first",
  })
  if (p.isCancel(strategy)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const forceGoogleScientific = await p.confirm({
    message: "Force Google route for scientific/professional figures?",
    initialValue: true,
  })
  if (p.isCancel(forceGoogleScientific)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const allowGoogleGeneral = await p.confirm({
    message: "Allow Google route for general/non-professional image tasks?",
    initialValue: false,
  })
  if (p.isCancel(allowGoogleGeneral)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const subscriptionMode = await p.select<"self-managed" | "disabled">({
    message: "Google banana subscription mode",
    options: [
      {
        value: "self-managed",
        label: "Self-managed subscription",
        hint: "Use your own commercial subscription/key path",
      },
      {
        value: "disabled",
        label: "Disabled",
        hint: "Do not use Google image path",
      },
    ],
    initialValue: "self-managed",
  })
  if (p.isCancel(subscriptionMode)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  let planName: string | undefined
  if (subscriptionMode === "self-managed") {
    const plan = await p.text({
      message: "Subscription plan label (optional)",
      placeholder: "google-banana-pro",
    })
    if (p.isCancel(plan)) {
      p.cancel("Configuration cancelled.")
      return null
    }
    const trimmed = plan.trim()
    planName = trimmed.length > 0 ? trimmed : undefined
  }

  const enableComfy = await p.confirm({
    message: "Enable local ComfyUI provider?",
    initialValue: true,
  })
  if (p.isCancel(enableComfy)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  let comfyui: ImageBusWizardConfig["providers"]["comfyui"]
  if (enableComfy) {
    const comfyBase = await p.text({
      message: "ComfyUI base URL",
      placeholder: "http://127.0.0.1:8188",
      initialValue: "http://127.0.0.1:8188",
    })
    if (p.isCancel(comfyBase)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const comfyWorkflow = await p.text({
      message: "ComfyUI workflow endpoint",
      placeholder: "/prompt",
      initialValue: "/prompt",
    })
    if (p.isCancel(comfyWorkflow)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    comfyui = {
      enabled: true,
      base_url: comfyBase.trim(),
      workflow_endpoint: comfyWorkflow.trim(),
    }
  }

  const enableStableDiffusion = await p.confirm({
    message: "Enable Stable Diffusion provider?",
    initialValue: false,
  })
  if (p.isCancel(enableStableDiffusion)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  let stable_diffusion: ImageBusWizardConfig["providers"]["stable_diffusion"]
  if (enableStableDiffusion) {
    const stableDiffusionBase = await p.text({
      message: "Stable Diffusion base URL",
      placeholder: "http://127.0.0.1:7860",
      initialValue: "http://127.0.0.1:7860",
    })
    if (p.isCancel(stableDiffusionBase)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const stableDiffusionEndpoint = await p.text({
      message: "Stable Diffusion txt2img endpoint",
      placeholder: "/sdapi/v1/txt2img",
      initialValue: "/sdapi/v1/txt2img",
    })
    if (p.isCancel(stableDiffusionEndpoint)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const stableDiffusionModel = await p.text({
      message: "Stable Diffusion model (optional)",
      placeholder: "sdxl",
      initialValue: "sdxl",
    })
    if (p.isCancel(stableDiffusionModel)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const stableDiffusionApiKeyEnv = await p.text({
      message: "Stable Diffusion API key env var (optional)",
      placeholder: "STABLE_DIFFUSION_API_KEY",
    })
    if (p.isCancel(stableDiffusionApiKeyEnv)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    stable_diffusion = {
      enabled: true,
      base_url: stableDiffusionBase.trim(),
      txt2img_endpoint: stableDiffusionEndpoint.trim(),
      ...(stableDiffusionModel.trim().length > 0 ? { model: stableDiffusionModel.trim() } : {}),
      ...(stableDiffusionApiKeyEnv.trim().length > 0 ? { api_key_env: stableDiffusionApiKeyEnv.trim() } : {}),
    }
  }

  const enableGoogle = subscriptionMode === "self-managed"
    ? await p.confirm({
      message: "Enable Google nano banana provider?",
      initialValue: true,
    })
    : false
  if (subscriptionMode === "self-managed" && p.isCancel(enableGoogle)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  let google_nano_banana: ImageBusWizardConfig["providers"]["google_nano_banana"]
  if (enableGoogle) {
    const googleBase = await p.text({
      message: "Google provider base URL",
      placeholder: "https://generativelanguage.googleapis.com",
      initialValue: "https://generativelanguage.googleapis.com",
    })
    if (p.isCancel(googleBase)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const googleModel = await p.text({
      message: "Google image model",
      placeholder: "nano-banana-2",
      initialValue: "nano-banana-2",
    })
    if (p.isCancel(googleModel)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const googleGenerateEndpoint = await p.text({
      message: "Google generate endpoint (optional, supports relay URL and {model})",
      placeholder: "/v1beta/models/{model}:generateImages",
      initialValue: "/v1beta/models/{model}:generateImages",
    })
    if (p.isCancel(googleGenerateEndpoint)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    const apiKeyEnv = await p.text({
      message: "API key environment variable name",
      placeholder: "GOOGLE_API_KEY",
      initialValue: "GOOGLE_API_KEY",
    })
    if (p.isCancel(apiKeyEnv)) {
      p.cancel("Configuration cancelled.")
      return null
    }

    google_nano_banana = {
      enabled: true,
      base_url: googleBase.trim(),
      model: googleModel.trim(),
      ...(googleGenerateEndpoint.trim().length > 0 ? { generate_endpoint: googleGenerateEndpoint.trim() } : {}),
      api_key_env: apiKeyEnv.trim(),
    }
  }

  const reviewWithMainModel = await p.confirm({
    message: "Enable final review with main model?",
    initialValue: true,
  })
  if (p.isCancel(reviewWithMainModel)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const outputFormat = await p.select<"svg" | "png" | "pdf">({
    message: "Default output format",
    options: [
      { value: "svg", label: "SVG", hint: "Best for scientific/editable figures" },
      { value: "png", label: "PNG", hint: "Best for compatibility" },
      { value: "pdf", label: "PDF", hint: "Best for publication export" },
    ],
    initialValue: "svg",
  })
  if (p.isCancel(outputFormat)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  const contextMemoryEnabled = await p.confirm({
    message: "Enable image bus context memory across turns?",
    initialValue: true,
  })
  if (p.isCancel(contextMemoryEnabled)) {
    p.cancel("Configuration cancelled.")
    return null
  }

  let carryPromptContext = false
  if (contextMemoryEnabled) {
    const carryPromptContextAnswer = await p.confirm({
      message: "Carry prior image intent/prompt context when generating follow-up images?",
      initialValue: true,
    })
    if (p.isCancel(carryPromptContextAnswer)) {
      p.cancel("Configuration cancelled.")
      return null
    }
    carryPromptContext = carryPromptContextAnswer
  }

  let maxHistoryTurns = 0
  if (contextMemoryEnabled) {
    const maxHistoryTurnsAnswer = await p.select<number>({
      message: "Context memory window (turns)",
      options: [
        { value: 3, label: "3 turns" },
        { value: 5, label: "5 turns (recommended)" },
        { value: 8, label: "8 turns" },
      ],
      initialValue: 5,
    })
    if (p.isCancel(maxHistoryTurnsAnswer)) {
      p.cancel("Configuration cancelled.")
      return null
    }
    maxHistoryTurns = maxHistoryTurnsAnswer
  }

  let includeDecisionTrace = false
  if (contextMemoryEnabled) {
    const includeDecisionTraceAnswer = await p.confirm({
      message: "Include provider decision trace in memory context?",
      initialValue: false,
    })
    if (p.isCancel(includeDecisionTraceAnswer)) {
      p.cancel("Configuration cancelled.")
      return null
    }
    includeDecisionTrace = includeDecisionTraceAnswer
  }

  const generalSettings = await promptGeneralSettings({ includeGeneralSettings })
  if (!generalSettings) {
    return null
  }

  return {
    enabled: true,
    review_with_main_model: reviewWithMainModel,
    default_output_format: outputFormat,
    ...(generalSettings.contextGuardProfile
      ? { context_guard_profile: generalSettings.contextGuardProfile }
      : {}),
    ...(generalSettings.bioAgentsVisible !== undefined
      ? { bio_agents_visible: generalSettings.bioAgentsVisible }
      : {}),
    context_memory: {
      enabled: contextMemoryEnabled,
      carry_prompt_context: carryPromptContext,
      max_history_turns: maxHistoryTurns,
      include_provider_decision_trace: includeDecisionTrace,
    },
    routing: {
      strategy,
      force_google_for_scientific: forceGoogleScientific,
      allow_google_for_general: allowGoogleGeneral,
    },
    subscription: {
      mode: subscriptionMode,
      ...(planName ? { plan_name: planName } : {}),
    },
    providers: {
      ...(google_nano_banana ? { google_nano_banana } : {}),
      ...(comfyui ? { comfyui } : {}),
      ...(stable_diffusion ? { stable_diffusion } : {}),
    },
  }
}