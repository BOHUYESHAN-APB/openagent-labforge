declare const require: (name: string) => any
const { describe, test, expect, beforeEach, afterEach, spyOn, mock } = require("bun:test")
import { resolveCategoryExecution } from "./category-resolver"
import type { ExecutorContext } from "./executor-types"
import * as connectedProvidersCache from "../../shared/connected-providers-cache"

describe("resolveCategoryExecution", () => {
	let connectedProvidersSpy: ReturnType<typeof spyOn> | undefined
	let providerModelsSpy: ReturnType<typeof spyOn> | undefined

	beforeEach(() => {
		mock.restore()
		connectedProvidersSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
		providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
	})

	afterEach(() => {
		connectedProvidersSpy?.mockRestore()
		providerModelsSpy?.mockRestore()
	})

	const createMockExecutorContext = (overrides: Partial<ExecutorContext> = {}): ExecutorContext => ({
		client: {} as any,
		manager: {} as any,
		directory: "/tmp/test",
		userCategories: {},
		sisyphusJuniorModel: undefined,
		...overrides,
	})

	test("returns clear error when category exists but required model is not available", async () => {
		//#given
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		const inheritedModel = undefined
		const systemDefaultModel = "anthropic/claude-sonnet-4-6"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeDefined()
		expect(result.error).toContain("deep")
		expect(result.error).toMatch(/model.*not.*available|requires.*model/i)
		expect(result.error).not.toContain("Unknown category")
	})

	test("returns 'unknown category' error for truly unknown categories", async () => {
		//#given
		const args = {
			category: "definitely-not-a-real-category-xyz123",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		const inheritedModel = undefined
		const systemDefaultModel = "anthropic/claude-sonnet-4-6"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeDefined()
		expect(result.error).toContain("Unknown category")
		expect(result.error).toContain("definitely-not-a-real-category-xyz123")
	})

	test("inherits parent model for category execution when no explicit category override exists", async () => {
		//#given
		providerModelsSpy?.mockReturnValue({
			models: {
				gmn: ["gpt-5.3-codex"],
			},
			connected: ["gmn"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		const inheritedModel = "gmn/gpt-5.3-codex"
		const systemDefaultModel = "openai/gpt-5.4"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeUndefined()
		expect(result.categoryModel).toEqual({
			providerID: "gmn",
			modelID: "gpt-5.3-codex",
			variant: "medium",
		})
		expect(result.modelInfo).toEqual({
			model: "gmn/gpt-5.3-codex",
			type: "inherited",
			source: "override",
		})
	})

	test("prefers inherited parent model over sisyphus-junior model", async () => {
		//#given
		providerModelsSpy?.mockReturnValue({
			models: {
				gmn: ["gpt-5.3-codex"],
				openai: ["gpt-5.4"],
			},
			connected: ["gmn", "openai"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext({
			sisyphusJuniorModel: "openai/gpt-5.4",
		})
		const inheritedModel = "gmn/gpt-5.3-codex"
		const systemDefaultModel = "openai/gpt-5.4"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeUndefined()
		expect(result.categoryModel).toEqual({
			providerID: "gmn",
			modelID: "gpt-5.3-codex",
			variant: "medium",
		})
		expect(result.modelInfo).toEqual({
			model: "gmn/gpt-5.3-codex",
			type: "inherited",
			source: "override",
		})
	})

	test("uses category fallback_models for background/runtime fallback chain", async () => {
		//#given
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			deep: {
				model: "quotio/claude-opus-4-6",
				fallback_models: ["quotio/kimi-k2.5", "openai/gpt-5.2(high)"],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "anthropic/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.fallbackChain).toEqual([
			{ providers: ["quotio"], model: "kimi-k2.5", variant: undefined },
			{ providers: ["openai"], model: "gpt-5.2", variant: "high" },
		])
	})
})
