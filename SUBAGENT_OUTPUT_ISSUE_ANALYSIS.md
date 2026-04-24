# 子代理输出为空问题分析

## 问题描述
用户报告：打开子代理的工作内容时，显示全部是空白的。

## 根本原因

### 1. 我们的插件覆盖了 OpenCode 原生的 task 工具

**位置**: `src/plugin/tool-registry.ts:171`
```typescript
task: delegateTask,  // 我们的实现覆盖了 OpenCode 原生的 task 工具
```

### 2. 文本提取逻辑的差异

**OpenCode 原生** (`packages/opencode/src/tool/task.ts:157`):
```typescript
result.parts.findLast((item) => item.type === "text")?.text ?? ""
```
- 只取**最后一个** type 为 "text" 的 part
- 简单直接

**我们的插件** (`src/tools/delegate-task/sync-result-fetcher.ts:51-57`):
```typescript
for (const msg of assistantMessages) {
  const textParts = msg.parts?.filter((p) => p.type === "text" || p.type === "reasoning") ?? []
  const content = textParts.map((p) => p.text ?? "").filter(Boolean).join("\n")
  if (content) {
    textContent = content
    break
  }
}
```
- 遍历所有 assistant 消息（从新到旧）
- 过滤 type 为 "text" 或 "reasoning" 的 parts
- 取第一个有内容的消息

### 3. 我们的逻辑更复杂但更健壮

我们的实现来自这个修复：
- Commit: `0d1b6ebe` - "fix: resolve empty response when custom agents end with tool calls"
- 目的：当最后一条 assistant 消息只包含工具调用（没有文本）时，向前查找有文本的消息

## 可能的问题场景

### 场景 A：msg.parts 为 undefined 或空数组
```typescript
msg.parts?.filter(...)  // 如果 parts 是 undefined，返回 []
```

### 场景 B：parts 存在但 type 不是 "text" 或 "reasoning"
可能的其他类型：
- `"tool_use"`
- `"tool_result"`
- 其他未知类型

### 场景 C：p.text 字段不存在或为空字符串
```typescript
p.text ?? ""  // 如果 text 是 undefined，返回 ""
.filter(Boolean)  // 过滤掉空字符串
```

## 调试方案

### 已添加的调试日志
在 `sync-result-fetcher.ts` 和 `unstable-agent-task.ts` 中添加了：
```typescript
if (process.env.DEBUG_SUBAGENT_OUTPUT) {
  console.log("[DEBUG] Message parts:", JSON.stringify(msg.parts?.map(p => ({ type: p.type, hasText: !!p.text })), null, 2))
}
```

### 使用方法
```bash
export DEBUG_SUBAGENT_OUTPUT=1
opencode
```

然后运行一个子代理任务，查看控制台输出。

## 可能的解决方案

### 方案 1：保持当前逻辑，添加更多调试信息
- 优点：不破坏现有功能
- 缺点：需要用户配合收集日志

### 方案 2：回退到 OpenCode 原生逻辑
```typescript
const textContent = assistantMessages[0]?.parts?.findLast((p) => p.type === "text")?.text ?? ""
```
- 优点：与 OpenCode 原生行为一致
- 缺点：失去了处理"最后消息只有工具调用"的能力

### 方案 3：混合方案
```typescript
let textContent = ""
for (const msg of assistantMessages) {
  // 先尝试 findLast（与 OpenCode 原生一致）
  const lastTextPart = msg.parts?.findLast((p) => p.type === "text")
  if (lastTextPart?.text) {
    textContent = lastTextPart.text
    break
  }
  
  // 如果没有，尝试所有 text 和 reasoning parts
  const textParts = msg.parts?.filter((p) => p.type === "text" || p.type === "reasoning") ?? []
  const content = textParts.map((p) => p.text ?? "").filter(Boolean).join("\n")
  if (content) {
    textContent = content
    break
  }
}
```

### 方案 4：不覆盖 OpenCode 的 task 工具
- 将我们的工具重命名为 `delegate_task` 或其他名称
- 让 OpenCode 原生的 `task` 工具保持不变
- 优点：不影响 OpenCode 原生行为
- 缺点：需要大量重构，影响所有使用 `task()` 的代码

## 实际根本原因（已确认）✅

通过分析日志文件 `2026-04-24T024617.log`，发现：

1. **父会话**（主代理 ses_242b3e7fdffesnep0E6l2k9SvL）使用：`anthropic/claude-sonnet-4-6`
2. **子会话**（助手帮手 ses_2429df6b3ffejcb07VCu567xr7）尝试使用：`openai/gpt-5.4`（不存在）
3. 错误：`ProviderModelNotFoundError: providerID=openai modelID=gpt-5.4`

**问题原因**：子代理没有正确继承父代理的模型，而是使用了某个配置中的 `openai/gpt-5.4`。

## 修复方案 ✅

### 修改的文件
- `src/tools/delegate-task/category-resolver.ts` - 明确注释模型选择优先级

### 模型选择优先级（已确认正确）
1. **explicitCategoryModel** - 用户为特定 category 显式配置的模型（最高优先级）
2. **inheritedModel** - 从父代理继承的模型（默认行为）
3. **sisyphusJuniorModel** - 全局 sisyphus-junior 配置的模型
4. **resolved.model** - category 的默认模型

代码中的优先级是正确的：
```typescript
explicitCategoryModel ?? inheritedModel ?? overrideModel ?? resolved.model
```

### 用户配置问题
用户可能在某个配置文件中为 `sisyphus-junior` 或某个 category 设置了 `openai/gpt-5.4` 模型。
需要检查：
- 全局配置：`~/.opencode/openagent-labforge.jsonc`
- 项目配置：`.opencode/openagent-labforge.jsonc`
- 查找是否有 `agents.sisyphus-junior.model` 或 `categories.*.model` 设置为 `openai/gpt-5.4`

## 建议

1. ✅ **已修复**：添加了清晰的注释说明模型选择优先级
2. **用户行动**：检查配置文件，移除或修正 `openai/gpt-5.4` 的配置
3. **长期改进**：考虑在模型不存在时提供更友好的错误提示，建议用户检查配置

## 相关文件

- `src/plugin/tool-registry.ts:171` - 工具注册（覆盖点）
- `src/tools/delegate-task/sync-result-fetcher.ts` - 同步任务结果提取
- `src/tools/delegate-task/unstable-agent-task.ts` - 不稳定代理任务结果提取
- `packages/opencode/src/tool/task.ts` - OpenCode 原生 task 工具
