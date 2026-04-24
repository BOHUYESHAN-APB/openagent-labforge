import { populateModelContextLimitsCache } from "./shared/connected-providers-cache"

export interface ModelCacheState {
  modelContextLimitsCache: Map<string, number>;
  anthropicContext1MEnabled: boolean;
}

export function createModelCacheState(): ModelCacheState {
  const state: ModelCacheState = {
    modelContextLimitsCache: new Map<string, number>(),
    anthropicContext1MEnabled: false,
  };

  // Populate from OpenCode's provider cache if available
  populateModelContextLimitsCache(state.modelContextLimitsCache);

  return state;
}
