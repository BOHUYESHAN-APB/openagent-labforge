# 硬编码模型修复总结

## 问题描述

用户报告使用 `/ol-starwalk` 命令时，系统提示找不到 `claude-sonnet-4-6` 模型。经检查发现 Sisyphus-Junior 执行器硬编码了 `anthropic/claude-sonnet-4-6` 作为默认模型，导致无法继承用户当前使用的主模型。

## 用户需求

**核心要求：绝对不要硬编码模型**

- 默认情况下，所有 agent（包括子 agent）必须继承主模型
- 只有在 TUI 设置页面配置了模型偏好时，才使用配置的模型
- 执行流程：Plan 模式创建计划 → 执行器运行命令 → 执行器必须继承主模型

## 修复内容

### 1. src/agents/sisyphus-junior/agent.ts

**移除硬编码：**
```typescript
// 旧代码（已删除）
export const SISYPHUS_JUNIOR_DEFAULTS = {
  model: "anthropic/claude-sonnet-4-6",  // ❌ 硬编码
  temperature: 0.1,
} as const
```

**新代码：**
```typescript
// NOTE: No hardcoded model defaults. Sisyphus-Junior MUST inherit the main model.
// If systemDefaultModel is not provided, it will throw an error to prevent silent hardcoding.
export const SISYPHUS_JUNIOR_DEFAULTS = {
  temperature: 0.1,
} as const
```

**修改模型解析逻辑：**
```typescript
// 优先级：1. 用户配置 > 2. 主模型 > 3. 错误（不再有硬编码后备）
const overrideModel = (override as { model?: string } | undefined)?.model
const model = overrideModel ?? systemDefaultModel

if (!model) {
  throw new Error(
    "[sisyphus-junior] No model specified. Must inherit from main model or be explicitly configured."
  )
}
```

### 2. src/plugin-handlers/agent-config-handler.ts

**修改实例化调用：**
```typescript
// 旧代码
agentConfig["sisyphus-junior"] = createSisyphusJuniorAgentWithOverrides(
  params.pluginConfig.agents?.["sisyphus-junior"],
  (builtinAgents.atlas as { model?: string } | undefined)?.model,  // ❌ 传递 atlas 模型
  useTaskSystem,
);

// 新代码
agentConfig["sisyphus-junior"] = createSisyphusJuniorAgentWithOverrides(
  params.pluginConfig.agents?.["sisyphus-junior"],
  currentModel,  // ✅ 传递主模型
  useTaskSystem,
);
```

### 3. 测试更新

更新了所有相关测试用例：
- `src/agents/sisyphus-junior/index.test.ts` - 129 个测试全部通过
- `src/plugin-handlers/config-handler.test.ts` - 135 个测试全部通过
- 新增测试验证无模型时抛出错误

## 模型继承优先级

```
1. TUI 设置中的模型偏好（model_selection 配置）
   ↓
2. 继承当前主模型（currentModel）
   ↓
3. 如果都没有 → 抛出错误（不再使用硬编码）
```

## 验证结果

✅ **TypeScript 编译**：无错误  
✅ **构建**：成功  
✅ **Sisyphus-Junior 测试**：129/129 通过  
✅ **Config Handler 测试**：135/135 通过  
✅ **代码检查**：确认无其他 agent 存在类似硬编码问题  

## 影响范围

- **Sisyphus-Junior agent**：现在必须继承主模型或显式配置
- **所有使用 category 的任务**：会通过 Sisyphus-Junior 执行，现在会正确继承主模型
- **向后兼容**：如果用户在配置文件中显式设置了 `agents.sisyphus-junior.model`，仍然会优先使用该配置

## 用户体验改进

**修复前：**
- 用户使用 DeepSeek/GPT/Gemini 等模型
- 执行 `/ol-starwalk` 命令
- 系统强制使用 Claude Sonnet 4.6
- 如果没有 Claude 订阅 → 报错找不到模型

**修复后：**
- 用户使用任何模型
- 执行 `/ol-starwalk` 命令
- 系统继承用户当前使用的模型
- 无缝执行，无需 Claude 订阅

## 相关文件

- `src/agents/sisyphus-junior/agent.ts` - 核心修复
- `src/agents/sisyphus-junior/index.test.ts` - 测试更新
- `src/plugin-handlers/agent-config-handler.ts` - 实例化修复
- `src/plugin-handlers/config-handler.test.ts` - 测试更新

## 日期

2026-04-25
