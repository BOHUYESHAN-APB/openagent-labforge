import type { DocumentKind } from '../../document-output';
import { createCodexMarketplaceJson } from '../config-writers';
import type { RenderedFile } from '../install-plan';
import type {
  CompatibilityCapability,
  RuntimeCompatibilityProfile,
} from '../types';

export interface RendererContext {
  runtime: RuntimeCompatibilityProfile;
  workspaceRoot: string;
}

export interface CapabilityRenderer {
  capability: CompatibilityCapability;
  render(context: RendererContext): RenderedFile[];
}

const COMPAT_DIR = 'compat';
const SKILL_PATH = 'skills/extendai-lab-foundation/SKILL.md';
const AGENT_PATH = 'agents/extendai-lab-orchestrator.md';
const COMMAND_PATH = 'commands/extendai-lab-baseline.md';
const CODEX_PLUGIN_CACHE_ROOT =
  'plugins/cache/extendai-lab-local/extendai-lab/local';

function renderTextFile(relativePath: string, content: string): RenderedFile {
  return {
    path: relativePath,
    relativePath,
    content,
    action: 'create',
    managed: true,
  };
}

function renderJsonFile(relativePath: string, value: unknown): RenderedFile {
  return renderTextFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function renderPluginManifest(context: RendererContext): RenderedFile[] {
  if (context.runtime.family === 'claude') {
    return [
      renderJsonFile('.claude-plugin/plugin.json', {
        name: 'extendai-lab',
        version: '0.0.0-compat',
        description:
          'ExtendAI Lab compatibility baseline for Claude-family runtimes.',
        license: 'MIT',
        skills: './skills',
        commands: './commands',
        agents: './agents',
        mcpServers: './.mcp.json',
      }),
      renderJsonFile('.claude-plugin/marketplace.json', {
        name: 'extendai-lab-local',
        description: 'Local ExtendAI Lab compatibility marketplace.',
        owner: {
          name: 'ExtendAI Lab',
        },
        plugins: [
          {
            name: 'extendai-lab',
            description:
              'ExtendAI Lab compatibility baseline for Claude-family runtimes.',
            version: '0.0.0-compat',
            source: './',
            category: 'Developer Tools',
          },
        ],
        version: '0.0.0-compat',
      }),
    ];
  }

  if (context.runtime.family === 'codex') {
    return [
      renderJsonFile(`${CODEX_PLUGIN_CACHE_ROOT}/.codex-plugin/plugin.json`, {
        name: 'extendai-lab',
        version: '0.0.0-compat',
        description: 'ExtendAI Lab compatibility baseline for Codex.',
        license: 'MIT',
        skills: './skills',
        agents: './agents',
        mcpServers: './.mcp.json',
        apps: './.app.json',
        interface: {
          displayName: 'extendai-lab',
          shortDescription:
            'Compatibility baseline and workflow layer for open-source coding CLIs.',
          developerName: 'ExtendAI Lab',
          category: 'Developer Tools',
        },
      }),
      renderJsonFile(`${CODEX_PLUGIN_CACHE_ROOT}/.app.json`, {
        managedBy: 'extendai-lab',
        runtime: context.runtime.id,
        status: 'compat-baseline',
      }),
      renderJsonFile(
        '.agents/plugins/marketplace.json',
        createCodexMarketplaceJson('extendai-lab-local', 'extendai-lab'),
      ),
    ];
  }

  return [];
}

function renderSkillPack(context: RendererContext): RenderedFile[] {
  const relativePath =
    context.runtime.family === 'codex'
      ? `${CODEX_PLUGIN_CACHE_ROOT}/${SKILL_PATH}`
      : SKILL_PATH;
  return [
    renderTextFile(
      relativePath,
      [
        '---',
        'name: extendai-lab-foundation',
        'description: Compatibility baseline for shared-prefix context, document-output safety, and host-aware planning',
        '---',
        '',
        '# ExtendAI Lab Foundation',
        '',
        `Runtime: ${context.runtime.displayName}`,
        '',
        'Use this skill as the compatibility baseline for shared-prefix context,',
        'document-output safety, and host-aware planning.',
        '',
        SHARED_PREFIX_SNAPSHOT_MARKDOWN,
      ].join('\n'),
    ),
  ];
}

function renderAgentPack(context: RendererContext): RenderedFile[] {
  // For OpenCode, agents are registered via SDK at runtime
  if (context.runtime.family === 'opencode') {
    return [];
  }

  // For OpenClaude/Codex, generate agent files for file-system discovery
  const agents = [
    {
      name: 'extendai-lab-orchestrator',
      description: `Main orchestrator for ${context.runtime.displayName}`,
      model: 'inherit',
      content: [
        '# ExtendAI Lab Orchestrator',
        '',
        'Main orchestrator agent that coordinates specialized subagents.',
        'Delegates to explorer, librarian, oracle, and other specialists.',
      ].join('\n'),
    },
    {
      name: 'extendai-lab-explorer',
      description: 'Fast codebase search and pattern matching',
      model: 'haiku',
      content: [
        '# Explorer',
        '',
        'Fast agent specialized for exploring codebases.',
        'Use for finding files, locating code patterns, and answering "where is X?" questions.',
      ].join('\n'),
    },
    {
      name: 'extendai-lab-librarian',
      description: 'External documentation and library research',
      model: 'haiku',
      content: [
        '# Librarian',
        '',
        'Authoritative source for current library docs and API references.',
        'Use for official docs lookup, GitHub examples, and understanding library internals.',
      ].join('\n'),
    },
    {
      name: 'extendai-lab-oracle',
      description: 'Strategic technical advisor and code reviewer',
      model: 'sonnet',
      content: [
        '# Oracle',
        '',
        'Strategic technical advisor for high-stakes decisions and persistent problems.',
        'Use for architecture decisions, complex debugging, code review, and engineering guidance.',
      ].join('\n'),
    },
  ];

  const baseDir =
    context.runtime.family === 'codex'
      ? `${CODEX_PLUGIN_CACHE_ROOT}/agents`
      : 'agents';

  return agents.map((agent) =>
    renderTextFile(
      `${baseDir}/${agent.name}.md`,
      [
        '---',
        `name: ${agent.name}`,
        `description: ${agent.description}`,
        `model: ${agent.model}`,
        '---',
        '',
        agent.content,
      ].join('\n'),
    ),
  );
}

function renderCommandPack(context: RendererContext): RenderedFile[] {
  const relativePath =
    context.runtime.family === 'codex'
      ? `${CODEX_PLUGIN_CACHE_ROOT}/${COMMAND_PATH}`
      : COMMAND_PATH;
  return [
    renderTextFile(
      relativePath,
      [
        '# ExtendAI Lab Baseline Command',
        '',
        `Runtime: ${context.runtime.displayName}`,
        '',
        'This command pack anchors compatibility setup, shared-prefix usage,',
        'and host-owned document output expectations.',
      ].join('\n'),
    ),
  ];
}

function renderMcpPack(context: RendererContext): RenderedFile[] {
  // We don't register any MCP servers by default.
  // Users can add their own MCP servers to the runtime's config.
  return [];
}

export const SHARED_PREFIX_SNAPSHOT_MARKDOWN = [
  '# Shared Prefix Snapshot',
  '',
  'Use this stable, repeated block before runtime-specific task instructions when parallel child sessions are worthwhile.',
  '',
  '[SHARED_CONTEXT_START]',
  'project: <repo/project name, stack, root path>',
  'task: <one-sentence current objective, <=50 words>',
  'constraints:',
  '- <non-negotiable constraints, license limits, user preferences>',
  'files_relevant:',
  '- <path>: <why it matters>',
  'decisions_made:',
  '- <decision and reason>',
  'open_questions:',
  '- <question or risk still unresolved>',
  'validation_status:',
  '- <checks run, failures, pending validation>',
  'do_not_reread:',
  '- <files/results already summarized well enough>',
  '[SHARED_CONTEXT_END]',
  '',
].join('\n');

const DOCUMENT_KIND_NOTES: DocumentKind[] = [
  'plan',
  'interview',
  'spec',
  'handoff',
  'review-report',
  'install-plan',
  'rollback-manifest',
];

export const CAPABILITY_RENDERERS: CapabilityRenderer[] = [
  {
    capability: 'shared-prefix-snapshot',
    render(_context) {
      return [
        renderTextFile(
          `${COMPAT_DIR}/shared-prefix-snapshot.md`,
          SHARED_PREFIX_SNAPSHOT_MARKDOWN,
        ),
      ];
    },
  },
  {
    capability: 'document-output',
    render(_context) {
      return [
        renderTextFile(
          `${COMPAT_DIR}/document-output.md`,
          [
            '# Document Output Contract',
            '',
            'Agents must not claim a document was saved unless the host-owned save receipt succeeded.',
            '',
            'Supported document kinds:',
            ...DOCUMENT_KIND_NOTES.map((kind) => `- ${kind}`),
            '',
          ].join('\n'),
        ),
      ];
    },
  },
  {
    capability: 'plugin-manifest',
    render: renderPluginManifest,
  },
  {
    capability: 'skills',
    render: renderSkillPack,
  },
  {
    capability: 'agents',
    render: renderAgentPack,
  },
  {
    capability: 'commands',
    render: renderCommandPack,
  },
  {
    capability: 'mcp',
    render: renderMcpPack,
  },
];

export function getCapabilityRenderer(
  capability: CompatibilityCapability,
): CapabilityRenderer | undefined {
  return CAPABILITY_RENDERERS.find(
    (renderer) => renderer.capability === capability,
  );
}

export function renderRuntimeCapabilities(
  context: RendererContext,
  capabilities: readonly CompatibilityCapability[],
): RenderedFile[] {
  return capabilities.flatMap(
    (capability) => getCapabilityRenderer(capability)?.render(context) ?? [],
  );
}
