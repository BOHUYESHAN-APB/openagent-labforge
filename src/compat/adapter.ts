import type { CapabilityAssessment } from './capabilities';
import type { InstallPlan, RenderedFile } from './install-plan';
import type { RuntimeCompatibilityProfile } from './types';

export interface RuntimeDetectionResult {
  runtimeId: string;
  available: boolean;
  version?: string;
  configPaths: string[];
  warnings: string[];
}

export interface RuntimeAdapterContext {
  workspaceRoot: string;
  dryRun?: boolean;
  manifestPath?: string;
  runtimeRoot?: string;
}

export interface RuntimeValidationResult {
  runtimeId: string;
  ok: boolean;
  findings: string[];
}

export interface RuntimeAdapter {
  profile: RuntimeCompatibilityProfile;
  detect(context: RuntimeAdapterContext): RuntimeDetectionResult;
  assess(context: RuntimeAdapterContext): CapabilityAssessment[];
  render(context: RuntimeAdapterContext): RenderedFile[];
  planInstall(context: RuntimeAdapterContext): InstallPlan;
  validate(context: RuntimeAdapterContext): RuntimeValidationResult;
  rollback(context: RuntimeAdapterContext): InstallPlan;
}
