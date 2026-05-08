import type { CapabilityAssessment, CapabilityStatus } from './capabilities';
import { assessRuntimeCapabilities } from './capabilities';
import type {
  CompatibilityCapability,
  RuntimeCompatibilityProfile,
} from './types';

export interface DegradationRule {
  capability: CompatibilityCapability;
  degradeTo: string;
  userImpact: string;
}

export interface CapabilityDegradation {
  capability: CompatibilityCapability;
  status: CapabilityStatus;
  degradeTo: string;
  reason: string;
  userImpact: string;
}

export const CAPABILITY_DEGRADATION_RULES: readonly DegradationRule[] = [
  {
    capability: 'subagents',
    degradeTo: 'main-only/checklists',
    userImpact:
      'Main agent should keep specialist guidance as local checklists instead of launching child sessions.',
  },
  {
    capability: 'hooks',
    degradeTo: 'commands/manual workflow',
    userImpact:
      'Lifecycle automation becomes explicit command flow or manual checklist steps.',
  },
  {
    capability: 'mcp',
    degradeTo: 'builtin-only tools',
    userImpact:
      'External MCP integrations are skipped; continue with host-native or built-in tools only.',
  },
];

const DEGRADATION_RULE_MAP = new Map(
  CAPABILITY_DEGRADATION_RULES.map((rule) => [rule.capability, rule]),
);

export function getDegradationRule(
  capability: CompatibilityCapability,
): DegradationRule | undefined {
  return DEGRADATION_RULE_MAP.get(capability);
}

export function applyCapabilityDegradation(
  assessment: CapabilityAssessment,
): CapabilityDegradation | undefined {
  const rule = getDegradationRule(assessment.capability);
  if (!rule) return undefined;
  if (assessment.status === 'available') return undefined;

  return {
    capability: assessment.capability,
    status: assessment.status,
    degradeTo: rule.degradeTo,
    reason: assessment.reason,
    userImpact: rule.userImpact,
  };
}

export function getRuntimeDegradations(
  runtime: RuntimeCompatibilityProfile,
): CapabilityDegradation[] {
  return assessRuntimeCapabilities(runtime)
    .map(applyCapabilityDegradation)
    .filter((degradation): degradation is CapabilityDegradation =>
      Boolean(degradation),
    );
}
