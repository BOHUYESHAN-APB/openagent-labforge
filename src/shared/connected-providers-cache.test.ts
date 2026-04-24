import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "fs"
import { join } from "path"
import * as dataPath from "./data-path"
import { updateConnectedProvidersCache, readProviderModelsCache, getModelContextWindow, resetConnectedProvidersCacheForTesting } from "./connected-providers-cache"

const TEST_CACHE_DIR = join(import.meta.dir, "__test-cache__")

describe("updateConnectedProvidersCache", () => {
	let cacheDirSpy: ReturnType<typeof spyOn>

	beforeEach(() => {
		cacheDirSpy = spyOn(dataPath, "getOmoOpenCodeCacheDir").mockReturnValue(TEST_CACHE_DIR)
		if (existsSync(TEST_CACHE_DIR)) {
			rmSync(TEST_CACHE_DIR, { recursive: true })
		}
		mkdirSync(TEST_CACHE_DIR, { recursive: true })
		resetConnectedProvidersCacheForTesting()
	})

	afterEach(() => {
		cacheDirSpy.mockRestore()
		if (existsSync(TEST_CACHE_DIR)) {
			rmSync(TEST_CACHE_DIR, { recursive: true })
		}
	})

	test("extracts models from provider.list().all response", async () => {
		//#given
		const mockClient = {
			provider: {
				list: async () => ({
					data: {
						connected: ["openai", "anthropic"],
						all: [
							{
								id: "openai",
								name: "OpenAI",
								env: [],
								models: {
									"gpt-5.3-codex": { id: "gpt-5.3-codex", name: "GPT-5.3 Codex" },
									"gpt-5.4": { id: "gpt-5.4", name: "GPT-5.4" },
								},
							},
							{
								id: "anthropic",
								name: "Anthropic",
								env: [],
								models: {
									"claude-opus-4-6": { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
									"claude-sonnet-4-6": { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
								},
							},
						],
					},
				}),
			},
		}

		//#when
		await updateConnectedProvidersCache(mockClient)

		//#then
		const cache = readProviderModelsCache()
		expect(cache).not.toBeNull()
		expect(cache!.connected).toEqual(["openai", "anthropic"])
		expect(cache!.models.openai).toEqual([
			{ id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "openai" },
			{ id: "gpt-5.4", name: "GPT-5.4", provider: "openai" },
		])
		expect(cache!.models.anthropic).toEqual([
			{ id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic" },
			{ id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic" },
		])
	})

	test("writes empty models when provider has no models", async () => {
		//#given
		const mockClient = {
			provider: {
				list: async () => ({
					data: {
						connected: ["empty-provider"],
						all: [
							{
								id: "empty-provider",
								name: "Empty",
								env: [],
								models: {},
							},
						],
					},
				}),
			},
		}

		//#when
		await updateConnectedProvidersCache(mockClient)

		//#then
		const cache = readProviderModelsCache()
		expect(cache).not.toBeNull()
		expect(cache!.models).toEqual({})
	})

	test("writes empty models when all field is missing", async () => {
		//#given
		const mockClient = {
			provider: {
				list: async () => ({
					data: {
						connected: ["openai"],
					},
				}),
			},
		}

		//#when
		await updateConnectedProvidersCache(mockClient)

		//#then
		const cache = readProviderModelsCache()
		expect(cache).not.toBeNull()
		expect(cache!.connected).toEqual(["openai"])
		expect(cache!.models).toEqual({})
	})

	test("does nothing when client.provider.list is not available", async () => {
		//#given - First, ensure cache doesn't exist
		const cacheFile = join(TEST_CACHE_DIR, "provider-models.json")
		expect(existsSync(cacheFile)).toBe(false)

		const mockClient = {}

		//#when
		await updateConnectedProvidersCache(mockClient)

		//#then - Cache should still not exist
		expect(existsSync(cacheFile)).toBe(false)
		const cache = readProviderModelsCache()
		expect(cache).toBeNull()
	})

	test("extracts context window size from model metadata", async () => {
		//#given
		const mockClient = {
			provider: {
				list: async () => ({
					data: {
						connected: ["openai"],
						all: [
							{
								id: "openai",
								name: "OpenAI",
								env: [],
								models: {
									"gpt-5.4": {
										id: "gpt-5.4",
										name: "GPT-5.4",
										context: 1_000_000,
										output: 32_000,
									},
									"gpt-5.3-codex": {
										id: "gpt-5.3-codex",
										name: "GPT-5.3 Codex",
										context: 400_000,
										output: 16_000,
									},
								},
							},
						],
					},
				}),
			},
		}

		//#when
		await updateConnectedProvidersCache(mockClient)

		//#then
		const cache = readProviderModelsCache()
		expect(cache).not.toBeNull()
		expect(cache!.models.openai).toEqual([
			{ id: "gpt-5.4", name: "GPT-5.4", provider: "openai", context: 1_000_000, output: 32_000 },
			{ id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "openai", context: 400_000, output: 16_000 },
		])

		// Test getModelContextWindow
		expect(getModelContextWindow("gpt-5.4")).toBe(1_000_000)
		expect(getModelContextWindow("gpt-5.3-codex")).toBe(400_000)
		expect(getModelContextWindow("non-existent-model")).toBeNull()
	})
})
