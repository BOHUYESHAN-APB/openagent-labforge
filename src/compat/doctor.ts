import { assessRuntimeCapabilities } from './capabilities';
import type {
  CompatibilityCapability,
  RuntimeCompatibilityProfile,
} from './types';
import { getRuntimeCompatibilityProfile } from './types';

export interface RuntimeDoctorReport {
  runtimeId: string;
  displayName: string;
  tier: RuntimeCompatibilityProfile['tier'];
  priority: RuntimeCompatibilityProfile['priority'];
  capabilitySummary: {
    available: number;
    degraded: number;
    unavailable: number;
  };
  missingCapabilities: CompatibilityCapability[];
  degradedCapabilities: CompatibilityCapability[];
}

export function createRuntimeDoctorReport(
  runtimeId: string,
): RuntimeDoctorReport {
  const profile = getRuntimeCompatibilityProfile(runtimeId);
  if (!profile) throw new Error(`Unknown runtime: ${runtimeId}`);

  const assessments = assessRuntimeCapabilities(profile);
  const summary = { available: 0, degraded: 0, unavailable: 0 };
  const missingCapabilities: CompatibilityCapability[] = [];
  const degradedCapabilities: CompatibilityCapability[] = [];

  for (const assessment of assessments) {
    summary[assessment.status] += 1;
    if (assessment.status === 'unavailable') {
      missingCapabilities.push(assessment.capability);
    }
    if (assessment.status === 'degraded') {
      degradedCapabilities.push(assessment.capability);
    }
  }

  return {
    runtimeId: profile.id,
    displayName: profile.displayName,
    tier: profile.tier,
    priority: profile.priority,
    capabilitySummary: summary,
    missingCapabilities,
    degradedCapabilities,
  };
}

export function createRuntimeDoctorMatrix(
  runtimeIds: readonly string[],
): RuntimeDoctorReport[] {
  return runtimeIds.map(createRuntimeDoctorReport);
}
