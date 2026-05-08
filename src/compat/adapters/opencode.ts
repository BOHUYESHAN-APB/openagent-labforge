import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  RuntimeAdapter,
  RuntimeAdapterContext,
  RuntimeDetectionResult,
  RuntimeValidationResult,
} from '../adapter';
import { assessRuntimeCapabilities } from '../capabilities';
import { addPlanMessage, createInstallPlan } from '../install-plan';
import { renderRuntimeCapabilities } from '../renderers';
import { createRollbackPlan } from '../rollback';
import { getRuntimeCompatibilityProfile } from '../types';

const profile = getRuntimeCompatibilityProfile('opencode');
if (!profile) throw new Error('Missing OpenCode runtime profile');

export const opencodeAdapter: RuntimeAdapter = {
  profile,
  detect(context: RuntimeAdapterContext): RuntimeDetectionResult {
    const configPath = join(context.workspaceRoot, '.opencode');
    return {
      runtimeId: profile.id,
      available: existsSync(configPath),
      configPaths: [configPath],
      warnings: existsSync(configPath)
        ? []
        : ['Project .opencode directory was not found yet.'],
    };
  },
  assess() {
    return assessRuntimeCapabilities(profile);
  },
  render(context: RuntimeAdapterContext) {
    const configRoot = join(context.workspaceRoot, '.opencode');
    return renderRuntimeCapabilities(
      { runtime: profile, workspaceRoot: context.workspaceRoot },
      ['shared-prefix-snapshot', 'document-output'],
    ).map((file) => ({
      ...file,
      path: join(configRoot, file.relativePath),
    }));
  },
  planInstall(context: RuntimeAdapterContext) {
    const plan = createInstallPlan({
      runtimeId: profile.id,
      runtimeDisplayName: profile.displayName,
      dryRun: context.dryRun ?? true,
      capabilities: profile.capabilities,
    });
    return addPlanMessage(
      plan,
      'info',
      'OpenCode adapter reuses the existing native installer path.',
    );
  },
  validate(context: RuntimeAdapterContext): RuntimeValidationResult {
    const detected = this.detect(context);
    return {
      runtimeId: profile.id,
      ok: detected.available,
      findings: detected.available
        ? ['OpenCode project config directory is present.']
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
