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
import { mergeCodexMcpServers } from '../config-writers';
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
  const merged = mergeCodexMcpServers(existingContent, {
    'shared-context-server': {
      command: 'npx',
      args: ['shared-context-server'],
      type: 'stdio',
      timeout: 15,
    },
  });

  return {
    path: configPath,
    relativePath: 'config.toml',
    content: merged.content,
    action: merged.changed ? (existingContent ? 'update' : 'create') : 'skip',
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

    return {
      runtimeId: profile.id,
      ok: missingPaths.length === 0,
      findings:
        missingPaths.length === 0
          ? [
              'Codex required assets are present.',
              'Reload/restart Codex so new plugin assets, marketplace metadata, and managed config are re-read.',
            ]
          : [
              'Codex install is incomplete. Missing required assets:',
              ...missingPaths.map((path) => `- ${path}`),
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
