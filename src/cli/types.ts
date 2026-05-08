export type BooleanArg = 'yes' | 'no';
export type CompatRuntimeArg = 'opencode' | 'openclaude' | 'codex' | 'claude';

export interface InstallArgs {
  target?: 'opencode' | 'openclaude' | 'codex' | 'claude' | 'dstui';
  command?: 'install' | 'uninstall' | 'doctor' | 'status';
  runtime?: CompatRuntimeArg;
  runtimes?: CompatRuntimeArg[];
  runtimeRoot?: string;
  manifestPath?: string;
  tui: boolean;
  skills?: BooleanArg;
  preset?: string;
  dryRun?: boolean;
  reset?: boolean;
  force?: boolean;
  targetRoot?: string;
}

export interface OpenCodeConfig {
  plugin?: unknown[];
  provider?: Record<string, unknown>;
  agent?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InstallConfig {
  hasTmux: boolean;
  installSkills: boolean;
  installCustomSkills: boolean;
  preset?: string;
  promptForStar?: boolean;
  dryRun?: boolean;
  reset: boolean;
}

export interface ConfigMergeResult {
  success: boolean;
  configPath: string;
  error?: string;
}

export interface DetectedConfig {
  isInstalled: boolean;
  hasKimi: boolean;
  hasOpenAI: boolean;
  hasAnthropic?: boolean;
  hasCopilot?: boolean;
  hasZaiPlan?: boolean;
  hasAntigravity: boolean;
  hasChutes?: boolean;
  hasOpencodeZen: boolean;
  hasTmux: boolean;
}
