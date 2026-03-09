import { describe, expect, test } from "bun:test"
import { isAutoModelSelection, normalizeModel, normalizeModelID } from "./model-normalization"

describe("normalizeModel", () => {
	describe("#given undefined input", () => {
		test("#when normalizeModel is called with undefined #then returns undefined", () => {
			// given
			const input = undefined

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})
	})

	describe("#given empty string", () => {
		test("#when normalizeModel is called with empty string #then returns undefined", () => {
			// given
			const input = ""

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})
	})

	describe("#given whitespace-only string", () => {
		test("#when normalizeModel is called with whitespace-only string #then returns undefined", () => {
			// given
			const input = "   "

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})
	})

	describe("#given valid model string", () => {
		test("#when normalizeModel is called with valid model string #then returns same string", () => {
			// given
			const input = "claude-3-opus"

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBe("claude-3-opus")
		})
	})

	describe("#given string with leading and trailing spaces", () => {
		test("#when normalizeModel is called with spaces #then returns trimmed string", () => {
			// given
			const input = "  claude-3-opus  "

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBe("claude-3-opus")
		})
	})

	describe("#given string with only spaces", () => {
		test("#when normalizeModel is called with only spaces #then returns undefined", () => {
			// given
			const input = "     "

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})
	})

	describe("#given auto model sentinel", () => {
		test("#when normalizeModel is called with auto #then returns undefined", () => {
			// given
			const input = "auto"

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})

		test("#when normalizeModel is called with auto/category #then returns undefined", () => {
			// given
			const input = "auto/deep"

			// when
			const result = normalizeModel(input)

			// then
			expect(result).toBeUndefined()
		})
	})
})

describe("isAutoModelSelection", () => {
	test("returns true for auto", () => {
		expect(isAutoModelSelection("auto")).toBe(true)
	})

	test("returns true for auto/deep", () => {
		expect(isAutoModelSelection("auto/deep")).toBe(true)
	})

	test("returns false for provider model", () => {
		expect(isAutoModelSelection("openai/gpt-5.4")).toBe(false)
	})
})

describe("normalizeModelID", () => {
	describe("#given model with dots in version numbers", () => {
		test("#when normalizeModelID is called with claude-3.5-sonnet #then returns claude-3-5-sonnet", () => {
			// given
			const input = "claude-3.5-sonnet"

			// when
			const result = normalizeModelID(input)

			// then
			expect(result).toBe("claude-3-5-sonnet")
		})
	})

	describe("#given model without dots", () => {
		test("#when normalizeModelID is called with claude-opus #then returns unchanged", () => {
			// given
			const input = "claude-opus"

			// when
			const result = normalizeModelID(input)

			// then
			expect(result).toBe("claude-opus")
		})
	})

	describe("#given model with multiple dot-numbers", () => {
		test("#when normalizeModelID is called with model.1.2 #then returns model-1-2", () => {
			// given
			const input = "model.1.2"

			// when
			const result = normalizeModelID(input)

			// then
			expect(result).toBe("model-1-2")
		})
	})
})
