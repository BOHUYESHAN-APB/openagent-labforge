# DeepSeek V4 全线接入方案

## 概述

DeepSeek V4 是 2026 年发布的新一代 T0 级模型，性能达到 GPT-5.4 / Claude Opus 4.6 级别，但价格仅为竞品的 1/20 到 1/50。

### 两个版本

1. **DeepSeek-V4-Pro**
   - 参数：1.6T（49B 激活）
   - 性能：T0 级（GPT-5.4 / Opus 4.6 级别）
   - 上下文：1M tokens
   - 价格：~$0.28-0.30/M tokens
   - 用途：**主代理**（Sisyphus, Prometheus, Wase 等）

2. **DeepSeek-V4-Flash**
   - 参数：284B
   - 性能：T0 级
   - 上下文：1M tokens
   - 价格：更便宜（约 Pro 版本的 1/3）
   - 用途：**子代理**（Sisyphus-Junior, Librarian, Explore 等）

### 优势

- ✅ **性能卓越**：SWE-bench 81%，达到 GPT-5.4 / Opus 4.6 级别
- ✅ **价格低廉**：$0.28/M tokens，是竞品的 1/20 到 1/50
- ✅ **大上下文**：1M tokens，非常适合大型项目
- ✅ **双版本策略**：Pro 做主代理，Flash 做子代理，性价比最优
- ✅ **用户友好**：绝大多数用户都能负担得起

## 接入计划

### 阶段 1：添加模型定义

#### 1.1 更新 `src/shared/model-requirements.ts`

在所有 agent 的 fallbackChain 中添加 DeepSeek V4：

**主代理**（使用 V4-Pro）：
- `sisyphus`
- `prometheus`
- `wase`
- `oracle`
- `hephaestus`
- `atlas`
- `bio-autopilot`
- `bio-orchestrator`
- `engineering-orchestrator`

**子代理**（使用 V4-Flash）：
- `sisyphus-junior`（通过 category 配置）
- `librarian`
- `explore`
- `github-scout`
- `tech-scout`
- `multimodal-looker`

#### 1.2 优先级策略

DeepSeek V4 应该作为**高优先级选项**，但不是唯一选项：

```typescript
// 主代理示例（Sisyphus）
sisyphus: {
  fallbackChain: [
    // 优先级 1: DeepSeek V4-Pro（性价比最优）
    { 
      providers: ["deepseek", "opencode"], 
      model: "deepseek-v4-pro",
      variant: "max"
    },
    // 优先级 2: Claude Opus 4.6（最高性能）
    {
      providers: ["anthropic", "github-copilot", "opencode"],
      model: "claude-opus-4-6",
      variant: "max",
    },
    // 优先级 3: GPT-5.4（备选）
    { 
      providers: ["openai", "github-copilot", "opencode"], 
      model: "gpt-5.4", 
      variant: "medium" 
    },
    // 其他备选...
  ],
  requiresAnyModel: true,
}

// 子代理示例（Librarian）
librarian: {
  fallbackChain: [
    // 优先级 1: DeepSeek V4-Flash（性价比最优）
    { 
      providers: ["deepseek", "opencode"], 
      model: "deepseek-v4-flash"
    },
    // 优先级 2: Gemini 3 Flash（备选）
    {
      providers: ["google", "github-copilot", "opencode"],
      model: "gemini-3-flash",
    },
    // 其他备选...
  ],
}
```

### 阶段 2：更新 Category 配置

#### 2.1 更新 `src/tools/delegate-task/categories.ts`

为所有 category 添加 DeepSeek V4-Flash 作为默认模型：

```typescript
export const DEFAULT_CATEGORIES: CategoriesConfig = {
  quick: {
    model: "deepseek/deepseek-v4-flash",  // 快速任务用 Flash
    temperature: 0.7,
  },
  deep: {
    model: "deepseek/deepseek-v4-pro",    // 深度任务用 Pro
    temperature: 0.7,
  },
  ultrabrain: {
    model: "deepseek/deepseek-v4-pro",    // 超级任务用 Pro
    temperature: 0.8,
  },
  // ... 其他 categories
}
```

### 阶段 3：上下文窗口配置

#### 3.1 更新 `src/shared/dynamic-truncator.ts`

添加 DeepSeek V4 的上下文限制识别：

```typescript
// 在 inferContextLimit() 中添加
if (modelID.includes('deepseek-v4')) {
  return 1_000_000  // 1M context
}
```

#### 3.2 更新 `src/hooks/context-window-monitor-thresholds.ts`

添加 DeepSeek V4 的阈值配置：

```typescript
if (modelID.includes('deepseek-v4')) {
  return {
    contextLimit: 1_000_000,
    warningThreshold: 900_000,
    criticalThreshold: 950_000,
  }
}
```

### 阶段 4：Provider 支持

#### 4.1 确认 Provider ID

需要确认 DeepSeek 在 OpenCode 中的 provider ID：
- 可能是 `deepseek`
- 或者通过 `opencode` provider 的 auto 服务商

#### 4.2 模型 ID 格式

需要确认模型 ID 的准确格式：
- `deepseek-v4-pro` 或 `deepseek-v4-pro-20260214`
- `deepseek-v4-flash` 或 `deepseek-v4-flash-20260214`

### 阶段 5：文档更新

#### 5.1 用户文档

创建 `docs/models/deepseek-v4.md`：
- 介绍 DeepSeek V4 的优势
- 推荐配置（Pro 做主代理，Flash 做子代理）
- 价格对比
- 性能基准测试

#### 5.2 配置示例

创建 `examples/deepseek-v4-config.jsonc`：

```jsonc
{
  // 推荐配置：DeepSeek V4 全线接入
  "agents": {
    "sisyphus": {
      "model": "deepseek/deepseek-v4-pro"
    },
    "sisyphus-junior": {
      "model": "deepseek/deepseek-v4-flash"
    },
    "prometheus": {
      "model": "deepseek/deepseek-v4-pro"
    },
    "wase": {
      "model": "deepseek/deepseek-v4-pro"
    }
  },
  "categories": {
    "quick": {
      "model": "deepseek/deepseek-v4-flash"
    },
    "deep": {
      "model": "deepseek/deepseek-v4-pro"
    },
    "ultrabrain": {
      "model": "deepseek/deepseek-v4-pro"
    }
  }
}
```

## 实施步骤

### Step 1: 确认模型可用性 ✅

```bash
# 通过 OpenCode API 检查 DeepSeek V4 是否可用
opencode config get
# 查看 connected providers 中是否有 deepseek
```

### Step 2: 更新模型配置 🔄

1. 更新 `src/shared/model-requirements.ts`
2. 更新 `src/tools/delegate-task/categories.ts`
3. 更新上下文窗口配置

### Step 3: 测试验证 🧪

1. 测试主代理使用 V4-Pro
2. 测试子代理使用 V4-Flash
3. 测试模型继承逻辑
4. 测试 fallback 机制

### Step 4: 文档和示例 📝

1. 创建用户文档
2. 创建配置示例
3. 更新 README

## 预期效果

### 成本节省

假设一个典型项目：
- 主代理：10M tokens/月
- 子代理：50M tokens/月

**使用 Claude Opus 4.6**：
- 主代理：10M × $15 = $150
- 子代理：50M × $3 = $150
- 总计：$300/月

**使用 DeepSeek V4**：
- 主代理：10M × $0.30 = $3
- 子代理：50M × $0.10 = $5
- 总计：$8/月

**节省：97%** 🎉

### 性能提升

- SWE-bench：81%（与 GPT-5.4 相当）
- 1M 上下文：可以处理更大的项目
- Flash 版本：子代理响应更快

## 注意事项

1. **Provider 可用性**：需要确认用户的 OpenCode 实例是否支持 DeepSeek provider
2. **模型 ID 格式**：需要确认准确的模型 ID（可能带日期后缀）
3. **Fallback 策略**：保留其他模型作为备选，确保在 DeepSeek 不可用时仍能工作
4. **用户教育**：需要告知用户 DeepSeek V4 的优势和配置方法

## 下一步

1. ✅ 确认 DeepSeek V4 在 OpenCode 中的 provider ID 和模型 ID
2. 🔄 实施模型配置更新
3. 🧪 测试验证
4. 📝 文档和示例

---

## 参考资料

- [DeepSeek V4 Developer Guide](https://lushbinary.com/blog/deepseek-v4-developer-guide-trillion-parameter-moe-engram/)
- [DeepSeek V4 Pricing](https://www.nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
- [DeepSeek V4 Benchmarks](https://officechai.com/ai/deepseek-v4-pro-deepseek-v4-flash-benchmarks-pricing/)
- [DeepSeek V4 Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)
