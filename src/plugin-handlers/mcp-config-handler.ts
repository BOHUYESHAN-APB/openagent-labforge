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

  const searchFallback = policy.search_english_fallback ?? policy.bing_cn_english_fallback ?? true
  const searchMcpEnabled =
    Boolean(merged.open_websearch_mcp) &&
    merged.open_websearch_mcp.enabled !== false

  if (searchFallback && searchMcpEnabled) {
    setMcpEnabled(merged, "websearch", true)
  }
}

function isPromptNotSupportedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const maybeMessage =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : ""

  return maybeMessage.includes("Method not found") || maybeMessage.includes("-32601")
}

function withPromptProbeCompatibility(merged: Record<string, McpEntry>): Record<string, McpEntry> {
  const compatWrapped = { ...merged }

  for (const [name, entry] of Object.entries(compatWrapped)) {
    if (!entry || typeof entry !== "object") continue
    if (
      name !== "context7" &&
      name !== "grep_app" &&
      name !== "websearch" &&
      name !== "open_websearch_mcp"
    ) {
      continue
    }

    const original = entry as Record<string, unknown>
    const wrapped: Record<string, unknown> = { ...original }

    if (typeof wrapped.onCallError !== "function") {
      wrapped.onCallError = (error: unknown, operation?: string) => {
        if (operation === "prompts" && isPromptNotSupportedError(error)) {
          return { handled: true, level: "debug" }
        }
        return undefined
      }
    }

    compatWrapped[name] = wrapped
  }

  return compatWrapped
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

  params.config.mcp = withPromptProbeCompatibility(merged);
}
