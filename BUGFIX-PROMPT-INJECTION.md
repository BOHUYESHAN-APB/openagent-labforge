# 插件提示词注入问题修复总结

## 问题描述

用户报告了三个相关的问题：

1. **粘贴占位符泄露**：`[Pasted ~4 lines]` 这样的占位符出现在最终发送给 AI 的提示词中
2. **Undo 后提示词残留**：用户撤回消息后，插件注入的提示词（如 `[analyze-mode]`、`[search-mode]` 等）没有被清除，反而重复出现在用户的对话框中
3. **重复注入**：每次 undo 操作会导致同一条消息多次通过 hook，造成重复注入和 token 浪费

## 根本原因

这些问题都源于插件在 `experimental.chat.messages.transform` 和 `chat.message` hooks 中注入提示词时，没有正确处理消息重放（replay）场景：

1. **占位符来源**：OpenCode SDK 在用户粘贴大量文本时生成 `[Pasted ~N lines]` 占位符用于 UI 显示，但这个占位符被错误地包含在了发送给 AI 的消息中
2. **Undo 机制**：当用户 undo 时，OpenCode 会重新加载消息，此时之前注入的 synthetic parts 或文本前缀会重新出现
3. **缺少去重**：插件没有检测消息是否已经被处理过，导致重复注入

## 修复方案

### 1. 在 `context-injector` 中添加清理逻辑

**文件**: `src/features/context-injector/injector.ts`

添加了三个关键函数：

```typescript
// 清理粘贴占位符
function cleanPastePlaceholders(text: string): string {
  return text.replace(/\[Pasted ~?\d+ lines?\]\s*/gi, "").trim()
}

// 移除旧的 synthetic parts（防止重复注入）
function removeSyntheticParts(parts: Part[]): void {
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i] as { synthetic?: boolean }
    if (part.synthetic === true) {
      parts.splice(i, 1)
    }
  }
}

// 清理所有文本 parts 中的占位符
function cleanTextParts(parts: Part[]): void {
  for (const part of parts) {
    if (part.type === "text" && (part as { text?: string }).text) {
      const textPart = part as { text: string }
      textPart.text = cleanPastePlaceholders(textPart.text)
    }
  }
}
```

在 `experimental.chat.messages.transform` hook 中，在注入新内容前先调用这些清理函数。

### 2. 在 `keyword-detector` 中添加去重和清理

**文件**: `src/hooks/keyword-detector/hook.ts`

1. **添加消息指纹追踪**：使用 Map 记录每个 session 已处理的消息内容，防止重复处理
2. **主动清理注入前缀**：在检测关键词前，先清理掉已存在的模式标记
3. **更新模式列表**：确保所有模式标记都被正确识别和清理

```typescript
// 追踪已处理的消息
const processedMessages = new Map<string, string>()

// 在处理前检查是否重复
const messageFingerprint = sanitizedPrimaryText ?? sanitizedPromptText
const lastProcessed = processedMessages.get(input.sessionID)

if (lastProcessed === messageFingerprint) {
  log(`[keyword-detector] Skipping duplicate message processing`)
  return
}
```

### 3. 更新 `detector.ts` 中的清理函数

**文件**: `src/hooks/keyword-detector/detector.ts`

1. **添加粘贴占位符清理**：在 `extractPromptText` 和 `stripInjectedKeywordPrelude` 中都添加了占位符清理
2. **完善模式前缀列表**：确保所有注入的模式标记都在清理列表中

```typescript
const INJECTED_MODE_PREFIX_PATTERNS = [
  "[search-mode]",
  "[analyze-mode]",
  "[semantic-mode-hint]",
  "[ultrawork-autonomous-mode]",
  "<ultrawork-mode>",
]

function removePastePlaceholders(text: string): string {
  return text.replace(/\[Pasted ~?\d+ lines?\]\s*/gi, "").trim()
}
```

## 测试覆盖

创建了两个新的测试文件：

1. **paste-placeholder.test.ts**：测试粘贴占位符的清理功能
2. **undo-scenario.test.ts**：测试 undo 场景下的各种情况

所有测试（202 个）都通过了，确保修复没有破坏现有功能。

## 影响范围

修改的文件：
- `src/features/context-injector/injector.ts`
- `src/hooks/keyword-detector/hook.ts`
- `src/hooks/keyword-detector/detector.ts`

新增的测试文件：
- `src/hooks/keyword-detector/paste-placeholder.test.ts`
- `src/hooks/keyword-detector/undo-scenario.test.ts`

## 验证方法

用户可以通过以下步骤验证修复：

1. **粘贴占位符测试**：粘贴大量文本，检查 AI 收到的消息中是否还有 `[Pasted ~N lines]`
2. **Undo 测试**：
   - 输入包含关键词的消息（如 "search for bug"）
   - 等待插件注入提示词
   - 执行 undo 操作
   - 检查对话框中是否还有残留的 `[search-mode]` 等标记
3. **重复注入测试**：多次 undo/redo，检查是否会出现重复的提示词注入

## 注意事项

- 修复是向后兼容的，不会影响现有的插件功能
- 所有模式标记（search-mode, analyze-mode, ultrawork-mode, ultrawork-autonomous-mode, semantic-mode-hint）都已被正确处理
- 清理逻辑在消息处理的早期阶段执行，确保不会影响后续的关键词检测
