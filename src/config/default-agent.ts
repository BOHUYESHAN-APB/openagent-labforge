import { DEFAULT_VISIBLE_AGENT_NAME } from './constants';

/**
 * Apply LabForge's default visible agent when the user has not configured one.
 *
 * Keep this pointing at the host-facing display name. Internal IDs such as
 * `orchestrator` are registered as hidden aliases after display-name migration;
 * using a hidden alias here can make OpenCode fall back to another visible
 * primary agent.
 */
export function applyDefaultAgent(
  opencodeConfig: Record<string, unknown>,
  setDefaultAgent: boolean,
  preferredDefaultAgent?: string,
): void {
  if (!setDefaultAgent) return;
  if ((opencodeConfig as { default_agent?: string }).default_agent) return;

  (opencodeConfig as { default_agent?: string }).default_agent =
    preferredDefaultAgent || DEFAULT_VISIBLE_AGENT_NAME;
}

export function resolvePreferredDefaultAgent(
  config:
    | { defaultAgentName?: string; defaultVisibleAgent?: string }
    | undefined,
): string | undefined {
  if (!config) return undefined;
  return config.defaultAgentName || config.defaultVisibleAgent;
}
