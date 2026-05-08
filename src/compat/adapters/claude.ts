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
import { mergeClaudeMcpServers } from '../config-writers';
import {
  addPlanFile,
  addPlanMessage,
  createInstallPlan,
  type RenderedFile,
} from '../install-plan';
import { renderRuntimeCapabilities } from '../renderers';
import { createRollbackPlan } from '../rollback';
import { getRuntimeCompatibilityProfile } from '../types';

const profile = getRuntimeCompatibilityProfile('claude-code');
if (!profile) throw new Error('Missing Claude runtime profile');

function getClaudeMcpConfigPath(configRoot: string): string {
  return join(configRoot, '.claude.json');
}

function resolveClaudeConfigRoot(context: RuntimeAdapterContext): string {
  return context.runtimeRoot ?? join(homedir(), '.claude');
}

function renderClaudeManagedConfig(configRoot: string): RenderedFile {
  const configPath = getClaudeMcpConfigPath(configRoot);
  const existingContent = existsSync(configPath)
    ? readFileSync(configPath, 'utf8')
    : undefined;
  const merged = mergeClaudeMcpServers(
    existingContent,
    {
      'shared-context-server': {
        command: 'npx',
        args: ['shared-context-server'],
        enabled: false,
        type: 'stdio',
      },
    },
    ['shared-context-server'],
  );

  return {
    path: configPath,
    relativePath: '.claude.json',
    content: merged.content,
    action: merged.changed ? (existingContent ? 'update' : 'create') : 'skip',
    managed: true,
  };
}

export const claudeAdapter: RuntimeAdapter = {
  profile,
  detect(context: RuntimeAdapterContext): RuntimeDetectionResult {
    const configPath = resolveClaudeConfigRoot(context);
    return {
      runtimeId: profile.id,
      available: existsSync(configPath),
      configPaths: [configPath],
      warnings: existsSync(configPath)
        ? []
        : ['Claude config directory was not found. Install is dry-run only.'],
    };
  },
  assess() {
    return assessRuntimeCapabilities(profile);
  },
  render(context: RuntimeAdapterContext) {
    const configRoot =
      this.detect(context).configPaths[0] ?? resolveClaudeConfigRoot(context);
    const files = renderRuntimeCapabilities(
      { runtime: profile, workspaceRoot: context.workspaceRoot },
      profile.capabilities,
    ).map((file) => ({
      ...file,
      path: join(configRoot, file.relativePath),
    }));

    return [...files, renderClaudeManagedConfig(configRoot)];
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
      `Claude adapter renders ${plan.files.length} compatibility asset(s) in dry-run planning mode.`,
    );
  },
  validate(context: RuntimeAdapterContext): RuntimeValidationResult {
    const detected = this.detect(context);
    return {
      runtimeId: profile.id,
      ok: detected.available,
      findings: detected.available
        ? ['Claude config directory is present.']
        : detected.warnings,
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
