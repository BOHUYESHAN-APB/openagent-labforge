export type RuntimeCompatibilityTier =
  | 'full-plugin'
  | 'limited-adapter'
  | 'rules-mcp'
  | 'infrastructure';

export type RuntimePriority = 'phase-1' | 'later';

export type RuntimeFamily =
  | 'opencode'
  | 'claude'
  | 'codex'
  | 'deepseek'
  | 'copilot'
  | 'cline'
  | 'kilocode'
  | 'shared-context';

export type CompatibilityCapability =
  | 'plugin-manifest'
  | 'agents'
  | 'subagents'
  | 'skills'
  | 'hooks'
  | 'commands'
  | 'mcp'
  | 'rules'
  | 'custom-modes'
  | 'document-output'
  | 'shared-prefix-snapshot'
  | 'backup-rollback';

export interface RuntimeCompatibilityProfile {
  id: string;
  displayName: string;
  family: RuntimeFamily;
  tier: RuntimeCompatibilityTier;
  priority: RuntimePriority;
  capabilities: readonly CompatibilityCapability[];
  sdkPackage?: string;
  installStrategy: string;
  notes: readonly string[];
}

export const PHASE_ONE_RUNTIME_IDS = [
  'opencode',
  'openclaude',
  'codex',
] as const;

export type PhaseOneRuntimeId = (typeof PHASE_ONE_RUNTIME_IDS)[number];

export const RUNTIME_COMPATIBILITY_PROFILES = [
  {
    id: 'opencode',
    displayName: 'OpenCode',
    family: 'opencode',
    tier: 'full-plugin',
    priority: 'phase-1',
    capabilities: [
      'plugin-manifest',
      'agents',
      'subagents',
      'skills',
      'hooks',
      'commands',
      'mcp',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    installStrategy: 'Native plugin install and config mutation.',
    notes: ['Current primary runtime with full ExtendAI Lab behavior.'],
  },
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    family: 'claude',
    tier: 'full-plugin',
    priority: 'later',
    capabilities: [
      'plugin-manifest',
      'agents',
      'skills',
      'hooks',
      'commands',
      'mcp',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    sdkPackage: '@anthropic-ai/claude-agent-sdk',
    installStrategy:
      'Render Claude plugin assets, skills, agents, hooks, and MCP config.',
    notes: [
      'Same Claude-family renderer, but closed-source Claude compatibility is intentionally sequenced after the open-source OpenClaude baseline.',
    ],
  },
  {
    id: 'openclaude',
    displayName: 'OpenClaude',
    family: 'claude',
    tier: 'full-plugin',
    priority: 'phase-1',
    capabilities: [
      'plugin-manifest',
      'agents',
      'skills',
      'hooks',
      'commands',
      'mcp',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    sdkPackage: '@gitlawb/openclaude/sdk',
    installStrategy:
      'Reuse the Claude-family renderer with OpenClaude path detection.',
    notes: [
      'Open-source-first Claude-family target; prioritize this before closed-source Claude Code.',
    ],
  },
  {
    id: 'codex',
    displayName: 'Codex',
    family: 'codex',
    tier: 'full-plugin',
    priority: 'phase-1',
    capabilities: [
      'plugin-manifest',
      'agents',
      'skills',
      'hooks',
      'commands',
      'mcp',
      'rules',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    sdkPackage: '@openai/codex-sdk',
    installStrategy:
      'Render Codex-specific plugin, skills, AGENTS, and MCP assets.',
    notes: [
      'Do not assume OpenCode hook semantics; follow Codex-specific docs.',
    ],
  },
  {
    id: 'deepseek-tui',
    displayName: 'DeepSeek-TUI',
    family: 'deepseek',
    tier: 'limited-adapter',
    priority: 'later',
    capabilities: [
      'skills',
      'commands',
      'mcp',
      'rules',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    installStrategy: 'Install command, skill, MCP, and instruction packs only.',
    notes: ['Harder target; do not promise full hook/subagent parity.'],
  },
  {
    id: 'github-copilot-cli',
    displayName: 'GitHub Copilot CLI',
    family: 'copilot',
    tier: 'limited-adapter',
    priority: 'later',
    capabilities: [
      'skills',
      'commands',
      'mcp',
      'rules',
      'document-output',
      'shared-prefix-snapshot',
      'backup-rollback',
    ],
    installStrategy:
      'Detection-gated command, skill, MCP, and instruction pack.',
    notes: ['Promote only if plugin surfaces are verified stable.'],
  },
  {
    id: 'cline',
    displayName: 'Cline',
    family: 'cline',
    tier: 'rules-mcp',
    priority: 'later',
    capabilities: ['skills', 'mcp', 'rules', 'backup-rollback'],
    installStrategy:
      'Install rules, agent/checklist prompts, skills, and MCP config.',
    notes: ['RooCode should share this renderer family where possible.'],
  },
  {
    id: 'roocode',
    displayName: 'RooCode',
    family: 'cline',
    tier: 'rules-mcp',
    priority: 'later',
    capabilities: ['skills', 'mcp', 'rules', 'backup-rollback'],
    installStrategy:
      'Install Cline-family rules, prompts, skills, and MCP config.',
    notes: [
      'RooCode is a Cline fork; avoid separate assumptions unless needed.',
    ],
  },
  {
    id: 'kilocode',
    displayName: 'KiloCode',
    family: 'kilocode',
    tier: 'rules-mcp',
    priority: 'later',
    capabilities: ['skills', 'mcp', 'rules', 'custom-modes', 'backup-rollback'],
    installStrategy:
      'Install skills, MCP config, rules, custom modes, and prompt packs.',
    notes: [
      'OpenCode-related history, but no full OpenCode plugin ecosystem assumption.',
    ],
  },
  {
    id: 'shared-context-server',
    displayName: 'Shared Context Server',
    family: 'shared-context',
    tier: 'infrastructure',
    priority: 'later',
    capabilities: ['mcp', 'shared-prefix-snapshot', 'backup-rollback'],
    installStrategy:
      'Optional MCP infrastructure for cross-agent shared sessions.',
    notes: ['Not an agent runtime; use as a bridge for supported hosts.'],
  },
] as const satisfies readonly RuntimeCompatibilityProfile[];

export function getPhaseOneRuntimeProfiles(): RuntimeCompatibilityProfile[] {
  const phaseOneIds = new Set<string>(PHASE_ONE_RUNTIME_IDS);
  return RUNTIME_COMPATIBILITY_PROFILES.filter((profile) =>
    phaseOneIds.has(profile.id),
  );
}

export function getRuntimeCompatibilityProfile(
  id: string,
): RuntimeCompatibilityProfile | undefined {
  return RUNTIME_COMPATIBILITY_PROFILES.find((profile) => profile.id === id);
}
