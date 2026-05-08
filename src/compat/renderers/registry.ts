import type { DocumentKind } from '../../document-output';
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
        skills: './skills',
        commands: './commands',
        agents: './agents',
        mcpServers: './.mcp.json',
      }),
    ];
  }

  if (context.runtime.family === 'codex') {
    return [
      renderJsonFile('.codex-plugin/plugin.json', {
        name: 'extendai-lab',
        version: '0.0.0-compat',
        description: 'ExtendAI Lab compatibility baseline for Codex.',
        skills: './skills',
        agents: './agents',
        mcpServers: './.mcp.json',
        apps: './.app.json',
      }),
      renderJsonFile('.app.json', {
        managedBy: 'extendai-lab',
        runtime: context.runtime.id,
        status: 'compat-baseline',
      }),
      renderJsonFile('.agents/plugins/marketplace.json', {
        marketplaces: [
          {
            name: 'extendai-lab-local',
            source: './plugins/extendai-lab',
            plugins: ['extendai-lab'],
          },
        ],
      }),
    ];
  }

  return [];
}

function renderSkillPack(context: RendererContext): RenderedFile[] {
  return [
    renderTextFile(
      SKILL_PATH,
      [
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
  return [
    renderTextFile(
      AGENT_PATH,
      [
        '---',
        'name: extendai-lab-orchestrator',
        `description: Compatibility baseline orchestrator for ${context.runtime.displayName}`,
        'tools: inherit',
        '---',
        '',
        '# ExtendAI Lab Orchestrator',
        '',
        'Prefer host-native plugin surfaces first, then fall back to runtime-safe',
        'skills, commands, and MCP configuration.',
      ].join('\n'),
    ),
  ];
}

function renderCommandPack(context: RendererContext): RenderedFile[] {
  return [
    renderTextFile(
      COMMAND_PATH,
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
  return [
    renderJsonFile('.mcp.json', {
      mcpServers: {
        'shared-context-server': {
          managedBy: 'extendai-lab',
          runtime: context.runtime.id,
          disabled: true,
          note: 'Optional shared session bridge for compatibility mode.',
        },
      },
    }),
  ];
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
