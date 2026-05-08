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

const profile = getRuntimeCompatibilityProfile('openclaude');
if (!profile) throw new Error('Missing OpenClaude runtime profile');

function getOpenClaudeConfigCandidates(): string[] {
  return [join(homedir(), '.openclaude'), join(homedir(), '.claude')];
}

function resolveOpenClaudeConfigCandidates(
  context: RuntimeAdapterContext,
): string[] {
  return context.runtimeRoot
    ? [context.runtimeRoot]
    : getOpenClaudeConfigCandidates();
}

function getClaudeMcpConfigPath(configRoot: string): string {
  return join(configRoot, '.claude.json');
}

function getOpenClaudeRequiredPaths(configRoot: string): string[] {
  return [
    join(configRoot, '.claude-plugin', 'plugin.json'),
    join(configRoot, '.mcp.json'),
    join(configRoot, 'skills', 'extendai-lab-foundation', 'SKILL.md'),
    join(configRoot, 'agents', 'extendai-lab-orchestrator.md'),
    join(configRoot, 'commands', 'extendai-lab-baseline.md'),
    getClaudeMcpConfigPath(configRoot),
  ];
}

function renderOpenClaudeManagedConfig(configRoot: string): RenderedFile {
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

export const openclaudeAdapter: RuntimeAdapter = {
  profile,
  detect(context: RuntimeAdapterContext): RuntimeDetectionResult {
    const configPaths = resolveOpenClaudeConfigCandidates(context);
    const detectedPath = configPaths.find((path) => existsSync(path));

    return {
      runtimeId: profile.id,
      available: Boolean(detectedPath),
      configPaths,
      warnings: detectedPath
        ? []
        : [
            'OpenClaude config directory was not found. Install is dry-run only.',
          ],
    };
  },
  assess() {
    return assessRuntimeCapabilities(profile);
  },
  render(context: RuntimeAdapterContext) {
    const configRoot =
      this.detect(context).configPaths.find((path) => existsSync(path)) ??
      context.runtimeRoot ??
      join(homedir(), '.openclaude');

    const files = renderRuntimeCapabilities(
      { runtime: profile, workspaceRoot: context.workspaceRoot },
      profile.capabilities,
    ).map((file) => ({
      ...file,
      path: join(configRoot, file.relativePath),
    }));

    return [...files, renderOpenClaudeManagedConfig(configRoot)];
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
      `OpenClaude adapter renders ${plan.files.length} compatibility asset(s) in dry-run planning mode.`,
    );
  },
  validate(context: RuntimeAdapterContext): RuntimeValidationResult {
    const detected = this.detect(context);
    const configRoot =
      detected.configPaths.find((path) => existsSync(path)) ??
      context.runtimeRoot ??
      join(homedir(), '.openclaude');

    if (!detected.available && !context.runtimeRoot) {
      return {
        runtimeId: profile.id,
        ok: false,
        findings: detected.warnings,
      };
    }

    const missingPaths = getOpenClaudeRequiredPaths(configRoot).filter(
      (path) => !existsSync(path),
    );

    return {
      runtimeId: profile.id,
      ok: missingPaths.length === 0,
      findings:
        missingPaths.length === 0
          ? [
              'OpenClaude required assets are present.',
              'Reload/restart the Claude-family runtime to activate new plugin assets and MCP config.',
            ]
          : [
              'OpenClaude install is incomplete. Missing required assets:',
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
