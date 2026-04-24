import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { log } from "./logger"
import { getOmoOpenCodeCacheDir } from "./data-path"

const CONNECTED_PROVIDERS_CACHE_FILE = "connected-providers.json"
const PROVIDER_MODELS_CACHE_FILE = "provider-models.json"
const MEMORY_CACHE_TTL_MS = 2000

let connectedProvidersMemoryCache: { value: string[]; expiresAt: number } | null = null
let providerModelsMemoryCache: { value: ProviderModelsCache; expiresAt: number } | null = null

interface ConnectedProvidersCache {
	connected: string[]
	updatedAt: string
}

interface ModelMetadata {
	id: string
	provider?: string
	context?: number
	output?: number
	name?: string
}

interface ProviderModelsCache {
	models: Record<string, string[] | ModelMetadata[]>
	connected: string[]
	updatedAt: string
}

function getCacheFilePath(filename: string): string {
	return join(getOmoOpenCodeCacheDir(), filename)
}

function ensureCacheDir(): void {
	const cacheDir = getOmoOpenCodeCacheDir()
	if (!existsSync(cacheDir)) {
		mkdirSync(cacheDir, { recursive: true })
	}
}

/**
 * Read the connected providers cache.
 * Returns the list of connected provider IDs, or null if cache doesn't exist.
 */
export function readConnectedProvidersCache(): string[] | null {
  const startedAt = performance.now()
  const now = Date.now()

  if (connectedProvidersMemoryCache && connectedProvidersMemoryCache.expiresAt > now) {
    log("[connected-providers-cache] Read cache (memory)", {
      count: connectedProvidersMemoryCache.value.length,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    return connectedProvidersMemoryCache.value
  }

  const cacheFile = getCacheFilePath(CONNECTED_PROVIDERS_CACHE_FILE)

	if (!existsSync(cacheFile)) {
		log("[connected-providers-cache] Cache file not found", { cacheFile })
		return null
	}

	try {
		const content = readFileSync(cacheFile, "utf-8")
		const data = JSON.parse(content) as ConnectedProvidersCache
		connectedProvidersMemoryCache = {
			value: data.connected,
			expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
		}
    log("[connected-providers-cache] Read cache", { count: data.connected.length, updatedAt: data.updatedAt, elapsedMs: Math.round(performance.now() - startedAt) })
		return data.connected
	} catch (err) {
		log("[connected-providers-cache] Error reading cache", { error: String(err) })
		return null
	}
}

/**
 * Check if connected providers cache exists.
 */
export function hasConnectedProvidersCache(): boolean {
	const cacheFile = getCacheFilePath(CONNECTED_PROVIDERS_CACHE_FILE)
	return existsSync(cacheFile)
}

/**
 * Write the connected providers cache.
 */
function writeConnectedProvidersCache(connected: string[]): void {
	ensureCacheDir()
	const cacheFile = getCacheFilePath(CONNECTED_PROVIDERS_CACHE_FILE)

	const data: ConnectedProvidersCache = {
		connected,
		updatedAt: new Date().toISOString(),
	}

	connectedProvidersMemoryCache = {
		value: connected,
		expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
	}

	try {
		writeFileSync(cacheFile, JSON.stringify(data, null, 2))
		log("[connected-providers-cache] Cache written", { count: connected.length })
	} catch (err) {
		log("[connected-providers-cache] Error writing cache", { error: String(err) })
	}
}

/**
 * Read the provider-models cache.
 * Returns the cache data, or null if cache doesn't exist.
 */
export function readProviderModelsCache(): ProviderModelsCache | null {
  const startedAt = performance.now()
  const now = Date.now()

  if (providerModelsMemoryCache && providerModelsMemoryCache.expiresAt > now) {
    log("[connected-providers-cache] Read provider-models cache (memory)", {
      providerCount: Object.keys(providerModelsMemoryCache.value.models).length,
      updatedAt: providerModelsMemoryCache.value.updatedAt,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    return providerModelsMemoryCache.value
  }

	const cacheFile = getCacheFilePath(PROVIDER_MODELS_CACHE_FILE)

	if (!existsSync(cacheFile)) {
		log("[connected-providers-cache] Provider-models cache file not found", { cacheFile })
		return null
	}

	try {
		const content = readFileSync(cacheFile, "utf-8")
		const data = JSON.parse(content) as ProviderModelsCache
		providerModelsMemoryCache = {
			value: data,
			expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
		}
		log("[connected-providers-cache] Read provider-models cache", { 
			providerCount: Object.keys(data.models).length, 
			updatedAt: data.updatedAt,
			elapsedMs: Math.round(performance.now() - startedAt),
		})
		return data
	} catch (err) {
		log("[connected-providers-cache] Error reading provider-models cache", { error: String(err) })
		return null
	}
}

/**
 * Check if provider-models cache exists.
 */
export function hasProviderModelsCache(): boolean {
	const cacheFile = getCacheFilePath(PROVIDER_MODELS_CACHE_FILE)
	return existsSync(cacheFile)
}

/**
 * Write the provider-models cache.
 */
export function writeProviderModelsCache(data: { models: Record<string, string[] | ModelMetadata[]>; connected: string[] }): void {
	ensureCacheDir()
	const cacheFile = getCacheFilePath(PROVIDER_MODELS_CACHE_FILE)

	const cacheData: ProviderModelsCache = {
		...data,
		updatedAt: new Date().toISOString(),
	}

	providerModelsMemoryCache = {
		value: cacheData,
		expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
	}

	try {
		writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2))
		log("[connected-providers-cache] Provider-models cache written", { 
			providerCount: Object.keys(data.models).length 
		})
	} catch (err) {
		log("[connected-providers-cache] Error writing provider-models cache", { error: String(err) })
	}
}

/**
 * Update the connected providers cache by fetching from the client.
 * Also updates the provider-models cache with model lists per provider.
 */
export async function updateConnectedProvidersCache(client: {
	provider?: {
		list?: () => Promise<{
			data?: {
				connected?: string[]
				all?: Array<{ id: string; models?: Record<string, unknown> }>
			}
		}>
	}
}): Promise<void> {
	if (!client?.provider?.list) {
		log("[connected-providers-cache] client.provider.list not available")
		return
	}

	try {
		const result = await client.provider.list()
		const connected = result.data?.connected ?? []
		log("[connected-providers-cache] Fetched connected providers", { count: connected.length, providers: connected })

		writeConnectedProvidersCache(connected)

		const modelsByProvider: Record<string, ModelMetadata[]> = {}
		const allProviders = result.data?.all ?? []

		for (const provider of allProviders) {
			if (provider.models) {
				const models: ModelMetadata[] = []
				for (const [modelId, modelData] of Object.entries(provider.models)) {
					const metadata: ModelMetadata = { id: modelId, provider: provider.id }

					// Extract context window size if available
					if (modelData && typeof modelData === 'object') {
						const data = modelData as Record<string, unknown>
						if (typeof data.context === 'number') {
							metadata.context = data.context
						}
						if (typeof data.output === 'number') {
							metadata.output = data.output
						}
						if (typeof data.name === 'string') {
							metadata.name = data.name
						}
					}

					models.push(metadata)
				}

				if (models.length > 0) {
					modelsByProvider[provider.id] = models
				}
			}
		}

		log("[connected-providers-cache] Extracted models from provider list", {
			providerCount: Object.keys(modelsByProvider).length,
			totalModels: Object.values(modelsByProvider).reduce((sum, models) => sum + models.length, 0),
		})

		writeProviderModelsCache({
			models: modelsByProvider,
			connected,
		})
	} catch (err) {
		log("[connected-providers-cache] Error updating cache", { error: String(err) })
	}
}

/** @internal test-only helper */
export function resetConnectedProvidersCacheForTesting(): void {
	connectedProvidersMemoryCache = null
	providerModelsMemoryCache = null
}

/**
 * Get model metadata from cache by model ID.
 * Returns null if model not found or cache doesn't exist.
 */
export function getModelMetadata(modelId: string): ModelMetadata | null {
	const cache = readProviderModelsCache()
	if (!cache) {
		return null
	}

	for (const models of Object.values(cache.models)) {
		if (Array.isArray(models)) {
			for (const model of models) {
				if (typeof model === 'object' && model !== null && 'id' in model) {
					const metadata = model as ModelMetadata
					if (metadata.id === modelId) {
						return metadata
					}
				}
			}
		}
	}

	return null
}

/**
 * Get context window size for a model from cache.
 * Returns null if not found or not available.
 */
export function getModelContextWindow(modelId: string): number | null {
	const metadata = getModelMetadata(modelId)
	return metadata?.context ?? null
}

/**
 * Populate modelContextLimitsCache from the provider models cache.
 * This should be called during plugin initialization to ensure all models
 * from OpenCode's provider data are available in the cache.
 */
export function populateModelContextLimitsCache(
	modelContextLimitsCache: Map<string, number>
): void {
	const cache = readProviderModelsCache()
	if (!cache) {
		log("[connected-providers-cache] No provider models cache available to populate modelContextLimitsCache")
		return
	}

	let populatedCount = 0
	for (const [providerID, models] of Object.entries(cache.models)) {
		if (!Array.isArray(models)) continue

		for (const model of models) {
			if (typeof model === 'object' && model !== null && 'id' in model) {
				const metadata = model as ModelMetadata
				if (metadata.context && metadata.context > 0) {
					const key = `${providerID}/${metadata.id}`
					modelContextLimitsCache.set(key, metadata.context)
					populatedCount++
				}
			}
		}
	}

	log("[connected-providers-cache] Populated modelContextLimitsCache", {
		populatedCount,
		providerCount: Object.keys(cache.models).length,
	})
}
