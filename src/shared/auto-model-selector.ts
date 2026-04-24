import { readProviderModelsCache, readConnectedProvidersCache } from "./connected-providers-cache"
import { log } from "./logger"

export interface ModelPreference {
  preferred_model?: string
  fallback_models?: string[]
}

/**
 * Detect if DeepSeek provider is available.
 * Checks both 'deepseek' and 'opencode' providers.
 */
export function detectDeepSeekAvailability(): boolean {
  const connectedProviders = readConnectedProvidersCache()
  if (!connectedProviders) {
    log("[auto-model-selector] No connected providers cache available")
    return false
  }

  const hasDeepSeek = connectedProviders.includes('deepseek') || connectedProviders.includes('opencode')
  log("[auto-model-selector] DeepSeek availability", { hasDeepSeek, connectedProviders })
  return hasDeepSeek
}

/**
 * Check if a specific model is available in the provider models cache.
 */
export function isModelAvailable(modelId: string): boolean {
  const cache = readProviderModelsCache()
  if (!cache) {
    log("[auto-model-selector] No provider models cache available")
    return false
  }

  const [providerID, modelName] = modelId.split('/')
  if (!providerID || !modelName) {
    log("[auto-model-selector] Invalid model ID format", { modelId })
    return false
  }

  const models = cache.models[providerID]
  if (!Array.isArray(models)) {
    return false
  }

  const found = models.some(m =>
    typeof m === 'object' && m !== null && 'id' in m && m.id === modelName
  )

  if (!found) {
    log("[auto-model-selector] Model not found in cache", { modelId, providerID, modelName })
  }

  return found
}

/**
 * Select a model for an agent using auto provider logic.
 * Returns null if auto mode is disabled or no preference is configured.
 */
export function selectModelForAgent(
  agentName: string,
  config: Record<string, unknown>
): string | null {
  const modelSelection = config["model_selection"] as Record<string, unknown> | undefined
  const enableAuto = modelSelection?.["enable_auto_provider"]

  // Auto mode disabled
  if (enableAuto === false) {
    log("[auto-model-selector] Auto mode disabled for agent", { agentName })
    return null
  }

  const agentPrefs = modelSelection?.["agent_preferences"] as Record<string, ModelPreference> | undefined
  const pref = agentPrefs?.[agentName]

  if (!pref) {
    log("[auto-model-selector] No preference configured for agent", { agentName })
    return null
  }

  // Try preferred model
  if (pref.preferred_model) {
    if (isModelAvailable(pref.preferred_model)) {
      log("[auto-model-selector] Using preferred model for agent", {
        agentName,
        model: pref.preferred_model
      })
      return pref.preferred_model
    } else {
      log("[auto-model-selector] Preferred model not available for agent", {
        agentName,
        model: pref.preferred_model
      })
    }
  }

  // Try fallback models
  if (pref.fallback_models && Array.isArray(pref.fallback_models)) {
    for (const model of pref.fallback_models) {
      if (isModelAvailable(model)) {
        log("[auto-model-selector] Using fallback model for agent", {
          agentName,
          model
        })
        return model
      }
    }
    log("[auto-model-selector] No fallback models available for agent", {
      agentName,
      fallbacks: pref.fallback_models
    })
  }

  return null
}

/**
 * Select a model for a category using auto provider logic.
 * Returns null if auto mode is disabled or no preference is configured.
 */
export function selectModelForCategory(
  category: string,
  config: Record<string, unknown>
): string | null {
  const modelSelection = config["model_selection"] as Record<string, unknown> | undefined
  const enableAuto = modelSelection?.["enable_auto_provider"]

  // Auto mode disabled
  if (enableAuto === false) {
    log("[auto-model-selector] Auto mode disabled for category", { category })
    return null
  }

  const categoryPrefs = modelSelection?.["category_preferences"] as Record<string, ModelPreference> | undefined
  const pref = categoryPrefs?.[category]

  if (!pref) {
    log("[auto-model-selector] No preference configured for category", { category })
    return null
  }

  // Try preferred model
  if (pref.preferred_model) {
    if (isModelAvailable(pref.preferred_model)) {
      log("[auto-model-selector] Using preferred model for category", {
        category,
        model: pref.preferred_model
      })
      return pref.preferred_model
    } else {
      log("[auto-model-selector] Preferred model not available for category", {
        category,
        model: pref.preferred_model
      })
    }
  }

  // Try fallback models
  if (pref.fallback_models && Array.isArray(pref.fallback_models)) {
    for (const model of pref.fallback_models) {
      if (isModelAvailable(model)) {
        log("[auto-model-selector] Using fallback model for category", {
          category,
          model
        })
        return model
      }
    }
    log("[auto-model-selector] No fallback models available for category", {
      category,
      fallbacks: pref.fallback_models
    })
  }

  return null
}

/**
 * Get all available models from connected providers only.
 * Returns an array of model objects with provider, id, name, and context info.
 * Only includes models from providers that are currently connected.
 */
export function getAllAvailableModels(): Array<{
  provider: string
  id: string
  fullId: string
  name?: string
  context?: number
}> {
  const cache = readProviderModelsCache()
  if (!cache) {
    log("[auto-model-selector] No provider models cache available")
    return []
  }

  const connectedProviders = cache.connected || []
  if (connectedProviders.length === 0) {
    log("[auto-model-selector] No connected providers found")
    return []
  }

  const models: Array<{
    provider: string
    id: string
    fullId: string
    name?: string
    context?: number
  }> = []

  // Only iterate through connected providers
  for (const providerID of connectedProviders) {
    const providerModels = cache.models[providerID]
    if (!Array.isArray(providerModels)) continue

    for (const model of providerModels) {
      if (typeof model === 'object' && model !== null && 'id' in model) {
        const metadata = model as { id: string; name?: string; context?: number }
        models.push({
          provider: providerID,
          id: metadata.id,
          fullId: `${providerID}/${metadata.id}`,
          name: metadata.name,
          context: metadata.context,
        })
      }
    }
  }

  log("[auto-model-selector] Retrieved available models", {
    connectedProviders: connectedProviders.length,
    totalModels: models.length
  })

  return models
}
