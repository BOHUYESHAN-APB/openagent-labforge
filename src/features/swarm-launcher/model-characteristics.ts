import { getModelContextWindow as getContextWindowFromCache } from "../../shared/connected-providers-cache"

export interface ModelCharacteristics {
  id: string
  displayName: string
  provider: string
  strengths: string[]
  weaknesses: string[]
  costTier: "high" | "medium" | "low"
  recommendedFor: string[]
}

// Static characteristics - subjective information for model selection
// Technical parameters (context window, etc.) are fetched dynamically from OpenCode providers
export const MODEL_CHARACTERISTICS: Record<string, ModelCharacteristics> = {
  "anthropic/claude-opus-4-6": {
    id: "anthropic/claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    provider: "Anthropic",
    strengths: ["最强推理能力", "复杂任务", "代码质量高"],
    weaknesses: ["昂贵", "速度较慢"],
    costTier: "high",
    recommendedFor: ["算法设计", "架构规划", "复杂重构"],
  },
  "anthropic/claude-sonnet-4-6": {
    id: "anthropic/claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    provider: "Anthropic",
    strengths: ["平衡性能", "速度快", "性价比高"],
    weaknesses: ["推理能力略弱于 Opus"],
    costTier: "medium",
    recommendedFor: ["一般开发", "代码审查", "文档编写"],
  },
  "anthropic/claude-haiku-4-5": {
    id: "anthropic/claude-haiku-4-5",
    displayName: "Claude Haiku 4.5",
    provider: "Anthropic",
    strengths: ["极快", "极便宜", "适合简单任务"],
    weaknesses: ["推理能力有限"],
    costTier: "low",
    recommendedFor: ["简单编码", "bug 修复", "重复性工作"],
  },
  "google/gemini-3.1-pro": {
    id: "google/gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    provider: "Google",
    strengths: ["超大上下文", "多模态", "长文档处理"],
    weaknesses: ["推理能力一般", "可能混合语言"],
    costTier: "high",
    recommendedFor: ["大型代码库", "文档分析", "多文件重构"],
  },
  "google/gemini-3-flash": {
    id: "google/gemini-3-flash",
    displayName: "Gemini 3 Flash",
    provider: "Google",
    strengths: ["超大上下文", "快速", "便宜"],
    weaknesses: ["推理能力较弱"],
    costTier: "low",
    recommendedFor: ["简单任务", "大文件读取", "快速原型"],
  },
  "kimi/kimi-k1": {
    id: "kimi/kimi-k1",
    displayName: "Kimi K1",
    provider: "Moonshot",
    strengths: ["大上下文", "中文友好", "性价比高"],
    weaknesses: ["推理能力中等"],
    costTier: "medium",
    recommendedFor: ["中文项目", "大文件处理", "文档翻译"],
  },
  "openai/gpt-5.4": {
    id: "openai/gpt-5.4",
    displayName: "GPT-5.4",
    provider: "OpenAI",
    strengths: ["强推理", "代码生成好", "速度快"],
    weaknesses: ["上下文较小", "昂贵"],
    costTier: "high",
    recommendedFor: ["算法实现", "逻辑推理", "代码优化"],
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    displayName: "GPT-4o",
    provider: "OpenAI",
    strengths: ["平衡性能", "多模态", "速度快"],
    weaknesses: ["上下文中等"],
    costTier: "medium",
    recommendedFor: ["一般开发", "图像分析", "快速原型"],
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "OpenAI",
    strengths: ["便宜", "快速", "适合简单任务"],
    weaknesses: ["能力有限"],
    costTier: "low",
    recommendedFor: ["简单编码", "测试生成", "文档格式化"],
  },
  "openai/gpt-5-nano": {
    id: "openai/gpt-5-nano",
    displayName: "GPT-5 Nano",
    provider: "OpenAI",
    strengths: ["极快", "极便宜"],
    weaknesses: ["能力最弱"],
    costTier: "low",
    recommendedFor: ["简单任务", "快速响应"],
  },
}

export function getModelCharacteristics(modelId: string): ModelCharacteristics | undefined {
  return MODEL_CHARACTERISTICS[modelId]
}

/**
 * Get context window size for a model from OpenCode provider cache.
 * Returns human-readable format (e.g., "1M", "200K") or null if not available.
 */
export function getModelContextWindow(modelId: string): string | null {
  const contextTokens = getContextWindowFromCache(modelId)
  if (contextTokens === null) {
    return null
  }

  // Convert to human-readable format
  if (contextTokens >= 1_000_000) {
    return `${Math.round(contextTokens / 1_000_000)}M`
  }
  return `${Math.round(contextTokens / 1_000)}K`
}

export function getModelsByTier(tier: "high" | "medium" | "low"): ModelCharacteristics[] {
  return Object.values(MODEL_CHARACTERISTICS).filter((m) => m.costTier === tier)
}

export function getRecommendedModelsForRole(
  role: "coordinator" | "worker" | "specialist"
): Array<{ scenario: string; modelId: string; modelName: string; reason: string; category: string }> {
  if (role === "coordinator") {
    return [
      {
        scenario: "复杂任务分解",
        modelId: "anthropic/claude-opus-4-6",
        modelName: "Claude Opus 4.6",
        reason: "最强推理能力",
        category: "Best",
      },
      {
        scenario: "大型代码库",
        modelId: "google/gemini-3.1-pro",
        modelName: "Gemini 3.1 Pro",
        reason: "1M context",
        category: "Long Context",
      },
      {
        scenario: "逻辑推理",
        modelId: "openai/gpt-5.4",
        modelName: "GPT-5.4",
        reason: "强逻辑推理",
        category: "Logic",
      },
    ]
  } else if (role === "worker") {
    return [
      {
        scenario: "快速编码",
        modelId: "anthropic/claude-haiku-4-5",
        modelName: "Claude Haiku 4.5",
        reason: "快速便宜",
        category: "Fast & Cheap",
      },
      {
        scenario: "大文件处理",
        modelId: "kimi/kimi-k1",
        modelName: "Kimi K1",
        reason: "256K context",
        category: "Long Context",
      },
      {
        scenario: "算法实现",
        modelId: "openai/gpt-5.4",
        modelName: "GPT-5.4",
        reason: "强逻辑推理",
        category: "Logic",
      },
      {
        scenario: "超大文件",
        modelId: "google/gemini-3-flash",
        modelName: "Gemini 3 Flash",
        reason: "1M context + 便宜",
        category: "Long Context",
      },
    ]
  } else {
    // specialist
    return [
      {
        scenario: "架构分析",
        modelId: "anthropic/claude-opus-4-6",
        modelName: "Claude Opus 4.6",
        reason: "深度分析",
        category: "Deep Analysis",
      },
      {
        scenario: "代码审查",
        modelId: "anthropic/claude-sonnet-4-6",
        modelName: "Claude Sonnet 4.6",
        reason: "平衡性能",
        category: "Balanced",
      },
      {
        scenario: "大型项目分析",
        modelId: "google/gemini-3.1-pro",
        modelName: "Gemini 3.1 Pro",
        reason: "1M context",
        category: "Long Context",
      },
    ]
  }
}
