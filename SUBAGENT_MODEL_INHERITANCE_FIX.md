# 子代理模型继承问题修复

## 问题总结

### 现象
- 主代理使用：`anthropic/claude-sonnet-4-6` ✅
- 子代理（助手帮手）尝试使用：`openai/gpt-5.4` ❌
- 错误：`ProviderModelNotFoundError: providerID=openai modelID=gpt-5.4`
- 结果：子代理会话启动失败，输出为空

### 根本原因
子代理应该默认继承主代理的模型，但某个配置覆盖了继承逻辑。

## 模型选择优先级（已确认）

### Category 模式（使用 `category` 参数）
```typescript
// src/tools/delegate-task/category-resolver.ts
explicitCategoryModel ?? inheritedModel ?? sisyphusJuniorModel ?? resolved.model
```

优先级：
1. **explicitCategoryModel** - 用户为特定 category 显式配置的模型（最高优先级）
2. **inheritedModel** - 从父代理继承的模型（**默认行为**）
3. **sisyphusJuniorModel** - 全局 sisyphus-junior 配置的模型
4. **resolved.model** - category 的默认模型

### Subagent 模式（使用 `subagent_type` 参数）
```typescript
// src/tools/delegate-task/subagent-resolver.ts
agentOverride?.model ?? inheritedModel
```

优先级：
1. **agentOverride?.model** - 用户为特定 agent 显式配置的模型（最高优先级）
2. **inheritedModel** - 从父代理继承的模型（**默认行为**）

## 已修改的文件

### 1. `src/tools/delegate-task/category-resolver.ts`
添加了清晰的注释说明模型选择优先级：

```typescript
if (!requirement) {
  // Precedence:
  // 1. explicit category model (user explicitly set for this category)
  // 2. inherited parent model (inherit from parent agent by default)
  // 3. sisyphus-junior default (global sisyphus-junior model config)
  // 4. category resolved model (category's default model)
  actualModel = explicitCategoryModel ?? inheritedModel ?? overrideModel ?? resolved.model
```

```typescript
} else {
  // Precedence for model resolution:
  // 1. explicit category model (user explicitly set for this category)
  // 2. inherited parent model (inherit from parent agent by default)
  // 3. sisyphus-junior default (global sisyphus-junior model config)
  const resolution = resolveModelForDelegateTask({
    userModel: explicitCategoryModel ?? inheritedModel ?? overrideModel,
    ...
  })
```

### 2. `CHANGES_SUMMARY.md`
更新了子代理输出为空问题的分析和解决方案。

### 3. `SUBAGENT_OUTPUT_ISSUE_ANALYSIS.md`
更新了根本原因分析和修复方案。

## 用户需要做的

### 检查配置文件
查找并移除/修正错误的模型配置：

**全局配置**：`~/.opencode/openagent-labforge.jsonc`
```jsonc
{
  "agents": {
    "sisyphus-junior": {
      "model": "openai/gpt-5.4"  // ❌ 移除或修正
    }
  }
}
```

**项目配置**：`.opencode/openagent-labforge.jsonc`
```jsonc
{
  "categories": {
    "quick": {
      "model": "openai/gpt-5.4"  // ❌ 移除或修正
    }
  }
}
```

### 推荐配置
如果想让子代理使用特定模型，应该使用存在的模型：

```jsonc
{
  "agents": {
    "sisyphus-junior": {
      "model": "anthropic/claude-sonnet-4-6"  // ✅ 或其他可用模型
    }
  }
}
```

或者**不配置**，让子代理自动继承主代理的模型（推荐）。

## 验证修复

### 1. 检查配置
```bash
# 全局配置
cat ~/.opencode/openagent-labforge.jsonc

# 项目配置
cat .opencode/openagent-labforge.jsonc
```

### 2. 移除错误配置
移除所有 `openai/gpt-5.4` 的配置。

### 3. 测试子代理
启动一个子代理任务，确认它使用了主代理的模型：
```bash
# 查看日志
tail -f ~/.local/share/opencode/log/*.log | grep -E "model|providerID"
```

应该看到子代理使用与主代理相同的模型。

## 其他子代理工具

已检查所有调用 `manager.launch` 的地方，确认它们都正确传递了模型参数：

1. ✅ `src/tools/delegate-task/background-task.ts` - 传递 `model: categoryModel`
2. ✅ `src/tools/delegate-task/unstable-agent-task.ts` - 传递 `model: categoryModel`
3. ✅ `src/tools/delegate-task/sync-task.ts` - 传递 `model: categoryModel`
4. ✅ `src/tools/background-task/create-background-task.ts` - 传递 `parentModel`
5. ✅ `src/tools/call-omo-agent/background-executor.ts` - 不传递 model（使用 agent 默认）
6. ✅ `src/tools/call-omo-agent/background-agent-executor.ts` - 不传递 model（使用 agent 默认）

所有子代理工具都正确实现了模型继承逻辑。

## 长期改进建议

1. **更友好的错误提示**：当模型不存在时，提供更清晰的错误信息，建议用户检查配置
2. **配置验证**：在启动时验证配置文件中的模型是否存在
3. **TUI 设置页面**：添加快速覆盖配置的调试功能（见下一节）
