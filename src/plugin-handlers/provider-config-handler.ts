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

  // Check for explicit 1M context beta header (for older Claude 3.x models)
  const anthropicBeta = providers?.anthropic?.options?.headers?.["anthropic-beta"];
  const hasBetaHeader = anthropicBeta?.includes("context-1m") ?? false;

  // Check if any model has context limit >= 1M configured
  let hasLargeContextModel = false;
  if (providers) {
    for (const providerConfig of Object.values(providers)) {
      const models = providerConfig?.models;
      if (!models) continue;

      for (const modelConfig of Object.values(models)) {
        const contextLimit = modelConfig?.limit?.context;
        if (contextLimit && contextLimit >= 1_000_000) {
          hasLargeContextModel = true;
          break;
        }
      }
      if (hasLargeContextModel) break;
    }
  }

  // Enable 1M context if either beta header is present OR any large context model is configured
  params.modelCacheState.anthropicContext1MEnabled = hasBetaHeader || hasLargeContextModel;

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
