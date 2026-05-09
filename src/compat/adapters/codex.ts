import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type {
  RuntimeAdapter,
  RuntimeAdapterContext,
  RuntimeDetectionResult,
  RuntimeValidationResult,
} from '../adapter';
import { assessRuntimeCapabilities } from '../capabilities';
import {
  mergeCodexMarketplaceRegistration,
  mergeCodexMcpServers,
} from '../config-writers';
import {
  addPlanFile,
  addPlanMessage,
  createInstallPlan,
  type RenderedFile,
} from '../install-plan';
import { renderRuntimeCapabilities } from '../renderers';
import { createRollbackPlan } from '../rollback';
import { getRuntimeCompatibilityProfile } from '../types';

const profile = getRuntimeCompatibilityProfile('codex');
if (!profile) throw new Error('Missing Codex runtime profile');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJsonObject(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined;

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function resolveCodexConfigRoot(context: RuntimeAdapterContext): string {
  return context.runtimeRoot ?? join(homedir(), '.codex');
}

function getCodexRequiredPaths(configRoot: string): string[] {
  return [
    join(configRoot, '.codex-plugin', 'plugin.json'),
    join(configRoot, '.mcp.json'),
    join(configRoot, '.app.json'),
    join(configRoot, '.agents', 'plugins', 'marketplace.json'),
    join(configRoot, 'skills', 'extendai-lab-foundation', 'SKILL.md'),
    join(configRoot, 'agents', 'extendai-lab-orchestrator.md'),
    join(configRoot, 'commands', 'extendai-lab-baseline.md'),
    join(configRoot, 'config.toml'),
  ];
}

function renderCodexManagedConfig(configRoot: string): RenderedFile {
  const configPath = join(configRoot, 'config.toml');
  const existingContent = existsSync(configPath)
    ? readFileSync(configPath, 'utf8')
    : '';
  const mergedMcp = mergeCodexMcpServers(existingContent, {
    'shared-context-server': {
      command: 'npx',
      args: ['shared-context-server'],
      type: 'stdio',
      timeout: 15,
    },
  });
  const mergedMarketplace = mergeCodexMarketplaceRegistration(
    mergedMcp.content,
    'extendai-lab-local',
    configRoot,
  );

  return {
    path: configPath,
    relativePath: 'config.toml',
    content: mergedMarketplace.content,
    action:
      mergedMcp.changed || mergedMarketplace.changed
        ? existingContent
          ? 'update'
          : 'create'
        : 'skip',
    managed: true,
  };
}

export const codexAdapter: RuntimeAdapter = {
  profile,
  detect(context: RuntimeAdapterContext): RuntimeDetectionResult {
    const configPath = resolveCodexConfigRoot(context);
    return {
      runtimeId: profile.id,
      available: existsSync(configPath),
      configPaths: [configPath],
      warnings: existsSync(configPath)
        ? []
        : ['Codex config directory was not found. Install is dry-run only.'],
    };
  },
  assess() {
    return assessRuntimeCapabilities(profile);
  },
  render(context: RuntimeAdapterContext) {
    const configRoot =
      this.detect(context).configPaths[0] ?? resolveCodexConfigRoot(context);
    const files = renderRuntimeCapabilities(
      { runtime: profile, workspaceRoot: context.workspaceRoot },
      profile.capabilities,
    ).map((file) => ({
      ...file,
      path: join(configRoot, file.relativePath),
    }));

    return [...files, renderCodexManagedConfig(configRoot)];
  },
  planInstall(context: RuntimeAdapterContext) {
    const plan = createInstallPlan({
      runtimeId: profile.id,
      runtimeDisplayName: profile.displayName,
      dryRun: context.dryRun ?? true,
      capabilities: profile.capabilities,
    });
    for (const file of this.render(context)) {
      addPlanFile(plan, file);
    }
    return addPlanMessage(
      plan,
      'info',
      `Codex adapter renders ${plan.files.length} compatibility asset(s) in dry-run planning mode.`,
    );
  },
  validate(context: RuntimeAdapterContext): RuntimeValidationResult {
    const detected = this.detect(context);
    const configRoot = resolveCodexConfigRoot(context);

    if (!detected.available && !context.runtimeRoot) {
      return {
        runtimeId: profile.id,
        ok: false,
        findings: detected.warnings,
      };
    }

    const missingPaths = getCodexRequiredPaths(configRoot).filter(
      (path) => !existsSync(path),
    );
    const configPath = join(configRoot, 'config.toml');
    const configContent = existsSync(configPath)
      ? readFileSync(configPath, 'utf8')
      : '';
    const pluginManifest = readJsonObject(
      join(configRoot, '.codex-plugin', 'plugin.json'),
    );
    const marketplaceJson = readJsonObject(
      join(configRoot, '.agents', 'plugins', 'marketplace.json'),
    );
    const mcpJson = readJsonObject(join(configRoot, '.mcp.json'));
    const missingManagedBlocks: string[] = [];
    if (
      configContent &&
      !configContent.includes('# BEGIN EXTENDAI LAB MANAGED MCP REGISTRY')
    ) {
      missingManagedBlocks.push(
        'config.toml is missing the managed MCP registry block.',
      );
    }
    if (
      configContent &&
      !configContent.includes(
        '# BEGIN EXTENDAI LAB MANAGED MARKETPLACE REGISTRATION',
      )
    ) {
      missingManagedBlocks.push(
        'config.toml is missing the managed marketplace registration block.',
      );
    }

    if (
      configContent &&
      !configContent.includes('[marketplaces.extendai-lab-local]')
    ) {
      missingManagedBlocks.push(
        'config.toml does not register the extendai-lab-local marketplace table.',
      );
    }
    if (configContent && !configContent.includes('source_type = "local"')) {
      missingManagedBlocks.push(
        'config.toml marketplace registration is missing source_type = "local".',
      );
    }
    if (
      configContent &&
      !configContent.includes(
        `source = "${configRoot.replaceAll('\\', '\\\\')}"`,
      )
    ) {
      missingManagedBlocks.push(
        'config.toml marketplace registration does not point to the active runtime root.',
      );
    }

    const activationFindings: string[] = [];
    if (
      pluginManifest &&
      (pluginManifest.name !== 'extendai-lab' ||
        pluginManifest.skills !== './skills' ||
        pluginManifest.mcpServers !== './.mcp.json' ||
        pluginManifest.apps !== './.app.json')
    ) {
      activationFindings.push(
        'plugin.json does not match the expected Codex plugin manifest shape for ExtendAI Lab.',
      );
    }

    const marketplacePlugins = Array.isArray(marketplaceJson?.plugins)
      ? marketplaceJson.plugins
      : [];
    const extendAiPluginEntry = marketplacePlugins.find((entry) => {
      if (!isRecord(entry)) return false;
      const source = isRecord(entry.source) ? entry.source : undefined;
      const policy = isRecord(entry.policy) ? entry.policy : undefined;
      return (
        entry.name === 'extendai-lab' &&
        source?.source === 'local' &&
        source.path === './plugins/extendai-lab' &&
        policy?.installation === 'AVAILABLE' &&
        policy?.authentication === 'ON_INSTALL'
      );
    });
    if (
      marketplaceJson &&
      (marketplaceJson.name !== 'extendai-lab-local' || !extendAiPluginEntry)
    ) {
      activationFindings.push(
        'marketplace.json does not contain the expected ExtendAI Lab local marketplace/plugin entry.',
      );
    }

    const mcpServers = isRecord(mcpJson?.mcpServers)
      ? mcpJson.mcpServers
      : undefined;
    if (mcpJson && !isRecord(mcpServers?.['shared-context-server'])) {
      activationFindings.push(
        '.mcp.json is missing the shared-context-server MCP entry.',
      );
    }

    return {
      runtimeId: profile.id,
      ok:
        missingPaths.length === 0 &&
        missingManagedBlocks.length === 0 &&
        activationFindings.length === 0,
      findings:
        missingPaths.length === 0 &&
        missingManagedBlocks.length === 0 &&
        activationFindings.length === 0
          ? [
              'Codex required assets are present.',
              'Codex activation bridge is semantically consistent (plugin manifest, marketplace registration, marketplace index, and MCP config).',
              'Reload/restart Codex so new plugin assets, marketplace metadata, and managed config are re-read.',
            ]
          : [
              'Codex install is incomplete. Missing required assets:',
              ...missingPaths.map((path) => `- ${path}`),
              ...missingManagedBlocks.map((line) => `- ${line}`),
              ...activationFindings.map((line) => `- ${line}`),
            ],
    };
  },
  rollback(context: RuntimeAdapterContext) {
    return createRollbackPlan({
      runtimeId: profile.id,
      runtimeDisplayName: profile.displayName,
      dryRun: context.dryRun,
      manifestPath: context.manifestPath,
    });
  },
};
