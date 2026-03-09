import type { ModelCacheState } from "../plugin-state";

type ProviderConfig = {
  options?: { headers?: Record<string, string> };
  models?: Record<string, { limit?: { context?: number } }>;
};

function ensureAutoProvider(config: Record<string, unknown>): void {
  const rawProviders = config.provider;
  const providers: Record<string, ProviderConfig> =
    typeof rawProviders === "object" && rawProviders !== null
      ? (rawProviders as Record<string, ProviderConfig>)
      : {};

  const autoProvider = providers.auto ?? {};
  const autoModels = autoProvider.models ?? {};

  providers.auto = {
    ...autoProvider,
    models: {
      auto: {},
      "auto/quick": {},
      "auto/deep": {},
      "auto/ultrabrain": {},
      "auto/writing": {},
      "auto/visual-engineering": {},
      ...autoModels,
    },
  };

  config.provider = providers;
}

export function applyProviderConfig(params: {
  config: Record<string, unknown>;
  modelCacheState: ModelCacheState;
}): void {
  ensureAutoProvider(params.config);

  const providers = params.config.provider as
    | Record<string, ProviderConfig>
    | undefined;

  const anthropicBeta = providers?.anthropic?.options?.headers?.["anthropic-beta"];
  params.modelCacheState.anthropicContext1MEnabled =
    anthropicBeta?.includes("context-1m") ?? false;

  if (!providers) return;

  for (const [providerID, providerConfig] of Object.entries(providers)) {
    const models = providerConfig?.models;
    if (!models) continue;

    for (const [modelID, modelConfig] of Object.entries(models)) {
      const contextLimit = modelConfig?.limit?.context;
      if (!contextLimit) continue;

      params.modelCacheState.modelContextLimitsCache.set(
        `${providerID}/${modelID}`,
        contextLimit,
      );
    }
  }
}
