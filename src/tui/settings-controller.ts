import type { TuiDialogSelectOption, TuiPluginApi } from "./types"
import {
  getNestedBoolean,
  getNestedNumber,
  getNestedString,
  isBioAgentsVisible,
  readEffectiveConfig,
  resolveScopeConfigPath,
  setBioAgentsVisible,
  setNestedValue,
  updateScopeConfig,
  type SettingsScope,
} from "./config-files"

const SETTINGS_SCOPE_KEY = "openagent-labforge.settings.scope"

type SettingsEntry = "root" | "general" | "image-bus"

type ProviderKey = "google_nano_banana" | "comfyui" | "stable_diffusion"

type EnumChoice<Value extends string> = {
  title: string
  value: Value
  description?: string
}

function booleanLabel(value: boolean | undefined, trueLabel = "Enabled", falseLabel = "Disabled"): string {
  return value === true ? trueLabel : falseLabel
}

function stringLabel(value: string | undefined, fallback = "Not set"): string {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function numberLabel(value: number | undefined, fallback = "Not set"): string {
  return typeof value === "number" ? String(value) : fallback
}

export function createSettingsController(api: TuiPluginApi, directory: string) {
  let scope: SettingsScope = api.kv.get<SettingsScope>(SETTINGS_SCOPE_KEY, "project") === "user" ? "user" : "project"

  const toast = (message: string, variant: "success" | "warning" | "error" | "info" = "success") => {
    api.ui.toast({
      title: "OpenAgent Settings",
      message,
      variant,
      duration: 2600,
    })
  }

  const effective = () => readEffectiveConfig(directory)
  const effectiveRecord = () => effective() as unknown as Record<string, unknown>
  const scopePath = () => resolveScopeConfigPath(scope, directory)

  const persistScope = (next: SettingsScope) => {
    scope = next
    api.kv.set(SETTINGS_SCOPE_KEY, next)
  }

  const save = (mutate: (root: Record<string, unknown>) => void, successMessage: string, reopen: () => void) => {
    try {
      const path = updateScopeConfig(scope, directory, mutate)
      toast(`${successMessage} (${scope} scope)\n${path}`)
      reopen()
    } catch (error) {
      toast(String(error), "error")
    }
  }

  const openStringPrompt = (args: {
    title: string
    value: string | undefined
    placeholder?: string
    onConfirm: (value: string | undefined) => void
    onCancel: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogPrompt({
        title: args.title,
        value: args.value ?? "",
        placeholder: args.placeholder,
        onConfirm: (value) => {
          const trimmed = value.trim()
          args.onConfirm(trimmed.length > 0 ? trimmed : undefined)
        },
        onCancel: args.onCancel,
      })
    )
  }

  const openNumberPrompt = (args: {
    title: string
    value: number | undefined
    placeholder?: string
    min: number
    max: number
    onConfirm: (value: number) => void
    onCancel: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogPrompt({
        title: args.title,
        value: args.value !== undefined ? String(args.value) : "",
        placeholder: args.placeholder,
        onConfirm: (value) => {
          const trimmed = value.trim()
          const parsed = Number(trimmed)
          if (!Number.isInteger(parsed) || parsed < args.min || parsed > args.max) {
            toast(`Enter an integer between ${args.min} and ${args.max}.`, "warning")
            openNumberPrompt(args)
            return
          }
          args.onConfirm(parsed)
        },
        onCancel: args.onCancel,
      })
    )
  }

  const openEnumDialog = <Value extends string>(args: {
    title: string
    current: Value | undefined
    choices: EnumChoice<Value>[]
    onConfirm: (value: Value) => void
    onBack: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: args.title,
        current: args.current,
        options: [
          ...args.choices.map<TuiDialogSelectOption<Value>>((choice) => ({
            title: choice.title,
            value: choice.value,
            description: choice.description,
          })),
          {
            title: "Back",
            value: "__back__" as Value,
            description: "Return without changing this setting.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "__back__") {
            args.onBack()
            return
          }
          args.onConfirm(option.value)
        },
      })
    )
  }

  const openBooleanDialog = (args: {
    title: string
    current: boolean | undefined
    trueLabel: string
    falseLabel: string
    onConfirm: (value: boolean) => void
    onBack: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect<string>({
        title: args.title,
        current: args.current === undefined ? undefined : args.current ? "true" : "false",
        options: [
          {
            title: args.trueLabel,
            value: "true",
            description: "Apply this setting now.",
          },
          {
            title: args.falseLabel,
            value: "false",
            description: "Apply this setting now.",
          },
          {
            title: "Back",
            value: "__back__",
            description: "Return without changing this setting.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "__back__") {
            args.onBack()
            return
          }
          args.onConfirm(option.value === "true")
        },
      })
    )
  }

  const openScopeDialog = (onBack: () => void) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Settings Scope",
        current: scope,
        options: [
          {
            title: "Project",
            value: "project",
            description: resolveScopeConfigPath("project", directory),
          },
          {
            title: "User",
            value: "user",
            description: resolveScopeConfigPath("user", directory),
          },
          {
            title: "Back",
            value: "__back__",
            description: "Return to the previous settings page.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "__back__") {
            onBack()
            return
          }
          persistScope(option.value === "user" ? "user" : "project")
          toast(`Settings scope switched to ${scope}.`, "info")
          onBack()
        },
      })
    )
  }

  const openGoogleProvider = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "providers", "google_nano_banana"]
    const enabled = getNestedBoolean(config, [...basePath, "enabled"])
    const baseUrl = getNestedString(config, [...basePath, "base_url"])
    const endpoint = getNestedString(config, [...basePath, "generate_endpoint"])
    const apiKeyEnv = getNestedString(config, [...basePath, "api_key_env"])
    const model = getNestedString(config, [...basePath, "model"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Google Nano Banana",
        options: [
          {
            title: "Enabled",
            value: "enabled",
            description: booleanLabel(enabled),
          },
          {
            title: "Base URL",
            value: "base_url",
            description: stringLabel(baseUrl),
          },
          {
            title: "Generate Endpoint",
            value: "endpoint",
            description: stringLabel(endpoint),
          },
          {
            title: "API Key Env",
            value: "api_key_env",
            description: stringLabel(apiKeyEnv),
          },
          {
            title: "Model",
            value: "model",
            description: stringLabel(model),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus providers.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: "Google Nano Banana",
              current: enabled,
              trueLabel: "Enable provider",
              falseLabel: "Disable provider",
              onBack: openGoogleProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  "Updated Google Nano Banana enabled flag",
                  openGoogleProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: "Google Nano Banana Base URL",
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            endpoint: {
              title: "Google Nano Banana Generate Endpoint",
              value: endpoint,
              path: [...basePath, "generate_endpoint"],
            },
            api_key_env: {
              title: "Google Nano Banana API Key Env",
              value: apiKeyEnv,
              path: [...basePath, "api_key_env"],
            },
            model: {
              title: "Google Nano Banana Model",
              value: model,
              path: [...basePath, "model"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: "Leave blank to clear",
            onCancel: openGoogleProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                `Updated ${prompt.title}`,
                openGoogleProvider,
              ),
          })
        },
      })
    )
  }

  const openComfyUiProvider = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "providers", "comfyui"]
    const enabled = getNestedBoolean(config, [...basePath, "enabled"])
    const baseUrl = getNestedString(config, [...basePath, "base_url"])
    const endpoint = getNestedString(config, [...basePath, "workflow_endpoint"])
    const outputDir = getNestedString(config, [...basePath, "output_dir"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "ComfyUI",
        options: [
          {
            title: "Enabled",
            value: "enabled",
            description: booleanLabel(enabled),
          },
          {
            title: "Base URL",
            value: "base_url",
            description: stringLabel(baseUrl),
          },
          {
            title: "Workflow Endpoint",
            value: "workflow_endpoint",
            description: stringLabel(endpoint),
          },
          {
            title: "Output Directory",
            value: "output_dir",
            description: stringLabel(outputDir),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus providers.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: "ComfyUI",
              current: enabled,
              trueLabel: "Enable provider",
              falseLabel: "Disable provider",
              onBack: openComfyUiProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  "Updated ComfyUI enabled flag",
                  openComfyUiProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: "ComfyUI Base URL",
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            workflow_endpoint: {
              title: "ComfyUI Workflow Endpoint",
              value: endpoint,
              path: [...basePath, "workflow_endpoint"],
            },
            output_dir: {
              title: "ComfyUI Output Directory",
              value: outputDir,
              path: [...basePath, "output_dir"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: "Leave blank to clear",
            onCancel: openComfyUiProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                `Updated ${prompt.title}`,
                openComfyUiProvider,
              ),
          })
        },
      })
    )
  }

  const openStableDiffusionProvider = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "providers", "stable_diffusion"]
    const enabled = getNestedBoolean(config, [...basePath, "enabled"])
    const baseUrl = getNestedString(config, [...basePath, "base_url"])
    const endpoint = getNestedString(config, [...basePath, "txt2img_endpoint"])
    const apiKeyEnv = getNestedString(config, [...basePath, "api_key_env"])
    const model = getNestedString(config, [...basePath, "model"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Stable Diffusion",
        options: [
          {
            title: "Enabled",
            value: "enabled",
            description: booleanLabel(enabled),
          },
          {
            title: "Base URL",
            value: "base_url",
            description: stringLabel(baseUrl),
          },
          {
            title: "Txt2Img Endpoint",
            value: "txt2img_endpoint",
            description: stringLabel(endpoint),
          },
          {
            title: "API Key Env",
            value: "api_key_env",
            description: stringLabel(apiKeyEnv),
          },
          {
            title: "Model",
            value: "model",
            description: stringLabel(model),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus providers.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: "Stable Diffusion",
              current: enabled,
              trueLabel: "Enable provider",
              falseLabel: "Disable provider",
              onBack: openStableDiffusionProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  "Updated Stable Diffusion enabled flag",
                  openStableDiffusionProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: "Stable Diffusion Base URL",
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            txt2img_endpoint: {
              title: "Stable Diffusion Txt2Img Endpoint",
              value: endpoint,
              path: [...basePath, "txt2img_endpoint"],
            },
            api_key_env: {
              title: "Stable Diffusion API Key Env",
              value: apiKeyEnv,
              path: [...basePath, "api_key_env"],
            },
            model: {
              title: "Stable Diffusion Model",
              value: model,
              path: [...basePath, "model"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: "Leave blank to clear",
            onCancel: openStableDiffusionProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                `Updated ${prompt.title}`,
                openStableDiffusionProvider,
              ),
          })
        },
      })
    )
  }

  const openProviders = () => {
    const config = effectiveRecord()
    const describeProvider = (provider: ProviderKey) => booleanLabel(getNestedBoolean(config, ["image_bus", "providers", provider, "enabled"]))

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Image Bus Providers",
        options: [
          {
            title: "Google Nano Banana",
            value: "google_nano_banana",
            description: describeProvider("google_nano_banana"),
          },
          {
            title: "ComfyUI",
            value: "comfyui",
            description: describeProvider("comfyui"),
          },
          {
            title: "Stable Diffusion",
            value: "stable_diffusion",
            description: describeProvider("stable_diffusion"),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus settings.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }
          if (option.value === "google_nano_banana") {
            openGoogleProvider()
            return
          }
          if (option.value === "comfyui") {
            openComfyUiProvider()
            return
          }
          openStableDiffusionProvider()
        },
      })
    )
  }

  const openContextMemory = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "context_memory"]
    const enabled = getNestedBoolean(config, [...basePath, "enabled"])
    const carryPrompt = getNestedBoolean(config, [...basePath, "carry_prompt_context"])
    const maxTurns = getNestedNumber(config, [...basePath, "max_history_turns"])
    const trace = getNestedBoolean(config, [...basePath, "include_provider_decision_trace"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Image Bus Context Memory",
        options: [
          {
            title: "Enabled",
            value: "enabled",
            description: booleanLabel(enabled),
          },
          {
            title: "Carry Prompt Context",
            value: "carry_prompt_context",
            description: booleanLabel(carryPrompt),
          },
          {
            title: "Max History Turns",
            value: "max_history_turns",
            description: numberLabel(maxTurns),
          },
          {
            title: "Decision Trace",
            value: "include_provider_decision_trace",
            description: booleanLabel(trace),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus settings.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }
          if (option.value === "max_history_turns") {
            openNumberPrompt({
              title: "Max History Turns",
              value: maxTurns,
              placeholder: "0-20",
              min: 0,
              max: 20,
              onCancel: openContextMemory,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "max_history_turns"], value),
                  "Updated Image Bus context memory history length",
                  openContextMemory,
                ),
            })
            return
          }
          openBooleanDialog({
            title: "Image Bus Context Memory",
            current:
              option.value === "enabled"
                ? enabled
                : option.value === "carry_prompt_context"
                  ? carryPrompt
                  : trace,
            trueLabel: "Enable",
            falseLabel: "Disable",
            onBack: openContextMemory,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...basePath, option.value], value),
                `Updated ${option.value.replaceAll("_", " ")}`,
                openContextMemory,
              ),
          })
        },
      })
    )
  }

  const openRouting = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "routing"]
    const strategy = getNestedString(config, [...basePath, "strategy"]) as
      | "local-first"
      | "balanced"
      | "google-first"
      | undefined
    const forceScientific = getNestedBoolean(config, [...basePath, "force_google_for_scientific"])
    const allowGeneral = getNestedBoolean(config, [...basePath, "allow_google_for_general"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "Image Bus Routing",
        options: [
          {
            title: "Strategy",
            value: "strategy",
            description: stringLabel(strategy, "balanced"),
          },
          {
            title: "Force Google For Scientific",
            value: "force_google_for_scientific",
            description: booleanLabel(forceScientific),
          },
          {
            title: "Allow Google For General",
            value: "allow_google_for_general",
            description: booleanLabel(allowGeneral),
          },
          {
            title: "Back",
            value: "back",
            description: "Return to Image Bus settings.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }
          if (option.value === "strategy") {
            openEnumDialog({
              title: "Image Bus Routing Strategy",
              current: strategy,
              choices: [
                {
                  title: "Local First",
                  value: "local-first",
                  description: "Prefer local ComfyUI/Stable Diffusion when possible.",
                },
                {
                  title: "Balanced",
                  value: "balanced",
                  description: "Use local and Google providers more evenly.",
                },
                {
                  title: "Google First",
                  value: "google-first",
                  description: "Prioritize Google Nano Banana whenever available.",
                },
              ],
              onBack: openRouting,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "strategy"], value),
                  "Updated Image Bus routing strategy",
                  openRouting,
                ),
            })
            return
          }
          openBooleanDialog({
            title: "Image Bus Routing",
            current: option.value === "force_google_for_scientific" ? forceScientific : allowGeneral,
            trueLabel: "Enable",
            falseLabel: "Disable",
            onBack: openRouting,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...basePath, option.value], value),
                `Updated ${option.value.replaceAll("_", " ")}`,
                openRouting,
              ),
          })
        },
      })
    )
  }

  const openImageBus = () => {
    const config = effectiveRecord()
    const enabled = getNestedBoolean(config, ["image_bus", "enabled"])
    const reviewWithMainModel = getNestedBoolean(config, ["image_bus", "review_with_main_model"])
    const defaultOutputFormat = getNestedString(config, ["image_bus", "default_output_format"]) as
      | "svg"
      | "png"
      | "pdf"
      | undefined

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "OpenAgent Image Bus Settings",
        options: [
          {
            title: "Scope",
            value: "scope",
            description: `${scope} • ${scopePath()}`,
          },
          {
            title: "Enabled",
            value: "enabled",
            description: booleanLabel(enabled),
          },
          {
            title: "Review With Main Model",
            value: "review_with_main_model",
            description: booleanLabel(reviewWithMainModel),
          },
          {
            title: "Default Output Format",
            value: "default_output_format",
            description: stringLabel(defaultOutputFormat, "svg"),
          },
          {
            title: "Context Memory",
            value: "context_memory",
            description: "Configure carry-over prompt memory and history length.",
          },
          {
            title: "Routing",
            value: "routing",
            description: "Choose provider routing strategy and Google routing rules.",
          },
          {
            title: "Providers",
            value: "providers",
            description: "Configure Google Nano Banana, ComfyUI, and Stable Diffusion.",
          },
          {
            title: "Back",
            value: "back",
            description: "Return to the main settings page.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("root")
            return
          }
          if (option.value === "scope") {
            openScopeDialog(openImageBus)
            return
          }
          if (option.value === "context_memory") {
            openContextMemory()
            return
          }
          if (option.value === "routing") {
            openRouting()
            return
          }
          if (option.value === "providers") {
            openProviders()
            return
          }
          if (option.value === "default_output_format") {
            openEnumDialog({
              title: "Default Output Format",
              current: defaultOutputFormat,
              choices: [
                { title: "SVG", value: "svg" },
                { title: "PNG", value: "png" },
                { title: "PDF", value: "pdf" },
              ],
              onBack: openImageBus,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["image_bus", "default_output_format"], value),
                  "Updated Image Bus default output format",
                  openImageBus,
                ),
            })
            return
          }
          openBooleanDialog({
            title: "Image Bus",
            current: option.value === "enabled" ? enabled : reviewWithMainModel,
            trueLabel: "Enable",
            falseLabel: "Disable",
            onBack: openImageBus,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["image_bus", option.value], value),
                `Updated image bus ${option.value.replaceAll("_", " ")}`,
                openImageBus,
              ),
          })
        },
      })
    )
  }

  const openGeneral = () => {
    const config = effective()
    const configRecord = config as unknown as Record<string, unknown>
    const profile = getNestedString(configRecord, ["experimental", "context_guard_profile"]) as
      | "conservative"
      | "balanced"
      | "aggressive"
      | undefined
    const bioVisible = isBioAgentsVisible(config)

    api.ui.dialog.setSize("large")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "OpenAgent General Settings",
        options: [
          {
            title: "Scope",
            value: "scope",
            description: `${scope} • ${scopePath()}`,
          },
          {
            title: "Context Guard Profile",
            value: "context_guard_profile",
            description: stringLabel(profile, "balanced"),
          },
          {
            title: "Bio Agents Visibility",
            value: "bio_agents_visible",
            description: bioVisible ? "Visible" : "Hidden",
          },
          {
            title: "Back",
            value: "back",
            description: "Return to the main settings page.",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("root")
            return
          }
          if (option.value === "scope") {
            openScopeDialog(openGeneral)
            return
          }
          if (option.value === "context_guard_profile") {
            openEnumDialog({
              title: "Context Guard Profile",
              current: profile,
              choices: [
                {
                  title: "Conservative",
                  value: "conservative",
                  description: "Later reminders and later auto-compaction.",
                },
                {
                  title: "Balanced",
                  value: "balanced",
                  description: "Current recommended default.",
                },
                {
                  title: "Aggressive",
                  value: "aggressive",
                  description: "Earlier reminders and earlier auto-compaction.",
                },
              ],
              onBack: openGeneral,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["experimental", "context_guard_profile"], value),
                  "Updated context guard profile",
                  openGeneral,
                ),
            })
            return
          }
          openBooleanDialog({
            title: "Bio Agents Visibility",
            current: bioVisible,
            trueLabel: "Show bio agents",
            falseLabel: "Hide bio agents",
            onBack: openGeneral,
            onConfirm: (value) =>
              save(
                (root) => setBioAgentsVisible(root, value),
                "Updated bio agent visibility",
                openGeneral,
              ),
          })
        },
      })
    )
  }

  const openRoot = (entry: SettingsEntry = "root") => {
    if (entry === "general") {
      openGeneral()
      return
    }
    if (entry === "image-bus") {
      openImageBus()
      return
    }

    const config = effective()
    const configRecord = config as unknown as Record<string, unknown>
    const imageBusEnabled = getNestedBoolean(configRecord, ["image_bus", "enabled"])
    const profile = getNestedString(configRecord, ["experimental", "context_guard_profile"])

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: "OpenAgent Labforge Settings",
        options: [
          {
            title: "Scope",
            value: "scope",
            description: `${scope} • ${scopePath()}`,
          },
          {
            title: "General",
            value: "general",
            description: `Context guard: ${stringLabel(profile, "balanced")} • Bio agents: ${isBioAgentsVisible(config) ? "visible" : "hidden"}`,
          },
          {
            title: "Image Bus",
            value: "image-bus",
            description: `Image routing: ${booleanLabel(imageBusEnabled)} • Configure Google Nano Banana, ComfyUI, and Stable Diffusion.`,
          },
        ],
        onSelect: (option) => {
          if (option.value === "scope") {
            openScopeDialog(openRoot)
            return
          }
          if (option.value === "general") {
            openGeneral()
            return
          }
          openImageBus()
        },
      })
    )
  }

  return {
    openRoot,
  }
}
