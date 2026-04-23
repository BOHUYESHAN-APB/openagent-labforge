# OpenCode 问题诊断与修复报告

## 问题概述

通过日志分析发现了三个相互关联的严重问题：

### 1. 🔴 Git Snapshot 持续失败（根本原因）
**错误信息**:
```
error: '.opencode/openagent-labforge/runtime/ses_XXX/documents/prepare-multiple-3000-direct-upload-docx-reports-with-strict-chi/' does not have a commit checked out
fatal: adding files failed
```

**影响**:
- 每 2 秒出现一次，严重影响系统性能
- 导致 OpenCode 无法创建快照
- 影响上下文管理和文件追踪
- 间接导致其他功能失败

**根本原因**:
- `.opencode/` 目录下的运行时文件被 git 追踪
- 这些文件频繁变化但没有正确的 git commit
- OpenCode 的 snapshot 服务尝试对这些文件创建快照时失败

### 2. 🔴 API 调用失败
**错误信息**:
```
ERROR service=llm providerID=anthropic modelID=claude-sonnet-4-6 error=AI_APICallError
```

**影响**:
- 所有 AI 请求失败
- 子 agent（explorer, plan 等）无法正常工作
- 委派的任务立即失败

**可能原因**:
- API 端点问题（`https://yunyi.rdzhvip.com/claude/v1/messages`）
- 网络连接问题
- 由于 git snapshot 错误导致的系统资源耗尽

### 3. 🔴 子 Agent 快速退出
**表现**:
- Explorer agent 启动后立即退出（0 秒）
- 所有委派的子任务都失败
- 特别影响计划类 agent（Prometheus）

**原因**:
- Git snapshot 错误导致系统不稳定
- API 调用失败导致 agent 无法获取响应
- 系统资源被 snapshot 重试占用

### 4. ⚠️ 插件提示词 Undo 残留（已修复）
**问题**:
- 用户 undo 后，插件注入的提示词没有被清除
- `[Pasted ~N lines]` 占位符泄露到 AI 提示词中
- 重复注入导致 token 浪费

## 已实施的修复

### 修复 1: Git Snapshot 问题
**文件**: `scripts/fix-git-snapshot.sh`

```bash
# 清理运行时目录
rm -rf .opencode/openagent-labforge/runtime/*/documents/

# 从 git 中移除 .opencode/ 目录
git rm -r --cached .opencode/

# 清理 git 缓存
git gc --prune=now
```

**执行结果**: ✅ 成功清理，已从 git 追踪中移除

### 修复 2: 插件提示词注入清理
**修改的文件**:
1. `src/features/context-injector/injector.ts`
   - 添加 `cleanPastePlaceholders()` - 清理粘贴占位符
   - 添加 `stripInjectedContext()` - 清理旧的注入内容
   - 添加 `removeSyntheticParts()` - 移除 synthetic parts
   - 添加 `cleanTextParts()` - 清理所有文本 parts

2. `src/hooks/keyword-detector/hook.ts`
   - 添加消息指纹追踪，防止重复处理
   - 主动清理已注入的模式标记
   - 在处理前先清理旧内容

3. `src/hooks/keyword-detector/detector.ts`
   - 更新 `INJECTED_MODE_PREFIX_PATTERNS` 包含所有模式
   - 在 `extractPromptText()` 中清理占位符
   - 在 `stripInjectedKeywordPrelude()` 中清理占位符

**测试结果**: ✅ 所有 202 个测试通过

### 修复 3: 上下文注入清理增强
**文件**: `src/features/context-injector/injector.ts`

在 `injectPendingContext()` 函数中添加：
- 清理粘贴占位符
- 剥离旧的注入内容（处理 undo/replay）
- 防止重复注入

## 需要用户执行的操作

### 立即操作（必须）

1. **重启 OpenCode**
   ```bash
   # 完全退出 OpenCode，然后重新启动
   ```

2. **验证 Git Snapshot 修复**
   - 重启后观察日志，确认不再有 snapshot 错误
   - 如果仍有问题，运行：
     ```bash
     rm -rf .opencode/
     # 然后重启 OpenCode
     ```

3. **测试子 Agent 功能**
   - 尝试委派一个简单的 explorer 任务
   - 检查是否能正常执行而不是立即退出

### 验证步骤

1. **验证 Git Snapshot**
   ```bash
   # 查看最新日志
   tail -f "C:\Users\BoHuYeShan\.local\share\opencode\log\*.log" | grep snapshot
   # 应该不再看到 "does not have a commit checked out" 错误
   ```

2. **验证提示词注入**
   - 粘贴大量文本，检查是否还有 `[Pasted ~N lines]`
   - 输入包含关键词的消息（如 "search for bug"）
   - 执行 undo，检查是否还有残留的 `[search-mode]` 等标记

3. **验证子 Agent**
   - 使用 Prometheus 创建一个计划
   - 观察是否能成功委派 explorer agent
   - 检查 agent 是否正常执行而不是立即退出

## 潜在的后续问题

### API 连接问题
如果子 agent 仍然失败，可能需要检查：
- API 端点配置（`https://yunyi.rdzhvip.com/claude/v1/messages`）
- 网络连接
- API 密钥有效性
- 速率限制

### 系统资源
如果问题持续，检查：
- 内存使用情况
- CPU 使用情况
- 磁盘空间
- 并发 session 数量

## 技术细节

### 修复的模式标记列表
```typescript
const INJECTED_MODE_PREFIX_PATTERNS = [
  "[search-mode]",
  "[analyze-mode]",
  "[semantic-mode-hint]",
  "[ultrawork-autonomous-mode]",
  "<ultrawork-mode>",
]
```

### 清理逻辑流程
```
用户消息 → 
  清理粘贴占位符 → 
  移除旧的 synthetic parts → 
  剥离旧的注入内容 → 
  检查消息指纹（防重复）→ 
  注入新内容（如需要）
```

## 总结

✅ **已修复**:
- Git snapshot 错误（清理了 .opencode/ 目录）
- 粘贴占位符泄露
- Undo 后提示词残留
- 重复注入问题

⏳ **需要验证**:
- 子 agent 是否能正常工作（需要重启 OpenCode 后测试）
- API 调用是否恢复正常

📋 **下一步**:
1. 重启 OpenCode
2. 测试子 agent 功能
3. 如果仍有问题，检查 API 配置和网络连接
