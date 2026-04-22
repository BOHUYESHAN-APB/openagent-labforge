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
import {
  DEFAULT_COMFYUI_BASE_URL,
  DEFAULT_COMFYUI_WORKFLOW_ENDPOINT,
  DEFAULT_GOOGLE_BASE_URL,
  DEFAULT_STABLE_DIFFUSION_BASE_URL,
  DEFAULT_STABLE_DIFFUSION_TXT2IMG_ENDPOINT,
} from "./image-bus-defaults"
import {
  getContextGuardThresholdDisplay,
  resolveContextGuardProfile,
} from "../hooks/context-guard-threshold-profile"

const SETTINGS_SCOPE_KEY = "openagent-labforge.settings.scope"
const SETTINGS_LANGUAGE_KEY = "openagent-labforge.settings.language"
const SETTINGS_SELECT_PLACEHOLDER = "Filter settings • Enter select • Esc close"
const SETTINGS_SUBPAGE_PLACEHOLDER = "Filter options • Enter confirm • Esc close"

type SettingsEntry = "root" | "general" | "runtime" | "image-bus" | "agent-display" | "context-guard" | "swarm"
type UiLanguage = "en" | "zh"

type ProviderKey = "google_nano_banana" | "comfyui" | "stable_diffusion"

type EnumChoice<Value extends string> = {
  title: string
  value: Value
  description?: string
}

function booleanLabel(value: boolean | undefined, trueLabel = "✓ Enabled", falseLabel = "○ Disabled"): string {
  return value === true ? trueLabel : falseLabel
}

function stringLabel(value: string | undefined, fallback = "Not set"): string {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

function configuredOrDefaultLabel(value: string | undefined, defaultValue: string): string {
  const trimmed = value?.trim()
  if (trimmed && trimmed.length > 0) {
    return trimmed
  }
  return `default: ${defaultValue}`
}

function numberLabel(value: number | undefined, fallback = "Not set"): string {
  return typeof value === "number" ? String(value) : fallback
}

function settingsPromptDescription(note: string): string {
  return note
}

function compactPathLabel(value: string, max = 44): string {
  if (value.length <= max) return value
  return `...${value.slice(-(max - 3))}`
}

function formatCompactTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

function summaryRow(
  title: string,
  description: string | undefined,
  category: string,
): TuiDialogSelectOption<string> {
  return {
    title,
    value: `__section__${title.toLowerCase().replace(/\s+/g, "_")}`,
    description,
    category,
    disabled: true,
  }
}

export function createSettingsController(api: TuiPluginApi, directory: string) {
  let scope: SettingsScope = api.kv.get<SettingsScope>(SETTINGS_SCOPE_KEY, "project") === "user" ? "user" : "project"
  let uiLanguage: UiLanguage = (() => {
    const stored = api.kv.get<string | undefined>(SETTINGS_LANGUAGE_KEY, undefined)
    if (stored === "zh" || stored === "en") {
      return stored
    }
    const configLanguage = getNestedString(readEffectiveConfig(directory) as unknown as Record<string, unknown>, ["i18n", "language"])
    return configLanguage?.toLowerCase().startsWith("zh") ? "zh" : "en"
  })()

  const text = (en: string, zh: string): string => uiLanguage === "zh" ? zh : en
  const statusLabel = (value: boolean | undefined): string =>
    booleanLabel(value, text("✓ Enabled", "✓ 启用"), text("○ Disabled", "○ 禁用"))
  const stringValueLabel = (value: string | undefined, fallbackEn = "Not set", fallbackZh = "未设置"): string =>
    stringLabel(value, text(fallbackEn, fallbackZh))
  const numberValueLabel = (value: number | undefined, fallbackEn = "Not set", fallbackZh = "未设置"): string =>
    numberLabel(value, text(fallbackEn, fallbackZh))

  const toast = (message: string, variant: "success" | "warning" | "error" | "info" = "success") => {
    api.ui.toast({
      title: text("OpenAgent Settings", "OpenAgent 设置"),
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

  const persistLanguage = (next: UiLanguage) => {
    uiLanguage = next
    api.kv.set(SETTINGS_LANGUAGE_KEY, next)
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
    api.ui.dialog.replace(
      () =>
        api.ui.DialogPrompt({
          title: args.title,
          value: args.value ?? "",
          placeholder: args.placeholder ?? text("Leave blank to clear", "留空表示清空"),
          onConfirm: (value) => {
            const trimmed = value.trim()
            args.onConfirm(trimmed.length > 0 ? trimmed : undefined)
          },
          onCancel: args.onCancel,
        }),
      args.onCancel,
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
    api.ui.dialog.replace(
      () =>
        api.ui.DialogPrompt({
          title: args.title,
          value: args.value !== undefined ? String(args.value) : "",
          placeholder: args.placeholder ?? text(`${args.min}-${args.max}`, `${args.min}-${args.max}`),
          onConfirm: (value) => {
            const trimmed = value.trim()
            const parsed = Number(trimmed)
            if (!Number.isInteger(parsed) || parsed < args.min || parsed > args.max) {
              toast(text(`Enter an integer between ${args.min} and ${args.max}.`, `请输入 ${args.min} 到 ${args.max} 之间的整数。`), "warning")
              openNumberPrompt(args)
              return
            }
            args.onConfirm(parsed)
          },
          onCancel: args.onCancel,
        }),
      args.onCancel,
    )
  }

  const openTokenPrompt = (args: {
    title: string
    value: number | undefined
    placeholder?: string
    min: number
    max: number
    onConfirm: (value: number) => void
    onCancel: () => void
  }) => {
    // Helper function to parse K/M units
    const parseTokenValue = (input: string): number | null => {
      const trimmed = input.trim().toUpperCase()

      // Try K suffix (e.g., "200K" -> 200000)
      const kMatch = trimmed.match(/^(\d+(?:\.\d+)?)K$/)
      if (kMatch) {
        return Math.round(parseFloat(kMatch[1]) * 1000)
      }

      // Try M suffix (e.g., "1.5M" -> 1500000)
      const mMatch = trimmed.match(/^(\d+(?:\.\d+)?)M$/)
      if (mMatch) {
        return Math.round(parseFloat(mMatch[1]) * 1_000_000)
      }

      // Try plain number
      const num = Number(trimmed)
      if (!isNaN(num) && Number.isInteger(num)) {
        return num
      }

      return null
    }

    // Helper function to format number for display
    const formatTokenValue = (value: number): string => {
      if (value >= 1_000_000 && value % 1_000_000 === 0) {
        return `${value / 1_000_000}M`
      }
      if (value >= 1_000 && value % 1_000 === 0) {
        return `${value / 1_000}K`
      }
      return String(value)
    }

    api.ui.dialog.replace(
      () =>
        api.ui.DialogPrompt({
          title: args.title,
          value: args.value !== undefined ? formatTokenValue(args.value) : "",
          placeholder: args.placeholder ?? text("e.g., 200K, 1.5M, or 150000", "例如：200K、1.5M 或 150000"),
          onConfirm: (value) => {
            const parsed = parseTokenValue(value)
            if (parsed === null || parsed < args.min || parsed > args.max) {
              const minFormatted = formatTokenValue(args.min)
              const maxFormatted = formatTokenValue(args.max)
              toast(text(`Enter a valid token count between ${minFormatted} and ${maxFormatted}.`, `请输入 ${minFormatted} 到 ${maxFormatted} 之间的有效 token 数量。`), "warning")
              openTokenPrompt(args)
              return
            }
            args.onConfirm(parsed)
          },
          onCancel: args.onCancel,
        }),
      args.onCancel,
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
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        current: args.current,
        options: [
          ...args.choices.map<TuiDialogSelectOption<Value>>((choice) => ({
            title: choice.title,
            value: choice.value,
            description: choice.description,
          })),
          {
            title: text("Back", "返回"),
            value: "__back__" as Value,
            description: text("Return without changing this setting.", "不修改当前设置并返回。"),
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
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        current: args.current === undefined ? undefined : args.current ? "true" : "false",
        options: [
          {
            title: args.trueLabel,
            value: "true",
            description: text("Apply this setting now.", "立即应用这个设置。"),
          },
          {
            title: args.falseLabel,
            value: "false",
            description: text("Apply this setting now.", "立即应用这个设置。"),
          },
          {
            title: text("Back", "返回"),
            value: "__back__",
            description: text("Return without changing this setting.", "不修改当前设置并返回。"),
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

  const openStringDialog = (args: {
    title: string
    current: string | undefined
    placeholder: string
    onConfirm: (value: string) => void
    onBack: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogPrompt({
        title: args.title,
        placeholder: args.placeholder,
        value: args.current || "",
        onConfirm: args.onConfirm,
        onCancel: args.onBack,
      })
    )
  }

  const openNumberDialog = (args: {
    title: string
    current: number | undefined
    placeholder: string
    onConfirm: (value: string) => void
    onBack: () => void
  }) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogPrompt({
        title: args.title,
        placeholder: args.placeholder,
        value: args.current !== undefined ? String(args.current) : "",
        onConfirm: args.onConfirm,
        onCancel: args.onBack,
      })
    )
  }

  const openScopeDialog = (onBack: () => void) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Settings Scope", "设置作用域"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        current: scope,
        options: [
          summaryRow(text("Current Scope", "当前作用域"), text("Choose where future edits are written.", "选择设置写入到哪里。"), text("Current", "当前")),
          {
            title: text("Project", "项目"),
            value: "project",
            category: text("Targets", "目标"),
            description: compactPathLabel(resolveScopeConfigPath("project", directory)),
          },
          {
            title: text("User", "用户"),
            value: "user",
            category: text("Targets", "目标"),
            description: compactPathLabel(resolveScopeConfigPath("user", directory)),
          },
          {
            title: text("Back", "返回"),
            value: "__back__",
            category: text("Navigation", "导航"),
            description: text("Return to the previous settings page.", "返回上一层设置页。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "__back__") {
            onBack()
            return
          }
          persistScope(option.value === "user" ? "user" : "project")
          toast(text(`Settings scope switched to ${scope}.`, `设置作用域已切换为 ${scope}。`), "info")
          onBack()
        },
      })
    )
  }

  const openLanguageDialog = (onBack: () => void) => {
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Language", "语言"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        current: uiLanguage,
        options: [
          summaryRow(text("Current Language", "当前语言"), text("Choose the settings UI language.", "选择设置界面语言。"), text("Current", "当前")),
          {
            title: text("English / 中文", "English / 英文"),
            value: "en",
            category: text("Languages", "语言"),
            description: text("English interface", "英文界面"),
          },
          {
            title: text("中文 / English", "中文 / English"),
            value: "zh",
            category: text("Languages", "语言"),
            description: text("Chinese interface", "中文界面"),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the previous settings page.", "返回上一层设置页。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            onBack()
            return
          }
          const nextLanguage = option.value === "zh" ? "zh" : "en"
          persistLanguage(nextLanguage)
          save(
            (root) => setNestedValue(root, ["i18n", "language"], nextLanguage === "zh" ? "zh-CN" : "en"),
            text("Updated settings language", "已更新设置语言"),
            onBack,
          )
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
        title: text("Google Nano Banana", "Google Nano Banana"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Provider Status", "通道状态"), statusLabel(enabled), text("Current", "当前")),
          {
            title: text("Toggle Enabled", "切换启用"),
            value: "enabled",
            category: text("Core", "核心"),
            description: statusLabel(enabled),
          },
          {
            title: text("Set Base URL", "设置 Base URL"),
            value: "base_url",
            category: text("Fields", "字段"),
            description: configuredOrDefaultLabel(baseUrl, DEFAULT_GOOGLE_BASE_URL),
          },
          {
            title: text("Set Generate Endpoint", "设置生成接口"),
            value: "endpoint",
            category: text("Fields", "字段"),
            description: stringValueLabel(endpoint),
          },
          {
            title: text("Set API Key Env", "设置 API Key 环境变量"),
            value: "api_key_env",
            category: text("Fields", "字段"),
            description: stringValueLabel(apiKeyEnv),
          },
          {
            title: text("Set Model", "设置模型"),
            value: "model",
            category: text("Fields", "字段"),
            description: stringValueLabel(model),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus providers.", "返回图片总线提供方页面。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: text("Google Nano Banana", "Google Nano Banana"),
              current: enabled,
              trueLabel: text("Enable provider", "启用提供方"),
              falseLabel: text("Disable provider", "禁用提供方"),
              onBack: openGoogleProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  text("Updated Google Nano Banana enabled flag", "已更新 Google Nano Banana 启用状态"),
                  openGoogleProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: text("Google Nano Banana Base URL", "Google Nano Banana Base URL"),
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            endpoint: {
              title: text("Google Nano Banana Generate Endpoint", "Google Nano Banana 生成接口"),
              value: endpoint,
              path: [...basePath, "generate_endpoint"],
            },
            api_key_env: {
              title: text("Google Nano Banana API Key Env", "Google Nano Banana API Key 环境变量"),
              value: apiKeyEnv,
              path: [...basePath, "api_key_env"],
            },
            model: {
              title: text("Google Nano Banana Model", "Google Nano Banana 模型"),
              value: model,
              path: [...basePath, "model"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: text("Leave blank to clear", "留空表示清空"),
            onCancel: openGoogleProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                text(`Updated ${prompt.title}`, `已更新 ${prompt.title}`),
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
    const apiKeyEnv = getNestedString(config, [...basePath, "api_key_env"])
    const outputDir = getNestedString(config, [...basePath, "output_dir"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("ComfyUI", "ComfyUI"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Provider Status", "通道状态"), statusLabel(enabled), text("Current", "当前")),
          {
            title: text("Toggle Enabled", "切换启用"),
            value: "enabled",
            category: text("Core", "核心"),
            description: statusLabel(enabled),
          },
          {
            title: text("Set Base URL", "设置 Base URL"),
            value: "base_url",
            category: text("Fields", "字段"),
            description: configuredOrDefaultLabel(baseUrl, DEFAULT_COMFYUI_BASE_URL),
          },
          {
            title: text("Set Workflow Endpoint", "设置工作流接口"),
            value: "workflow_endpoint",
            category: text("Fields", "字段"),
            description: configuredOrDefaultLabel(endpoint, DEFAULT_COMFYUI_WORKFLOW_ENDPOINT),
          },
          {
            title: text("Set API Key Env", "设置 API Key 环境变量"),
            value: "api_key_env",
            category: text("Fields", "字段"),
            description: stringValueLabel(apiKeyEnv),
          },
          {
            title: text("Set Output Directory", "设置输出目录"),
            value: "output_dir",
            category: text("Fields", "字段"),
            description: stringValueLabel(outputDir),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus providers.", "返回图片总线提供方页面。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: text("ComfyUI", "ComfyUI"),
              current: enabled,
              trueLabel: text("Enable provider", "启用提供方"),
              falseLabel: text("Disable provider", "禁用提供方"),
              onBack: openComfyUiProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  text("Updated ComfyUI enabled flag", "已更新 ComfyUI 启用状态"),
                  openComfyUiProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: text("ComfyUI Base URL", "ComfyUI Base URL"),
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            workflow_endpoint: {
              title: text("ComfyUI Workflow Endpoint", "ComfyUI 工作流接口"),
              value: endpoint,
              path: [...basePath, "workflow_endpoint"],
            },
            api_key_env: {
              title: text("ComfyUI API Key Env", "ComfyUI API Key 环境变量"),
              value: apiKeyEnv,
              path: [...basePath, "api_key_env"],
            },
            output_dir: {
              title: text("ComfyUI Output Directory", "ComfyUI 输出目录"),
              value: outputDir,
              path: [...basePath, "output_dir"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: text("Leave blank to clear", "留空表示清空"),
            onCancel: openComfyUiProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                text(`Updated ${prompt.title}`, `已更新 ${prompt.title}`),
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
        title: text("Stable Diffusion", "Stable Diffusion"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Provider Status", "通道状态"), statusLabel(enabled), text("Current", "当前")),
          {
            title: text("Toggle Enabled", "切换启用"),
            value: "enabled",
            category: text("Core", "核心"),
            description: statusLabel(enabled),
          },
          {
            title: text("Set Base URL", "设置 Base URL"),
            value: "base_url",
            category: text("Fields", "字段"),
            description: configuredOrDefaultLabel(baseUrl, DEFAULT_STABLE_DIFFUSION_BASE_URL),
          },
          {
            title: text("Set Txt2Img Endpoint", "设置 Txt2Img 接口"),
            value: "txt2img_endpoint",
            category: text("Fields", "字段"),
            description: configuredOrDefaultLabel(endpoint, DEFAULT_STABLE_DIFFUSION_TXT2IMG_ENDPOINT),
          },
          {
            title: text("Set API Key Env", "设置 API Key 环境变量"),
            value: "api_key_env",
            category: text("Fields", "字段"),
            description: stringValueLabel(apiKeyEnv),
          },
          {
            title: text("Set Model", "设置模型"),
            value: "model",
            category: text("Fields", "字段"),
            description: stringValueLabel(model),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus providers.", "返回图片总线提供方页面。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openProviders()
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: text("Stable Diffusion", "Stable Diffusion"),
              current: enabled,
              trueLabel: text("Enable provider", "启用提供方"),
              falseLabel: text("Disable provider", "禁用提供方"),
              onBack: openStableDiffusionProvider,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "enabled"], value),
                  text("Updated Stable Diffusion enabled flag", "已更新 Stable Diffusion 启用状态"),
                  openStableDiffusionProvider,
                ),
            })
            return
          }

          const prompts = {
            base_url: {
              title: text("Stable Diffusion Base URL", "Stable Diffusion Base URL"),
              value: baseUrl,
              path: [...basePath, "base_url"],
            },
            txt2img_endpoint: {
              title: text("Stable Diffusion Txt2Img Endpoint", "Stable Diffusion Txt2Img 接口"),
              value: endpoint,
              path: [...basePath, "txt2img_endpoint"],
            },
            api_key_env: {
              title: text("Stable Diffusion API Key Env", "Stable Diffusion API Key 环境变量"),
              value: apiKeyEnv,
              path: [...basePath, "api_key_env"],
            },
            model: {
              title: text("Stable Diffusion Model", "Stable Diffusion 模型"),
              value: model,
              path: [...basePath, "model"],
            },
          } as const

          const prompt = prompts[option.value as keyof typeof prompts]
          openStringPrompt({
            title: prompt.title,
            value: prompt.value,
            placeholder: text("Leave blank to clear", "留空表示清空"),
            onCancel: openStableDiffusionProvider,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...prompt.path], value),
                text(`Updated ${prompt.title}`, `已更新 ${prompt.title}`),
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
        title: text("Image Bus Providers", "图片总线提供方"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Provider Pages", "提供方页面"), text("Select a provider page to edit its fields.", "选择一个提供方页面进入详细配置。"), text("Current", "当前")),
          {
            title: text("Configure Google Nano Banana", "配置 Google Nano Banana"),
            value: "google_nano_banana",
            category: text("Providers", "提供方"),
            description: describeProvider("google_nano_banana"),
          },
          {
            title: text("Configure ComfyUI", "配置 ComfyUI"),
            value: "comfyui",
            category: text("Providers", "提供方"),
            description: describeProvider("comfyui"),
          },
          {
            title: text("Configure Stable Diffusion", "配置 Stable Diffusion"),
            value: "stable_diffusion",
            category: text("Providers", "提供方"),
            description: describeProvider("stable_diffusion"),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus settings.", "返回图片总线设置。"),
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

  const openSubscription = () => {
    const config = effectiveRecord()
    const basePath = ["image_bus", "subscription"]
    const mode = getNestedString(config, [...basePath, "mode"]) as "self-managed" | "disabled" | undefined
    const planName = getNestedString(config, [...basePath, "plan_name"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Image Bus Subscription", "图片总线订阅"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Subscription", "当前订阅"),
            `${stringValueLabel(mode, "disabled", "disabled")} • ${stringValueLabel(planName, "No plan label", "无套餐标签")}`,
            text("Current", "当前"),
          ),
          {
            title: text("Choose Subscription Mode", "选择订阅模式"),
            value: "mode",
            category: text("Core", "核心"),
            description: stringValueLabel(mode, "disabled", "disabled"),
          },
          {
            title: text("Set Plan Label", "设置套餐标签"),
            value: "plan_name",
            category: text("Fields", "字段"),
            description: stringValueLabel(planName, "No plan label", "无套餐标签"),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus settings.", "返回图片总线设置。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }

          if (option.value === "mode") {
            openEnumDialog({
              title: text("Subscription Mode", "订阅模式"),
              current: mode,
              choices: [
                {
                  title: text("Self Managed", "自管理"),
                  value: "self-managed",
                  description: text("Use your own paid provider or relay path.", "使用你自己的付费提供方或中转链路。"),
                },
                {
                  title: text("Disabled", "禁用"),
                  value: "disabled",
                  description: text("Disable provider-subscription routing.", "禁用提供方订阅路由。"),
                },
              ],
              onBack: openSubscription,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "mode"], value),
                  text("Updated image bus subscription mode", "已更新图片总线订阅模式"),
                  openSubscription,
                ),
            })
            return
          }

          openStringPrompt({
            title: text("Image Bus Plan Label", "图片总线套餐标签"),
            value: planName,
            placeholder: text("google-banana-pro", "google-banana-pro"),
            onCancel: openSubscription,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...basePath, "plan_name"], value),
                text("Updated image bus plan label", "已更新图片总线套餐标签"),
                openSubscription,
              ),
          })
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
        title: text("Image Bus Context Memory", "图片总线上下文记忆"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Memory", "当前记忆状态"),
            `${text("Enabled", "启用")}: ${statusLabel(enabled)} • ${text("Max turns", "最大轮数")}: ${numberValueLabel(maxTurns)}`,
            text("Current", "当前"),
          ),
          {
            title: text("Toggle Enabled", "切换启用"),
            value: "enabled",
            category: text("Core", "核心"),
            description: statusLabel(enabled),
          },
          {
            title: text("Toggle Prompt Carryover", "切换 Prompt 续带"),
            value: "carry_prompt_context",
            category: text("Core", "核心"),
            description: statusLabel(carryPrompt),
          },
          {
            title: text("Set Max History Turns", "设置最大历史轮数"),
            value: "max_history_turns",
            category: text("Core", "核心"),
            description: numberValueLabel(maxTurns),
          },
          {
            title: text("Toggle Decision Trace", "切换决策轨迹"),
            value: "include_provider_decision_trace",
            category: text("Advanced", "高级"),
            description: statusLabel(trace),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus settings.", "返回图片总线设置。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }
          if (option.value === "max_history_turns") {
            openNumberPrompt({
              title: text("Max History Turns", "最大历史轮数"),
              value: maxTurns,
              placeholder: text("0-20", "0-20"),
              min: 0,
              max: 20,
              onCancel: openContextMemory,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "max_history_turns"], value),
                  text("Updated Image Bus context memory history length", "已更新图片总线上下文记忆轮数"),
                  openContextMemory,
                ),
            })
            return
          }
          openBooleanDialog({
            title: text("Image Bus Context Memory", "图片总线上下文记忆"),
            current:
              option.value === "enabled"
                ? enabled
                : option.value === "carry_prompt_context"
                  ? carryPrompt
                  : trace,
            trueLabel: text("Enable", "启用"),
            falseLabel: text("Disable", "禁用"),
            onBack: openContextMemory,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...basePath, option.value], value),
                text(`Updated ${option.value.replaceAll("_", " ")}`, `已更新 ${option.value.replaceAll("_", " ")}`),
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
        title: text("Image Bus Routing", "图片总线路由"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Current Strategy", "当前策略"), stringValueLabel(strategy, "balanced", "balanced"), text("Current", "当前")),
          {
            title: text("Choose Strategy", "选择策略"),
            value: "strategy",
            category: text("Core", "核心"),
            description: stringValueLabel(strategy, "balanced", "balanced"),
          },
          {
            title: text("Toggle Scientific Google Route", "切换科研 Google 路由"),
            value: "force_google_for_scientific",
            category: text("Advanced", "高级"),
            description: statusLabel(forceScientific),
          },
          {
            title: text("Toggle General Google Route", "切换通用 Google 路由"),
            value: "allow_google_for_general",
            category: text("Advanced", "高级"),
            description: statusLabel(allowGeneral),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to Image Bus settings.", "返回图片总线设置。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openImageBus()
            return
          }
          if (option.value === "strategy") {
            openEnumDialog({
              title: text("Image Bus Routing Strategy", "图片总线路由策略"),
              current: strategy,
              choices: [
                {
                  title: text("Local First", "本地优先"),
                  value: "local-first",
                  description: text("Prefer local ComfyUI/Stable Diffusion when possible.", "优先使用本地 ComfyUI / Stable Diffusion。"),
                },
                {
                  title: text("Balanced", "均衡"),
                  value: "balanced",
                  description: text("Use local and Google providers more evenly.", "更均衡地使用本地与 Google 提供方。"),
                },
                {
                  title: text("Google First", "Google 优先"),
                  value: "google-first",
                  description: text("Prioritize Google Nano Banana whenever available.", "只要可用就优先使用 Google Nano Banana。"),
                },
              ],
              onBack: openRouting,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, [...basePath, "strategy"], value),
                  text("Updated Image Bus routing strategy", "已更新图片总线路由策略"),
                  openRouting,
                ),
            })
            return
          }
          openBooleanDialog({
            title: text("Image Bus Routing", "图片总线路由"),
            current: option.value === "force_google_for_scientific" ? forceScientific : allowGeneral,
            trueLabel: text("Enable", "启用"),
            falseLabel: text("Disable", "禁用"),
            onBack: openRouting,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, [...basePath, option.value], value),
                text(`Updated ${option.value.replaceAll("_", " ")}`, `已更新 ${option.value.replaceAll("_", " ")}`),
                openRouting,
              ),
          })
        },
      })
    )
  }

  const openAgentDisplay = () => {
    const config = effectiveRecord()
    const displayMode = getNestedString(config, ["agent_display", "agent_display_mode"]) as "minimal" | "standard" | undefined
    const bioEnabled = getNestedBoolean(config, ["agent_display", "enable_domains", "bioinformatics"])
    const engEnabled = getNestedBoolean(config, ["agent_display", "enable_domains", "engineering"])
    const hideUpstream = getNestedBoolean(config, ["agent_display", "hide_upstream_commands"])

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Agent Display Settings", "Agent 显示设置"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(
            text("Agent Display Status", "Agent 显示状态"),
            `${text("Mode", "模式")}: ${displayMode || "minimal"} • ${text("Bio", "生信")}: ${booleanLabel(bioEnabled !== false)} • ${text("Eng", "工程")}: ${booleanLabel(engEnabled !== false)}`,
            text("Current", "当前"),
          ),
          {
            title: text("Scope", "作用域"),
            value: "scope",
            category: text("Core", "核心"),
            description: `${scope} • ${compactPathLabel(scopePath())}`,
          },
          {
            title: text("Display Mode", "显示模式"),
            value: "display_mode",
            category: text("Core", "核心"),
            description: `${displayMode || "minimal"} (${displayMode === "standard" ? "8" : "6"} agents)`,
          },
          {
            title: text("Bioinformatics Domain", "生物信息学领域"),
            value: "bio_domain",
            category: text("Domains", "领域"),
            description: booleanLabel(bioEnabled !== false, text("✓ Enabled", "✓ 启用"), text("○ Disabled", "○ 禁用")),
          },
          {
            title: text("Engineering Domain", "工程领域"),
            value: "eng_domain",
            category: text("Domains", "领域"),
            description: booleanLabel(engEnabled !== false, text("✓ Enabled", "✓ 启用"), text("○ Disabled", "○ 禁用")),
          },
          {
            title: text("Hide Upstream Commands", "隐藏上游命令"),
            value: "hide_upstream",
            category: text("Advanced", "高级"),
            description: booleanLabel(hideUpstream !== false, text("✓ Hidden (plan, build)", "✓ 隐藏 (plan, build)"), text("○ Visible (plan, build)", "○ 可见 (plan, build)")),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the main settings page.", "返回设置主页。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("root")
            return
          }
          if (option.value === "scope") {
            openScopeDialog(openAgentDisplay)
            return
          }
          if (option.value === "display_mode") {
            openEnumDialog({
              title: text("Agent Display Mode", "Agent 显示模式"),
              current: displayMode || "minimal",
              choices: [
                {
                  title: text("Minimal (6 agents)", "精简 (6 个)"),
                  value: "minimal",
                  description: text("Core agents: sisyphus, prometheus, orchestrator, wase, atlas, bio-autopilot", "核心 agents：智能调度、任务规划、智能编排、全自动执行、计划执行、生信全自动"),
                },
                {
                  title: text("Standard (8 agents)", "标准 (8 个)"),
                  value: "standard",
                  description: text("Minimal + hephaestus (deep), bio-pipeline-operator (bio execution)", "精简 + 深度开发、生信流程"),
                },
              ],
              onBack: openAgentDisplay,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["agent_display", "agent_display_mode"], value),
                  text("Updated agent display mode", "已更新 agent 显示模式"),
                  openAgentDisplay,
                ),
            })
            return
          }
          if (option.value === "bio_domain") {
            openBooleanDialog({
              title: text("Bioinformatics Domain", "生物信息学领域"),
              current: bioEnabled !== false,
              trueLabel: text("✓ Enabled", "✓ 启用"),
              falseLabel: text("○ Disabled", "○ 禁用"),
              onBack: openAgentDisplay,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["agent_display", "enable_domains", "bioinformatics"], value),
                  text("Updated bioinformatics domain", "已更新生物信息学领域"),
                  openAgentDisplay,
                ),
            })
            return
          }
          if (option.value === "eng_domain") {
            openBooleanDialog({
              title: text("Engineering Domain", "工程领域"),
              current: engEnabled !== false,
              trueLabel: text("✓ Enabled", "✓ 启用"),
              falseLabel: text("○ Disabled", "○ 禁用"),
              onBack: openAgentDisplay,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["agent_display", "enable_domains", "engineering"], value),
                  text("Updated engineering domain", "已更新工程领域"),
                  openAgentDisplay,
                ),
            })
            return
          }
          openBooleanDialog({
            title: text("Hide Upstream Commands", "隐藏上游命令"),
            current: hideUpstream !== false,
            trueLabel: text("✓ Hidden (plan, build)", "✓ 隐藏 (plan, build)"),
            falseLabel: text("○ Visible (plan, build)", "○ 可见 (plan, build)"),
            onBack: openAgentDisplay,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["agent_display", "hide_upstream_commands"], value),
                text("Updated upstream commands visibility", "已更新上游命令可见性"),
                openAgentDisplay,
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
        title: text("OpenAgent Image Bus Settings", "OpenAgent 图片总线设置"),
        placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
        options: [
          summaryRow(text("Current Scope", "当前作用域"), `${scope} • ${compactPathLabel(scopePath())}`, text("Current", "当前")),
          summaryRow(text("Current Core State", "当前核心状态"), `${text("Image bus", "图片总线")}: ${booleanLabel(enabled)} • ${text("Review", "复核")}: ${booleanLabel(reviewWithMainModel)}`, text("Current", "当前")),
          {
            title: text("Scope", "作用域"),
            value: "scope",
            category: text("Core", "核心"),
            description: `${scope} • ${compactPathLabel(scopePath())}`,
          },
          {
            title: text("Toggle Image Bus", "切换图片总线"),
            value: "enabled",
            category: text("Core", "核心"),
            description: statusLabel(enabled),
          },
          {
            title: text("Toggle Main-Model Review", "切换主模型复核"),
            value: "review_with_main_model",
            category: text("Core", "核心"),
            description: statusLabel(reviewWithMainModel),
          },
          {
            title: text("Choose Output Format", "选择输出格式"),
            value: "default_output_format",
            category: text("Core", "核心"),
            description: stringValueLabel(defaultOutputFormat, "svg", "svg"),
          },
          {
            title: text("Configure Context Memory", "配置上下文记忆"),
            value: "context_memory",
            category: text("Advanced", "高级"),
            description: text("Prompt carryover, history turns, and trace options.", "Prompt 续带、历史轮数和决策轨迹。"),
          },
          {
            title: text("Configure Routing", "配置路由策略"),
            value: "routing",
            category: text("Advanced", "高级"),
            description: text("Strategy plus scientific/general Google routing rules.", "策略与科研/通用 Google 路由规则。"),
          },
          {
            title: text("Configure Subscription", "配置订阅信息"),
            value: "subscription",
            category: text("Advanced", "高级"),
            description: text("Subscription mode and plan label for paid image routing.", "付费图片路由的订阅模式和套餐标签。"),
          },
          {
            title: text("Configure Providers", "配置通道提供方"),
            value: "providers",
            category: text("Advanced", "高级"),
            description: text("Google Nano Banana, ComfyUI, and Stable Diffusion.", "Google、ComfyUI 与 Stable Diffusion。"),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the main settings page.", "返回设置主页。"),
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
          if (option.value === "subscription") {
            openSubscription()
            return
          }
          if (option.value === "providers") {
            openProviders()
            return
          }
          if (option.value === "default_output_format") {
            openEnumDialog({
              title: text("Default Output Format", "默认输出格式"),
              current: defaultOutputFormat,
              choices: [
                { title: text("SVG", "SVG"), value: "svg" },
                { title: text("PNG", "PNG"), value: "png" },
                { title: text("PDF", "PDF"), value: "pdf" },
              ],
              onBack: openImageBus,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["image_bus", "default_output_format"], value),
                  text("Updated Image Bus default output format", "已更新图片总线默认输出格式"),
                  openImageBus,
                ),
            })
            return
          }
          openBooleanDialog({
            title: text("Image Bus", "图片总线"),
            current: option.value === "enabled" ? enabled : reviewWithMainModel,
            trueLabel: text("Enable", "启用"),
            falseLabel: text("Disable", "禁用"),
            onBack: openImageBus,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["image_bus", option.value], value),
                text(`Updated image bus ${option.value.replaceAll("_", " ")}`, `已更新图片总线 ${option.value.replaceAll("_", " ")}`),
                openImageBus,
              ),
          })
        },
      })
    )
  }

  const openGeneral = () => {
    const config = effective()
    const bioVisible = isBioAgentsVisible(config)

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("OpenAgent General Settings", "OpenAgent 通用设置"),
        placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
        options: [
          summaryRow(text("Current Scope", "当前作用域"), `${scope} • ${compactPathLabel(scopePath())}`, text("Current", "当前")),
          summaryRow(
            text("⚠️ Deprecated Setting", "⚠️ 已废弃的设置"),
            text("Use 'Agent Display Settings' instead for better control", "请使用 'Agent 显示设置' 以获得更好的控制"),
            text("Notice", "提示")
          ),
          {
            title: text("Scope", "作用域"),
            value: "scope",
            category: text("Core", "核心"),
            description: `${scope} • ${compactPathLabel(scopePath())}`,
          },
          // 旧的 bio_agents_visible 选项已移除
          // 用户应该使用 Agent Display Settings -> Enable Bioinformatics Domain
          {
            title: text("Language", "语言"),
            value: "language",
            category: text("Core", "核心"),
            description: uiLanguage === "zh" ? "中文" : "English",
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the main settings page.", "返回设置主页。"),
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
          if (option.value === "language") {
            openLanguageDialog(openGeneral)
            return
          }
          // 旧的 bio_agents_visible 处理逻辑已移除
          // 用户应该使用 /ol-settings -> Agent Display -> Enable Bioinformatics Domain
        },
      })
    )
  }

  const openRuntime = () => {
    const config = effectiveRecord()
    const profile = getNestedString(config, ["experimental", "context_guard_profile"]) as
      | "conservative"
      | "balanced"
      | "aggressive"
      | undefined
    const preemptiveCompaction = getNestedBoolean(config, ["experimental", "preemptive_compaction"])
    const strictModelPriority = getNestedBoolean(config, ["experimental", "strict_user_model_priority"])
    const thresholdProfile = resolveContextGuardProfile(profile)
    const thresholds = getContextGuardThresholdDisplay({
      profile: thresholdProfile,
      overrides: (config["experimental"] as Record<string, unknown> | undefined)?.["context_guard_thresholds"] as never,
    })

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("OpenAgent Runtime Settings", "OpenAgent 运行时设置"),
        placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Runtime State", "当前运行状态"),
            `${text("Context guard", "上下文防护")}: ${stringLabel(profile, "balanced")} • ${text("Compaction", "压缩")}: ${booleanLabel(preemptiveCompaction)} • ${text("Model lock", "模型锁定")}: ${booleanLabel(strictModelPriority)}`,
            text("Current", "当前"),
          ),
          {
            title: text("Open Context Guard Settings", "打开上下文防护设置"),
            value: "open_context_guard",
            category: text("Pages", "页面"),
            description: text("Configure context guard profiles and thresholds in detail", "详细配置上下文防护预设和阈值"),
          },
          {
            title: text("Choose Context Guard Profile", "选择上下文防护档位"),
            value: "context_guard_profile",
            category: text("Core", "核心"),
            description: stringValueLabel(profile, "balanced", "balanced"),
          },
          {
            title: text("Toggle Preemptive Compaction", "切换预压缩"),
            value: "preemptive_compaction",
            category: text("Core", "核心"),
            description: statusLabel(preemptiveCompaction),
          },
          {
            title: text("Toggle Strict User Model Priority", "切换严格用户模型优先"),
            value: "strict_user_model_priority",
            category: text("Advanced", "高级"),
            description: statusLabel(strictModelPriority),
          },
          {
            title: text("Configure L1/L2/L3 Thresholds", "配置 L1/L2/L3 阈值"),
            value: "thresholds",
            category: text("Advanced", "高级"),
            description: `1M: ${formatCompactTokens(thresholds.oneMillion.l1Tokens)}/${formatCompactTokens(thresholds.oneMillion.l2Tokens)}/${formatCompactTokens(thresholds.oneMillion.l3Tokens)} • 400K: ${formatCompactTokens(thresholds.fourHundredK.l1Tokens)}/${formatCompactTokens(thresholds.fourHundredK.l2Tokens)}/${formatCompactTokens(thresholds.fourHundredK.l3Tokens)}`,
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the main settings page.", "返回设置主页。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("root")
            return
          }
          if (option.value === "open_context_guard") {
            openContextGuard()
            return
          }
          if (option.value === "context_guard_profile") {
            openEnumDialog({
              title: text("Context Guard Profile", "上下文防护档位"),
              current: profile,
              choices: [
                {
                  title: text("Conservative", "保守"),
                  value: "conservative",
                  description: text("Later reminders and later auto-compaction.", "更晚提醒，更晚自动压缩。"),
                },
                {
                  title: text("Balanced", "均衡"),
                  value: "balanced",
                  description: text("Current recommended default.", "当前推荐默认值。"),
                },
                {
                  title: text("Aggressive", "激进"),
                  value: "aggressive",
                  description: text("Earlier reminders and earlier auto-compaction.", "更早提醒，更早自动压缩。"),
                },
              ],
              onBack: openRuntime,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["experimental", "context_guard_profile"], value),
                    text("Updated context guard profile", "已更新上下文防护档位"),
                    openRuntime,
                  ),
            })
            return
          }
          if (option.value === "thresholds") {
            openContextGuardThresholds()
            return
          }

          const current =
            option.value === "preemptive_compaction"
              ? preemptiveCompaction
              : strictModelPriority

          openBooleanDialog({
            title: option.value === "preemptive_compaction"
              ? text("Preemptive Compaction", "预压缩")
              : text("Strict User Model Priority", "严格用户模型优先"),
            current,
            trueLabel: text("Enable", "启用"),
            falseLabel: text("Disable", "禁用"),
            onBack: openRuntime,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["experimental", option.value], value),
                `Updated ${option.value.replaceAll("_", " ")}`,
                openRuntime,
              ),
          })
        },
      })
    )
  }

  const openContextGuardThresholdBucket = (bucketKey: "one_million" | "four_hundred_k" | "two_hundred_k") => {
    const config = effectiveRecord()
    const profile = resolveContextGuardProfile(
      getNestedString(config, ["experimental", "context_guard_profile"]) as
        | "conservative"
        | "balanced"
        | "aggressive"
        | undefined,
    )
    const thresholds = getContextGuardThresholdDisplay({
      profile,
      overrides: (config["experimental"] as Record<string, unknown> | undefined)?.["context_guard_thresholds"] as never,
    })
    const bucket = bucketKey === "one_million"
      ? thresholds.oneMillion
      : bucketKey === "four_hundred_k"
        ? thresholds.fourHundredK
        : (thresholds.twoHundredK ?? { l1Tokens: 110_000, l2Tokens: 140_000, l3Tokens: 150_000 })
    const title = bucketKey === "one_million"
      ? "1M Context Thresholds"
      : bucketKey === "four_hundred_k"
        ? "400K Context Thresholds"
        : "200K Context Thresholds"
    const titleZh = bucketKey === "one_million"
      ? "1M 上下文阈值"
      : bucketKey === "four_hundred_k"
        ? "400K 上下文阈值"
        : "200K 上下文阈值"

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text(title, titleZh),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Thresholds", "当前阈值"),
            `L1 ${formatCompactTokens(bucket.l1Tokens)} • L2 ${formatCompactTokens(bucket.l2Tokens)} • L3 ${formatCompactTokens(bucket.l3Tokens)}`,
            text("Current", "当前"),
          ),
          {
            title: text("Set L1 Threshold", "设置 L1 阈值"),
            value: "l1_tokens",
            category: text("Core", "核心"),
            description: formatCompactTokens(bucket.l1Tokens),
          },
          {
            title: text("Set L2 Threshold", "设置 L2 阈值"),
            value: "l2_tokens",
            category: text("Core", "核心"),
            description: formatCompactTokens(bucket.l2Tokens),
          },
          {
            title: text("Set L3 Threshold", "设置 L3 阈值"),
            value: "l3_tokens",
            category: text("Core", "核心"),
            description: formatCompactTokens(bucket.l3Tokens),
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to threshold groups.", "返回阈值分组页面。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openContextGuardThresholds()
            return
          }

          openTokenPrompt({
            title: text(`${title} ${option.value.toUpperCase()}`, `${titleZh} ${option.value.toUpperCase()}`),
            value: option.value === "l1_tokens" ? bucket.l1Tokens : option.value === "l2_tokens" ? bucket.l2Tokens : bucket.l3Tokens,
            placeholder: text("e.g., 200K, 1.5M", "例如：200K、1.5M"),
            min: 1,
            max: 2_000_000,
            onCancel: () => openContextGuardThresholdBucket(bucketKey),
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["experimental", "context_guard_thresholds", bucketKey, option.value], value),
                text(`Updated ${title} ${option.value}`, `已更新 ${titleZh} ${option.value}`),
                () => openContextGuardThresholdBucket(bucketKey),
              ),
          })
        },
      })
    )
  }

  const openContextGuardThresholds = () => {
    const config = effectiveRecord()
    const profile = resolveContextGuardProfile(
      getNestedString(config, ["experimental", "context_guard_profile"]) as
        | "conservative"
        | "balanced"
        | "aggressive"
        | undefined,
    )
    const thresholds = getContextGuardThresholdDisplay({
      profile,
      overrides: (config["experimental"] as Record<string, unknown> | undefined)?.["context_guard_thresholds"] as never,
    })

    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Context Guard Thresholds", "上下文防护阈值"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(text("Preset Base", "当前基准"), `${text("Profile", "档位")}: ${profile}`, text("Current", "当前")),
          {
            title: text("Configure 1M Context Thresholds", "配置 1M 上下文阈值"),
            value: "one_million",
            category: text("Profiles", "配置组"),
            description: `L1 ${formatCompactTokens(thresholds.oneMillion.l1Tokens)} • L2 ${formatCompactTokens(thresholds.oneMillion.l2Tokens)} • L3 ${formatCompactTokens(thresholds.oneMillion.l3Tokens)}`,
          },
          {
            title: text("Configure 400K Context Thresholds", "配置 400K 上下文阈值"),
            value: "four_hundred_k",
            category: text("Profiles", "配置组"),
            description: `L1 ${formatCompactTokens(thresholds.fourHundredK.l1Tokens)} • L2 ${formatCompactTokens(thresholds.fourHundredK.l2Tokens)} • L3 ${formatCompactTokens(thresholds.fourHundredK.l3Tokens)}`,
          },
          {
            title: text("Configure 200K Context Thresholds", "配置 200K 上下文阈值"),
            value: "two_hundred_k",
            category: text("Profiles", "配置组"),
            description: `L1 ${formatCompactTokens(thresholds.twoHundredK?.l1Tokens ?? 110_000)} • L2 ${formatCompactTokens(thresholds.twoHundredK?.l2Tokens ?? 140_000)} • L3 ${formatCompactTokens(thresholds.twoHundredK?.l3Tokens ?? 150_000)}`,
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to context guard settings.", "返回上下文防护设置。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openContextGuard()
            return
          }
          openContextGuardThresholdBucket(option.value as "one_million" | "four_hundred_k" | "two_hundred_k")
        },
      })
    )
  }

  const openContextGuard = () => {
    const config = effectiveRecord()
    const profile = getNestedString(config, ["experimental", "context_guard_profile"]) as
      | "conservative"
      | "conservative-plus"
      | "balanced"
      | "balanced-plus"
      | "aggressive"
      | "aggressive-plus"
      | undefined
    const preemptiveCompaction = getNestedBoolean(config, ["experimental", "preemptive_compaction"])
    const thresholdProfile = resolveContextGuardProfile(profile)
    const thresholds = getContextGuardThresholdDisplay({
      profile: thresholdProfile,
      overrides: (config["experimental"] as Record<string, unknown> | undefined)?.["context_guard_thresholds"] as never,
    })

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Context Guard Settings", "上下文防护设置"),
        placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Context Guard State", "当前上下文防护状态"),
            `${text("Profile", "预设")}: ${stringLabel(profile, "balanced")} • ${text("Preemptive compaction", "预防性压缩")}: ${booleanLabel(preemptiveCompaction)}`,
            text("Current", "当前"),
          ),
          {
            title: text("Choose Context Guard Profile", "选择上下文防护预设"),
            value: "context_guard_profile",
            category: text("Core", "核心"),
            description: stringValueLabel(profile, "balanced", "balanced"),
          },
          {
            title: text("Toggle Preemptive Compaction", "切换预防性压缩"),
            value: "preemptive_compaction",
            category: text("Core", "核心"),
            description: statusLabel(preemptiveCompaction),
          },
          {
            title: text("Configure L1/L2/L3 Thresholds", "配置 L1/L2/L3 阈值"),
            value: "thresholds",
            category: text("Advanced", "高级"),
            description: `1M: ${formatCompactTokens(thresholds.oneMillion.l1Tokens)}/${formatCompactTokens(thresholds.oneMillion.l2Tokens)}/${formatCompactTokens(thresholds.oneMillion.l3Tokens)} • 400K: ${formatCompactTokens(thresholds.fourHundredK.l1Tokens)}/${formatCompactTokens(thresholds.fourHundredK.l2Tokens)}/${formatCompactTokens(thresholds.fourHundredK.l3Tokens)} • 200K: ${formatCompactTokens(thresholds.twoHundredK?.l1Tokens ?? 110_000)}/${formatCompactTokens(thresholds.twoHundredK?.l2Tokens ?? 140_000)}/${formatCompactTokens(thresholds.twoHundredK?.l3Tokens ?? 150_000)}`,
          },
          {
            title: text("Back", "返回"),
            value: "back",
            category: text("Navigation", "导航"),
            description: text("Return to the main settings page.", "返回设置主页。"),
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("root")
            return
          }
          if (option.value === "context_guard_profile") {
            openEnumDialog({
              title: text("Context Guard Profile", "上下文防护预设"),
              current: profile,
              choices: [
                {
                  title: text("Conservative", "保守"),
                  value: "conservative",
                  description: text("Later reminders, later auto-compaction. For 1M/400K/200K models.", "更晚提醒，更晚自动压缩。适用于 1M/400K/200K 模型。"),
                },
                {
                  title: text("Conservative Plus", "保守 Plus"),
                  value: "conservative-plus",
                  description: text("Conservative +30K headroom. For 256K (Kimi) models.", "保守 +30K 余量。适用于 256K (Kimi) 模型。"),
                },
                {
                  title: text("Balanced", "均衡"),
                  value: "balanced",
                  description: text("Recommended default. For 1M/400K/200K models.", "推荐默认值。适用于 1M/400K/200K 模型。"),
                },
                {
                  title: text("Balanced Plus", "均衡 Plus"),
                  value: "balanced-plus",
                  description: text("Balanced +30K headroom. For 256K (Kimi) models.", "均衡 +30K 余量。适用于 256K (Kimi) 模型。"),
                },
                {
                  title: text("Aggressive", "激进"),
                  value: "aggressive",
                  description: text("Earlier reminders, earlier auto-compaction. For 1M/400K/200K models.", "更早提醒，更早自动压缩。适用于 1M/400K/200K 模型。"),
                },
                {
                  title: text("Aggressive Plus", "激进 Plus"),
                  value: "aggressive-plus",
                  description: text("Aggressive +30K headroom. For 256K (Kimi) models.", "激进 +30K 余量。适用于 256K (Kimi) 模型。"),
                },
              ],
              onBack: openContextGuard,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["experimental", "context_guard_profile"], value),
                  text("Updated context guard profile", "已更新上下文防护预设"),
                  openContextGuard,
                ),
            })
            return
          }
          if (option.value === "thresholds") {
            openContextGuardThresholds()
            return
          }

          openBooleanDialog({
            title: text("Preemptive Compaction", "预防性压缩"),
            current: preemptiveCompaction,
            trueLabel: text("Enable", "启用"),
            falseLabel: text("Disable", "禁用"),
            onBack: openContextGuard,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["experimental", "preemptive_compaction"], value),
                text("Updated preemptive compaction", "已更新预防性压缩"),
                openContextGuard,
              ),
          })
        },
      })
    )
  }

  const openSwarm = () => {
    const config = effectiveRecord()
    const swarmEnabled = getNestedBoolean(config, ["experimental", "swarm", "enabled"])
    const maxWorkers = getNestedNumber(config, ["experimental", "swarm", "max_workers"])
    const coordinatorModel = getNestedString(config, ["experimental", "swarm", "coordinator_model"])
    const workerModel = getNestedString(config, ["experimental", "swarm", "worker_model"])
    const specialistModel = getNestedString(config, ["experimental", "swarm", "specialist_model"])
    const heartbeatInterval = getNestedNumber(config, ["experimental", "swarm", "heartbeat_interval_ms"])
    const heartbeatTimeout = getNestedNumber(config, ["experimental", "swarm", "heartbeat_timeout_ms"])
    const autoCleanup = getNestedBoolean(config, ["experimental", "swarm", "auto_cleanup"])

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("Swarm Settings", "蜂群设置"),
        placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 关闭"),
        options: [
          summaryRow(
            text("Current Swarm State", "当前蜂群状态"),
            `${text("Enabled", "启用")}: ${booleanLabel(swarmEnabled)} • ${text("Max workers", "最大工作者")}: ${numberLabel(maxWorkers, "5")}`,
            text("Current", "当前"),
          ),
          {
            title: text("Swarm Enabled", "启用蜂群"),
            value: "enabled",
            category: text("Basic", "基础设置"),
            description: statusLabel(swarmEnabled),
          },
          {
            title: text("Max Workers", "最大工作者数"),
            value: "max_workers",
            category: text("Basic", "基础设置"),
            description: numberValueLabel(maxWorkers, "5 (default)", "5（默认）"),
          },
          {
            title: text("Coordinator Model", "协调器模型"),
            value: "coordinator_model",
            category: text("Models", "模型配置"),
            description: stringValueLabel(coordinatorModel, "Auto (Opus)", "自动（Opus）"),
          },
          {
            title: text("Worker Model", "工作者模型"),
            value: "worker_model",
            category: text("Models", "模型配置"),
            description: stringValueLabel(workerModel, "Auto (Haiku)", "自动（Haiku）"),
          },
          {
            title: text("Specialist Model", "专家模型"),
            value: "specialist_model",
            category: text("Models", "模型配置"),
            description: stringValueLabel(specialistModel, "Auto (Sonnet)", "自动（Sonnet）"),
          },
          {
            title: text("Heartbeat Interval", "心跳间隔"),
            value: "heartbeat_interval",
            category: text("Advanced", "高级设置"),
            description: `${heartbeatInterval || 10000}ms`,
          },
          {
            title: text("Heartbeat Timeout", "心跳超时"),
            value: "heartbeat_timeout",
            category: text("Advanced", "高级设置"),
            description: `${heartbeatTimeout || 30000}ms`,
          },
          {
            title: text("Auto Cleanup", "自动清理"),
            value: "auto_cleanup",
            category: text("Advanced", "高级设置"),
            description: statusLabel(autoCleanup ?? true),
          },
          {
            title: text("← Back", "← 返回"),
            value: "back",
            category: "",
            description: "",
          },
        ],
        onSelect: (option) => {
          if (option.value === "back") {
            openRoot("runtime")
            return
          }
          if (option.value === "enabled") {
            openBooleanDialog({
              title: text("Swarm Enabled", "启用蜂群"),
              current: swarmEnabled,
              trueLabel: text("Enable", "启用"),
              falseLabel: text("Disable", "禁用"),
              onBack: openSwarm,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["experimental", "swarm", "enabled"], value),
                  text("Updated swarm enabled", "已更新蜂群启用状态"),
                  openSwarm,
                ),
            })
            return
          }
          if (option.value === "max_workers") {
            openNumberDialog({
              title: text("Max Workers", "最大工作者数"),
              current: maxWorkers,
              placeholder: "1-20",
              onBack: openSwarm,
              onConfirm: (value) => {
                const num = parseInt(value)
                if (isNaN(num) || num < 1 || num > 20) {
                  api.ui.toast({
                    title: text("Invalid value", "无效值"),
                    message: text("Must be between 1 and 20", "必须在 1 到 20 之间"),
                    variant: "error",
                  })
                  openSwarm()
                  return
                }
                save(
                  (root) => setNestedValue(root, ["experimental", "swarm", "max_workers"], num),
                  text("Updated max workers", "已更新最大工作者数"),
                  openSwarm,
                )
              },
            })
            return
          }
          if (option.value === "coordinator_model" || option.value === "worker_model" || option.value === "specialist_model") {
            const roleKey = option.value
            const currentValue = getNestedString(config, ["experimental", "swarm", roleKey])

            // 读取用户配置的 agents 和 categories
            const configuredModels: Array<{ title: string; value: string; description: string }> = []

            // 从 agents 配置中提取模型
            const agents = config.agents as Record<string, { model?: string }> | undefined
            if (agents) {
              const seenModels = new Set<string>()
              for (const [agentName, agentConfig] of Object.entries(agents)) {
                if (agentConfig.model && !seenModels.has(agentConfig.model)) {
                  seenModels.add(agentConfig.model)
                  configuredModels.push({
                    title: agentConfig.model,
                    value: agentConfig.model,
                    description: `Used by ${agentName}`,
                  })
                }
              }
            }

            // 从 categories 配置中提取模型
            const categories = config.categories as Record<string, { model?: string }> | undefined
            if (categories) {
              const seenModels = new Set(configuredModels.map(m => m.value))
              for (const [categoryName, categoryConfig] of Object.entries(categories)) {
                if (categoryConfig.model && !seenModels.has(categoryConfig.model)) {
                  seenModels.add(categoryConfig.model)
                  configuredModels.push({
                    title: categoryConfig.model,
                    value: categoryConfig.model,
                    description: `Used by category ${categoryName}`,
                  })
                }
              }
            }

            // 添加常用模型作为后备选项
            const commonModels = [
              { title: "anthropic/claude-opus-4-6", value: "anthropic/claude-opus-4-6", description: "High-tier, expensive" },
              { title: "anthropic/claude-sonnet-4-6", value: "anthropic/claude-sonnet-4-6", description: "Mid-tier, balanced" },
              { title: "anthropic/claude-haiku-4-5", value: "anthropic/claude-haiku-4-5", description: "Low-tier, cheap" },
              { title: "openai/gpt-5.4", value: "openai/gpt-5.4", description: "High-tier" },
              { title: "openai/gpt-4o", value: "openai/gpt-4o", description: "Mid-tier" },
              { title: "google/gemini-3.1-pro", value: "google/gemini-3.1-pro", description: "1M context" },
            ]

            const seenModels = new Set(configuredModels.map(m => m.value))
            for (const model of commonModels) {
              if (!seenModels.has(model.value)) {
                configuredModels.push(model)
              }
            }

            openEnumDialog({
              title: text(
                roleKey === "coordinator_model" ? "Coordinator Model" : roleKey === "worker_model" ? "Worker Model" : "Specialist Model",
                roleKey === "coordinator_model" ? "协调器模型" : roleKey === "worker_model" ? "工作者模型" : "专家模型"
              ),
              current: currentValue || "auto",
              choices: [
                {
                  title: text("Auto (Recommended)", "自动（推荐）"),
                  value: "auto",
                  description: text("Use default fallback chain", "使用默认回退链"),
                },
                ...configuredModels.map(m => ({
                  title: m.title,
                  value: m.value,
                  description: m.description,
                })),
              ],
              onBack: openSwarm,
              onConfirm: (value) => {
                save(
                  (root) => setNestedValue(root, ["experimental", "swarm", roleKey], value === "auto" ? undefined : value),
                  text("Updated model", "已更新模型"),
                  openSwarm,
                )
              },
            })
            return
          }
          if (option.value === "heartbeat_interval" || option.value === "heartbeat_timeout") {
            const key = option.value === "heartbeat_interval" ? "heartbeat_interval_ms" : "heartbeat_timeout_ms"
            const currentValue = getNestedNumber(config, ["experimental", "swarm", key])
            openNumberDialog({
              title: text(
                option.value === "heartbeat_interval" ? "Heartbeat Interval (ms)" : "Heartbeat Timeout (ms)",
                option.value === "heartbeat_interval" ? "心跳间隔（毫秒）" : "心跳超时（毫秒）"
              ),
              current: currentValue,
              placeholder: option.value === "heartbeat_interval" ? "10000" : "30000",
              onBack: openSwarm,
              onConfirm: (value) => {
                const num = parseInt(value)
                if (isNaN(num) || num < 1000) {
                  api.ui.toast({
                    title: text("Invalid value", "无效值"),
                    message: text("Must be at least 1000ms", "必须至少 1000 毫秒"),
                    variant: "error",
                  })
                  openSwarm()
                  return
                }
                save(
                  (root) => setNestedValue(root, ["experimental", "swarm", key], num),
                  text("Updated setting", "已更新设置"),
                  openSwarm,
                )
              },
            })
            return
          }
          if (option.value === "auto_cleanup") {
            openBooleanDialog({
              title: text("Auto Cleanup", "自动清理"),
              current: autoCleanup ?? true,
              trueLabel: text("Enable", "启用"),
              falseLabel: text("Disable", "禁用"),
              onBack: openSwarm,
              onConfirm: (value) =>
                save(
                  (root) => setNestedValue(root, ["experimental", "swarm", "auto_cleanup"], value),
                  text("Updated auto cleanup", "已更新自动清理"),
                  openSwarm,
                ),
            })
            return
          }
        },
      })
    )
  }

  const openRoot = (entry: SettingsEntry = "root") => {
    if (entry === "general") {
      openGeneral()
      return
    }
    if (entry === "runtime") {
      openRuntime()
      return
    }
    if (entry === "image-bus") {
      openImageBus()
      return
    }
    if (entry === "agent-display") {
      openAgentDisplay()
      return
    }
    if (entry === "context-guard") {
      openContextGuard()
      return
    }
    if (entry === "swarm") {
      openSwarm()
      return
    }

    const config = effective()
    const configRecord = config as unknown as Record<string, unknown>
    const imageBusEnabled = getNestedBoolean(configRecord, ["image_bus", "enabled"])
    const agentDisplayMode = getNestedString(configRecord, ["agent_display", "agent_display_mode"])
    const profile = getNestedString(configRecord, ["experimental", "context_guard_profile"])
    const preemptiveCompaction = getNestedBoolean(configRecord, ["experimental", "preemptive_compaction"])
    const strictModelPriority = getNestedBoolean(configRecord, ["experimental", "strict_user_model_priority"])
    const swarmEnabled = getNestedBoolean(configRecord, ["experimental", "swarm", "enabled"])
    const swarmMaxWorkers = getNestedNumber(configRecord, ["experimental", "swarm", "max_workers"])

    api.ui.dialog.setSize("xlarge")
    api.ui.dialog.replace(() =>
      api.ui.DialogSelect({
        title: text("OpenAgent Labforge Settings", "OpenAgent Labforge 设置"),
        placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
        options: [
          summaryRow(text("Current Scope", "当前作用域"), `${scope} • ${compactPathLabel(scopePath())}`, text("Current", "当前")),
          {
            title: text("Scope", "作用域"),
            value: "scope",
            category: text("Core", "核心"),
            description: `${scope} • ${compactPathLabel(scopePath())}`,
          },
          {
            title: text("Language", "语言"),
            value: "language",
            category: text("Core", "核心"),
            description: uiLanguage === "zh" ? "中文" : "English",
          },
          {
            title: text("General Settings", "通用设置"),
            value: "general",
            category: text("Pages", "页面"),
            description: text("General configuration options", "通用配置选项"),
          },
          {
            title: text("Runtime Settings", "运行时设置"),
            value: "runtime",
            category: text("Pages", "页面"),
            description: `${text("Context guard", "上下文防护")}: ${stringLabel(profile, "balanced")} • ${text("Compaction", "压缩")}: ${booleanLabel(preemptiveCompaction)} • ${text("Model lock", "模型锁定")}: ${booleanLabel(strictModelPriority)}`,
          },
          {
            title: text("Agent Display Settings", "Agent 显示设置"),
            value: "agent-display",
            category: text("Pages", "页面"),
            description: `${text("Mode", "模式")}: ${stringLabel(agentDisplayMode, "minimal")} • ${text("Agent visibility and domain control", "Agent 可见性与领域控制")}`,
          },
          {
            title: text("Context Guard Settings", "上下文防护设置"),
            value: "context-guard",
            category: text("Pages", "页面"),
            description: `${text("Profile", "预设")}: ${stringLabel(profile, "balanced")} • ${text("Preemptive compaction", "预防性压缩")}: ${booleanLabel(preemptiveCompaction)} • ${text("Multi-tier threshold control", "多档阈值控制")}`,
          },
          {
            title: text("Image Bus Settings", "图片总线设置"),
            value: "image-bus",
            category: text("Pages", "页面"),
            description: `${text("Image bus", "图片总线")}: ${booleanLabel(imageBusEnabled)} • ${text("Routing and provider settings", "路由与通道配置")}`,
          },
          {
            title: text("Swarm Settings", "蜂群设置"),
            value: "swarm",
            category: text("Pages", "页面"),
            description: `${text("Swarm", "蜂群")}: ${booleanLabel(swarmEnabled)} • ${text("Max workers", "最大工作者")}: ${numberLabel(swarmMaxWorkers, "5")}`,
          },
        ],
        onSelect: (option) => {
          if (option.value === "scope") {
            openScopeDialog(openRoot)
            return
          }
          if (option.value === "language") {
            openLanguageDialog(openRoot)
            return
          }
          if (option.value === "general") {
            openGeneral()
            return
          }
          if (option.value === "runtime") {
            openRuntime()
            return
          }
          if (option.value === "agent-display") {
            openAgentDisplay()
            return
          }
          if (option.value === "context-guard") {
            openContextGuard()
            return
          }
          if (option.value === "swarm") {
            openSwarm()
            return
          }
          openImageBus()
        },
      })
    )
  }

  return {
    openRoot,
    getLanguage: () => uiLanguage,
    describeCommand(command: "settings" | "image-bus-settings") {
      if (command === "settings") {
        return {
          title: text("OpenAgent Settings", "OpenAgent 设置"),
          description: text("Open the native OpenAgent Labforge settings dialog.", "打开 OpenAgent Labforge 原生设置面板。"),
        }
      }

      return {
        title: text("OpenAgent Image Bus Settings", "OpenAgent 图片总线设置"),
        description: text("Open the Image Bus page inside OpenAgent Labforge settings.", "直接打开 OpenAgent 设置中的图片总线页面。"),
      }
    },
  }
}
