import type { OhMyOpenCodeConfig } from "../config";
import { loadMcpConfigs } from "../features/claude-code-mcp-loader";
import { createBuiltinMcps } from "../mcp";
import type { PluginComponents } from "./plugin-components-loader";

type McpEntry = Record<string, unknown>;

function setMcpEnabled(
  merged: Record<string, McpEntry>,
  name: string,
  enabled: boolean,
): void {
  if (!merged[name]) return
  merged[name] = { ...merged[name], enabled }
}

function applyMcpPolicy(
  merged: Record<string, McpEntry>,
  pluginConfig: OhMyOpenCodeConfig,
): void {
  const policy = pluginConfig.mcp_policy
  if (!policy) return

  for (const name of policy.enable ?? []) {
    setMcpEnabled(merged, name, true)
  }

  for (const name of policy.disable ?? []) {
    setMcpEnabled(merged, name, false)
  }

  const profile = policy.network_profile ?? "auto"
  if (profile === "restricted") {
    setMcpEnabled(merged, "paper_search_mcp", false)
    setMcpEnabled(merged, "semantic_scholar_fastmcp", false)
  }

  const bingFallback = policy.bing_cn_english_fallback ?? true
  const bingEnabled =
    Boolean(merged.bing_cn_mcp) &&
    merged.bing_cn_mcp.enabled !== false

  if (bingFallback && bingEnabled) {
    setMcpEnabled(merged, "websearch", true)
  }
}

function captureUserDisabledMcps(
  userMcp: Record<string, unknown> | undefined
): Set<string> {
  const disabled = new Set<string>();
  if (!userMcp) return disabled;

  for (const [name, value] of Object.entries(userMcp)) {
    if (
      value &&
      typeof value === "object" &&
      "enabled" in value &&
      (value as McpEntry).enabled === false
    ) {
      disabled.add(name);
    }
  }

  return disabled;
}

export async function applyMcpConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  pluginComponents: PluginComponents;
}): Promise<void> {
  const disabledMcps = params.pluginConfig.disabled_mcps ?? [];
  const userMcp = params.config.mcp as Record<string, unknown> | undefined;
  const userDisabledMcps = captureUserDisabledMcps(userMcp);

  const mcpResult = params.pluginConfig.claude_code?.mcp ?? true
    ? await loadMcpConfigs(disabledMcps)
    : { servers: {} };

  const merged = {
    ...createBuiltinMcps(disabledMcps, params.pluginConfig),
    ...(userMcp ?? {}),
    ...mcpResult.servers,
    ...params.pluginComponents.mcpServers,
  } as Record<string, McpEntry>;

  applyMcpPolicy(merged, params.pluginConfig)

  for (const name of userDisabledMcps) {
    if (merged[name]) {
      merged[name] = { ...merged[name], enabled: false };
    }
  }

  const disabledSet = new Set(disabledMcps);
  for (const name of disabledSet) {
    delete merged[name];
  }

  params.config.mcp = merged;
}
