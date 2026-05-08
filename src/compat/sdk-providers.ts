export type CompatSdkId = 'codex' | 'claude-agent' | 'openclaude';

export interface CompatSdkProvider {
  id: CompatSdkId;
  displayName: string;
  packageName: string;
  runtimeFamily: 'codex' | 'claude';
  status: 'official' | 'community';
  requiredForPhaseOne: boolean;
  notes: readonly string[];
  detectExport(moduleExports: unknown): boolean;
}

function hasExport(moduleExports: unknown, exportName: string): boolean {
  return (
    typeof moduleExports === 'object' &&
    moduleExports !== null &&
    exportName in moduleExports
  );
}

export const COMPAT_SDK_PROVIDERS = [
  {
    id: 'codex',
    displayName: 'Codex SDK',
    packageName: '@openai/codex-sdk',
    runtimeFamily: 'codex',
    status: 'official',
    requiredForPhaseOne: true,
    notes: [
      'TypeScript SDK wraps the @openai/codex CLI and exchanges JSONL events.',
      'Main export is Codex; threads support run(), runStreamed(), and resumeThread().',
    ],
    detectExport: (moduleExports: unknown) => hasExport(moduleExports, 'Codex'),
  },
  {
    id: 'claude-agent',
    displayName: 'Claude Agent SDK',
    packageName: '@anthropic-ai/claude-agent-sdk',
    runtimeFamily: 'claude',
    status: 'official',
    requiredForPhaseOne: true,
    notes: [
      'Official Claude Code SDK renamed to Claude Agent SDK.',
      'Main programmatic entrypoint is query(); plugins can be passed programmatically.',
    ],
    detectExport: (moduleExports: unknown) => hasExport(moduleExports, 'query'),
  },
  {
    id: 'openclaude',
    displayName: 'OpenClaude SDK',
    packageName: '@gitlawb/openclaude/sdk',
    runtimeFamily: 'claude',
    status: 'community',
    requiredForPhaseOne: true,
    notes: [
      'OpenClaude exposes an SDK subpath with query(), session helpers, and SDK MCP helpers.',
      'Use as the OpenClaude-family bridge; keep Claude Code as the official Claude-family provider.',
    ],
    detectExport: (moduleExports: unknown) =>
      hasExport(moduleExports, 'query') &&
      hasExport(moduleExports, 'createSdkMcpServer'),
  },
] as const satisfies readonly CompatSdkProvider[];

export interface CompatSdkProbeResult {
  id: CompatSdkId;
  displayName: string;
  packageName: string;
  runtimeFamily: CompatSdkProvider['runtimeFamily'];
  status: CompatSdkProvider['status'];
  installed: boolean;
  usable: boolean;
  error?: string;
}

export async function probeCompatSdkProvider(
  provider: CompatSdkProvider,
): Promise<CompatSdkProbeResult> {
  try {
    const moduleExports = await import(provider.packageName);
    const usable = provider.detectExport(moduleExports);

    return {
      id: provider.id,
      displayName: provider.displayName,
      packageName: provider.packageName,
      runtimeFamily: provider.runtimeFamily,
      status: provider.status,
      installed: true,
      usable,
      error: usable
        ? undefined
        : 'Package loaded but expected SDK exports were missing.',
    };
  } catch (error) {
    return {
      id: provider.id,
      displayName: provider.displayName,
      packageName: provider.packageName,
      runtimeFamily: provider.runtimeFamily,
      status: provider.status,
      installed: false,
      usable: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function probeCompatSdkProviders(): Promise<
  CompatSdkProbeResult[]
> {
  return Promise.all(COMPAT_SDK_PROVIDERS.map(probeCompatSdkProvider));
}
