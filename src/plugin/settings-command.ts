type TuiLike = {
  showToast?: (input: {
    body: {
      title: string
      message: string
      variant: "warning" | "success" | "error" | "info"
      duration: number
    }
  }) => Promise<unknown>
}

export type SettingsSurfaceRequest = {
  page: "general" | "image-bus"
}

export function parseSettingsSurfaceRequest(promptText: string): SettingsSurfaceRequest | null {
  const trimmed = promptText.trim()
  if (trimmed.length === 0) {
    return null
  }

  const firstLine = trimmed.split(/\r?\n/, 1)[0]?.trim() ?? ""
  if (/^\/ol-settings-image-bus(?:\s+.*)?$/i.test(firstLine)) {
    return { page: "image-bus" }
  }
  if (/^\/ol-settings(?:\s+.*)?$/i.test(firstLine)) {
    return { page: "general" }
  }

  return null
}

async function showSettingsToast(
  tui: TuiLike | undefined,
  request: SettingsSurfaceRequest,
): Promise<void> {
  if (!tui?.showToast) return

  const pageLabel = request.page === "image-bus" ? "Image Bus" : "General"
  await tui.showToast({
    body: {
      title: "OpenAgent Settings",
      message: `${pageLabel} settings live in the native TUI command UI. Trigger /ol-settings from the slash menu or command palette.`,
      variant: "info",
      duration: 2600,
    },
  }).catch(() => {})
}

export async function handleSettingsSurface(args: {
  tui: TuiLike | undefined
  promptText: string
}): Promise<{ handled: boolean; request?: SettingsSurfaceRequest }> {
  const request = parseSettingsSurfaceRequest(args.promptText)
  if (!request) {
    return { handled: false }
  }

  await showSettingsToast(args.tui, request)
  return {
    handled: true,
    request,
  }
}
