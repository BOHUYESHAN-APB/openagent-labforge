export type TuiToast = {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  message: string
  duration?: number
}

export type TuiCommand = {
  title: string
  value: string
  description?: string
  category?: string
  keybind?: string
  suggested?: boolean
  hidden?: boolean
  enabled?: boolean
  slash?: {
    name: string
    aliases?: string[]
  }
  onSelect?: () => void
}

export type TuiDialogSize = "medium" | "large" | "xlarge"

export type TuiDialogSelectOption<Value = unknown> = {
  title: string
  value: Value
  description?: string
  footer?: unknown
  category?: string
  disabled?: boolean
  onSelect?: () => void
}

export type TuiDialogSelectProps<Value = unknown> = {
  title: string
  placeholder?: string
  options: TuiDialogSelectOption<Value>[]
  flat?: boolean
  onMove?: (option: TuiDialogSelectOption<Value>) => void
  onFilter?: (query: string) => void
  onSelect?: (option: TuiDialogSelectOption<Value>) => void
  skipFilter?: boolean
  current?: Value
}

export type TuiDialogPromptProps = {
  title: string
  description?: () => unknown
  placeholder?: string
  value?: string
  busy?: boolean
  busyText?: string
  onConfirm?: (value: string) => void
  onCancel?: () => void
}

export type TuiDialogStack = {
  replace: (render: () => unknown, onClose?: () => void) => void
  clear: () => void
  setSize: (size: TuiDialogSize) => void
  readonly size: TuiDialogSize
  readonly depth: number
  readonly open: boolean
}

export type TuiKv = {
  get: <Value = unknown>(key: string, fallback?: Value) => Value
  set: (key: string, value: unknown) => void
  readonly ready: boolean
}

export type TuiPluginApi = {
  command: {
    register: (cb: () => TuiCommand[]) => () => void
    trigger: (value: string) => void
    show: () => void
  }
  ui: {
    DialogSelect: <Value = unknown>(props: TuiDialogSelectProps<Value>) => unknown
    DialogPrompt: (props: TuiDialogPromptProps) => unknown
    toast: (input: TuiToast) => void
    dialog: TuiDialogStack
  }
  kv: TuiKv
  state: {
    path: {
      directory: string
    }
  }
}

export type TuiPluginMeta = {
  id: string
  state: "first" | "updated" | "same"
}

export type TuiPlugin = (
  api: TuiPluginApi,
  options: Record<string, unknown> | undefined,
  meta: TuiPluginMeta,
) => Promise<void>

export type TuiPluginModule = {
  id: string
  tui: TuiPlugin
}
