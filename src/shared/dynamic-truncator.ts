import type { PluginInput } from "@opencode-ai/plugin";
import { normalizeSDKResponse } from "./normalize-sdk-response"
import { getModelContextWindow } from "./connected-providers-cache"

const DEFAULT_ANTHROPIC_ACTUAL_LIMIT = 200_000;
const CHARS_PER_TOKEN_ESTIMATE = 4;
const DEFAULT_TARGET_MAX_TOKENS = 50_000;
// Use 128K as conservative default for unknown models
const DEFAULT_MODEL_CONTEXT_LIMIT = 128_000;

type ModelCacheStateLike = {
	anthropicContext1MEnabled: boolean;
	modelContextLimitsCache?: Map<string, number>;
	providerID?: string;
	modelID?: string;
}

function getAnthropicActualLimit(modelCacheState?: ModelCacheStateLike): number {
	return (modelCacheState?.anthropicContext1MEnabled ?? false) ||
		process.env.ANTHROPIC_1M_CONTEXT === "true" ||
		process.env.VERTEX_ANTHROPIC_1M_CONTEXT === "true"
		? 1_000_000
		: DEFAULT_ANTHROPIC_ACTUAL_LIMIT;
}

function inferContextLimit(modelCacheState?: ModelCacheStateLike): number {
	// Priority 1: Use cached context limit from OpenCode provider data
	if (modelCacheState?.providerID && modelCacheState?.modelID) {
		const cached = modelCacheState.modelContextLimitsCache?.get(
			`${modelCacheState.providerID}/${modelCacheState.modelID}`
		);
		if (cached && cached > 0) {
			return cached;
		}
	}

	// Priority 2: Try to get from connected providers cache
	if (modelCacheState?.modelID) {
		const contextFromCache = getModelContextWindow(modelCacheState.modelID);
		if (contextFromCache && contextFromCache > 0) {
			return contextFromCache;
		}
	}

	// Priority 3: Check if large context mode is enabled
	if (modelCacheState?.anthropicContext1MEnabled) {
		return 1_000_000;
	}

	// Priority 4: Provider-specific defaults
	const providerID = modelCacheState?.providerID ?? "";
	const modelID = modelCacheState?.modelID ?? "";

	if (providerID === "anthropic" || providerID === "google-vertex-anthropic") {
		return getAnthropicActualLimit(modelCacheState);
	}

	// DeepSeek V4 models have 1M context
	if (modelID.includes("deepseek-v4")) {
		return 1_000_000;
	}

	// Priority 5: Conservative default
	return DEFAULT_MODEL_CONTEXT_LIMIT;
}

interface AssistantMessageInfo {
	role: "assistant";
	tokens: {
		input: number;
		output: number;
		reasoning: number;
		cache: { read: number; write: number };
	};
}

interface MessageWrapper {
	info: { role: string } & Partial<AssistantMessageInfo>;
}

export interface TruncationResult {
	result: string;
	truncated: boolean;
	removedCount?: number;
}

export interface TruncationOptions {
	targetMaxTokens?: number;
	preserveHeaderLines?: number;
	contextWindowLimit?: number;
}

function estimateTokens(text: string): number {
	return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

export function truncateToTokenLimit(
	output: string,
	maxTokens: number,
	preserveHeaderLines = 3,
): TruncationResult {
	if (typeof output !== 'string') {
		return { result: String(output ?? ''), truncated: false };
	}

	const currentTokens = estimateTokens(output);

	if (currentTokens <= maxTokens) {
		return { result: output, truncated: false };
	}

	const lines = output.split("\n");

	if (lines.length <= preserveHeaderLines) {
		const maxChars = maxTokens * CHARS_PER_TOKEN_ESTIMATE;
		return {
			result:
				output.slice(0, maxChars) +
				"\n\n[Output truncated due to context window limit]",
			truncated: true,
		};
	}

	const headerLines = lines.slice(0, preserveHeaderLines);
	const contentLines = lines.slice(preserveHeaderLines);

	const headerText = headerLines.join("\n");
	const headerTokens = estimateTokens(headerText);
	const truncationMessageTokens = 50;
	const availableTokens = maxTokens - headerTokens - truncationMessageTokens;

	if (availableTokens <= 0) {
		return {
			result:
				headerText + "\n\n[Content truncated due to context window limit]",
			truncated: true,
			removedCount: contentLines.length,
		};
	}

	const resultLines: string[] = [];
	let currentTokenCount = 0;

	for (const line of contentLines) {
		const lineTokens = estimateTokens(line + "\n");
		if (currentTokenCount + lineTokens > availableTokens) {
			break;
		}
		resultLines.push(line);
		currentTokenCount += lineTokens;
	}

	const truncatedContent = [...headerLines, ...resultLines].join("\n");
	const removedCount = contentLines.length - resultLines.length;

	return {
		result:
			truncatedContent +
			`\n\n[${removedCount} more lines truncated due to context window limit]`,
		truncated: true,
		removedCount,
	};
}

export async function getContextWindowUsage(
	ctx: PluginInput,
	sessionID: string,
	modelCacheState?: ModelCacheStateLike,
): Promise<{
	usedTokens: number;
	remainingTokens: number;
	usagePercentage: number;
} | null> {
	try {
		const response = await ctx.client.session.messages({
			path: { id: sessionID },
		});

		const messages = normalizeSDKResponse(response, [] as MessageWrapper[], { preferResponseOnMissingData: true })

		const assistantMessages = messages
			.filter((m) => m.info.role === "assistant")
			.map((m) => m.info as AssistantMessageInfo);

		if (assistantMessages.length === 0) return null;

		const lastAssistant = assistantMessages[assistantMessages.length - 1];
		const lastTokens = lastAssistant.tokens;
		const usedTokens =
			(lastTokens?.input ?? 0) +
			(lastTokens?.cache?.read ?? 0) +
			(lastTokens?.output ?? 0);
		const contextLimit = inferContextLimit(modelCacheState);
		const remainingTokens = contextLimit - usedTokens;

		return {
			usedTokens,
			remainingTokens,
			usagePercentage: usedTokens / contextLimit,
		};
	} catch {
		return null;
	}
}

export async function dynamicTruncate(
	ctx: PluginInput,
	sessionID: string,
	output: string,
	options: TruncationOptions = {},
	modelCacheState?: ModelCacheStateLike,
): Promise<TruncationResult> {
	if (typeof output !== 'string') {
		return { result: String(output ?? ''), truncated: false };
	}

	const {
		targetMaxTokens = DEFAULT_TARGET_MAX_TOKENS,
		preserveHeaderLines = 3,
	} = options;

	const usage = await getContextWindowUsage(ctx, sessionID, modelCacheState);

	if (!usage) {
		// Fallback: apply conservative truncation when context usage unavailable
		return truncateToTokenLimit(output, targetMaxTokens, preserveHeaderLines);
	}

	const maxOutputTokens = Math.min(
		usage.remainingTokens * 0.5,
		targetMaxTokens,
	);

	if (maxOutputTokens <= 0) {
		return {
			result: "[Output suppressed - context window exhausted]",
			truncated: true,
		};
	}

	return truncateToTokenLimit(output, maxOutputTokens, preserveHeaderLines);
}

export function createDynamicTruncator(
	ctx: PluginInput,
	modelCacheState?: ModelCacheStateLike,
) {
	return {
		truncate: (
			sessionID: string,
			output: string,
			options?: TruncationOptions,
		) => dynamicTruncate(ctx, sessionID, output, options, modelCacheState),

		getUsage: (sessionID: string) =>
			getContextWindowUsage(ctx, sessionID, modelCacheState),

		truncateSync: (
			output: string,
			maxTokens: number,
			preserveHeaderLines?: number,
		) => truncateToTokenLimit(output, maxTokens, preserveHeaderLines),
	};
}
