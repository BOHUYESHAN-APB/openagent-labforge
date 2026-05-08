import type {
  CompatibilityCapability,
  RuntimeCompatibilityProfile,
} from './types';
import { RUNTIME_COMPATIBILITY_PROFILES } from './types';

export type CapabilityStatus = 'available' | 'degraded' | 'unavailable';

export interface CapabilityContract {
  id: CompatibilityCapability;
  requiredInputs: readonly string[];
  validation: string;
  fallback: string;
}

export interface CapabilityAssessment {
  capability: CompatibilityCapability;
  runtimeId: string;
  status: CapabilityStatus;
  reason: string;
  fallback?: string;
}

export const CAPABILITY_CONTRACTS = [
  {
    id: 'plugin-manifest',
    requiredInputs: ['runtime profile', 'target config path'],
    validation: 'Manifest file can be rendered and parsed by the host runtime.',
    fallback:
      'Install skills/MCP/rules only and mark plugin manifest unavailable.',
  },
  {
    id: 'agents',
    requiredInputs: ['agent definitions', 'runtime renderer'],
    validation:
      'Rendered agent assets exist and host runtime can discover them.',
    fallback:
      'Render agent guidance as skills/checklists for the primary agent.',
  },
  {
    id: 'subagents',
    requiredInputs: ['subagent policy', 'runtime subagent surface'],
    validation: 'Host can launch isolated child agents with explicit prompts.',
    fallback: 'Degrade to main-only specialist checklists.',
  },
  {
    id: 'skills',
    requiredInputs: ['skill source directory', 'target skill directory'],
    validation: 'Skill files are copied/rendered and visible to the runtime.',
    fallback: 'Render core skill guidance into runtime instructions.',
  },
  {
    id: 'hooks',
    requiredInputs: ['hook definitions', 'runtime hook lifecycle'],
    validation: 'Hook metadata is accepted by the host runtime.',
    fallback: 'Expose equivalent slash commands or manual checklist workflow.',
  },
  {
    id: 'commands',
    requiredInputs: ['command definitions', 'runtime command surface'],
    validation:
      'Commands appear in the host command list or command directory.',
    fallback:
      'Render command usage into instructions and quick reference docs.',
  },
  {
    id: 'mcp',
    requiredInputs: ['MCP server config', 'runtime MCP config path'],
    validation: 'Runtime can load the MCP server config without parse errors.',
    fallback: 'Continue with builtin/runtime-native tools only.',
  },
  {
    id: 'rules',
    requiredInputs: ['rules text', 'runtime rules path'],
    validation: 'Rules are written to the expected host config location.',
    fallback: 'Render rules into README/setup instructions only.',
  },
  {
    id: 'custom-modes',
    requiredInputs: ['mode definitions', 'runtime mode surface'],
    validation: 'Mode definitions are discoverable by the host runtime.',
    fallback: 'Use plain rules and skills without runtime modes.',
  },
  {
    id: 'shared-prefix-snapshot',
    requiredInputs: ['snapshot template', 'delegation policy'],
    validation: 'Rendered prompts contain a stable shared-prefix block.',
    fallback: 'Pass compact context directly in each delegation prompt.',
  },
  {
    id: 'backup-rollback',
    requiredInputs: ['install plan', 'backup root'],
    validation: 'Backup manifest is written before managed files are modified.',
    fallback:
      'Dry-run only; refuse destructive writes without rollback support.',
  },
  {
    id: 'document-output',
    requiredInputs: ['document-output service', 'target path policy'],
    validation:
      'Document save returns a host-owned receipt and real file path.',
    fallback:
      'Do not claim saved documents; output draft content in chat only.',
  },
] as const satisfies readonly CapabilityContract[];

const CAPABILITY_CONTRACT_BY_ID = new Map(
  CAPABILITY_CONTRACTS.map((contract) => [contract.id, contract]),
);

export function getCapabilityContract(
  capability: CompatibilityCapability,
): CapabilityContract {
  const contract = CAPABILITY_CONTRACT_BY_ID.get(capability);
  if (!contract) {
    throw new Error(`Unknown compatibility capability: ${capability}`);
  }
  return contract;
}

export function assessCapability(
  runtime: RuntimeCompatibilityProfile,
  capability: CompatibilityCapability,
): CapabilityAssessment {
  const contract = getCapabilityContract(capability);
  if (runtime.capabilities.includes(capability)) {
    return {
      capability,
      runtimeId: runtime.id,
      status: 'available',
      reason: `${runtime.displayName} declares ${capability} support.`,
    };
  }

  if (runtime.tier === 'full-plugin') {
    return {
      capability,
      runtimeId: runtime.id,
      status: 'degraded',
      reason: `${runtime.displayName} is a full-plugin target, but ${capability} is not declared yet.`,
      fallback: contract.fallback,
    };
  }

  return {
    capability,
    runtimeId: runtime.id,
    status: 'unavailable',
    reason: `${runtime.displayName} is ${runtime.tier}; ${capability} is outside the current support surface.`,
    fallback: contract.fallback,
  };
}

export function assessRuntimeCapabilities(
  runtime: RuntimeCompatibilityProfile,
  capabilities: readonly CompatibilityCapability[] = CAPABILITY_CONTRACTS.map(
    (contract) => contract.id,
  ),
): CapabilityAssessment[] {
  return capabilities.map((capability) =>
    assessCapability(runtime, capability),
  );
}

export function getRuntimeCapabilityMatrix(): CapabilityAssessment[] {
  return RUNTIME_COMPATIBILITY_PROFILES.flatMap((runtime) =>
    assessRuntimeCapabilities(runtime),
  );
}
