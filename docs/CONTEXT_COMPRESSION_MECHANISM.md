# 上下文压缩机制详解

## 概述

本系统实现了智能的上下文窗口管理，通过 L1/L2/L3 三级警告和自动压缩机制，确保会话不会因为上下文溢出而中断。

## 核心组件

### 1. Token 监控 (`preemptive-compaction.ts`)

**监控时机**：每次 assistant 消息完成时（`message.updated` 事件，`finish=true`）

**监控数据**：
```typescript
{
  input: number,           // 未命中缓存的输入 tokens
  output: number,          // 输出 tokens
  reasoning: number,       // 推理 tokens（如果支持）
  cache: {
    read: number,          // 命中缓存的 tokens
    write: number          // 写入缓存的 tokens
  }
}
```

**关键计算**：
```typescript
// 实际占用上下文窗口的 tokens = 未命中缓存 + 命中缓存
const totalInputTokens = tokens.input + tokens.cache.read

// 使用率
const usageRatio = totalInputTokens / contextLimit
```

### 2. 上下文限制检测

**优先级顺序**（从高到低）：

1. **用户自定义配置**（最高优先级）
   ```jsonc
   {
     "experimental": {
       "model_context_limits": {
         "openai/gpt-4": 128000,
         "deepseek/deepseek-chat": 128000,
         "custom-provider/custom-model": 32000  // 自定义服务商
       }
     }
   }
   ```
   
   **使用场景**：
   - ✅ 自定义服务商/中转站（OpenCode 无法自动检测）
   - ✅ 云服务器部署的开源模型
   - ✅ 修正 OpenCode API 返回的错误值
   - ✅ 测试和调试

2. **OpenCode API 缓存**（主要数据源 - 完全信任）
   - 来自实际 API 响应的 `modelContextLimitsCache`
   - OpenCode 对官方服务商的适配很积极且准确
   - 支持：Anthropic, OpenAI, Google, DeepSeek 等主流服务商
   - **推荐**：使用官方服务商时，完全依赖此数据源

3. **Anthropic 特殊处理**
   - 检查 `anthropicContext1MEnabled` 开关
   - 或环境变量 `ANTHROPIC_1M_CONTEXT`
   - 返回 1M 或 200K（Anthropic 的实际限制）

4. **无法确定时**：返回 `null`，禁用自动压缩
   - 避免错误地将 1M 模型限制为 200K
   - 显示提示，建议用户配置 `model_context_limits`
   - 这种情况很少见（OpenCode 对主流服务商适配完善）

### 3. L1/L2/L3 警告级别

**阈值配置**（`context-guard-threshold-profile.ts`）：

| Profile | 1M Context | 400K Context | 200K Context |
|---------|-----------|--------------|--------------|
| **Conservative** | L1: 600K (60%)<br>L2: 750K (75%)<br>L3: 850K (85%) | L1: 240K (60%)<br>L2: 300K (75%)<br>L3: 340K (85%) | L1: 120K (60%)<br>L2: 150K (75%)<br>L3: 170K (85%) |
| **Balanced** | L1: 700K (70%)<br>L2: 850K (85%)<br>L3: 950K (95%) | L1: 280K (70%)<br>L2: 340K (85%)<br>L3: 380K (95%) | L1: 140K (70%)<br>L2: 170K (85%)<br>L3: 190K (95%) |
| **Aggressive** | L1: 800K (80%)<br>L2: 900K (90%)<br>L3: 980K (98%) | L1: 320K (80%)<br>L2: 360K (90%)<br>L3: 392K (98%) | L1: 160K (80%)<br>L2: 180K (90%)<br>L3: 196K (98%) |

**触发效果**（模型自主触发）：

#### L1 级别（黄色警告）
**触发时机**：达到 60-80% 使用率

**系统行为**：
1. 写入 Context Capsule（`.opencode/openagent-labforge/runtime/<session>/context-capsule.md`）
2. 写入 Compression State（`.opencode/openagent-labforge/runtime/<session>/context-pressure.json`）
3. 显示 Toast 提示
4. 在工具输出中注入压缩通知（显示当前状态）

**模型指令**：无（L1 不注入指令）

**用户可见**：
```
▣ Labforge | 700K carried, 200K cache, +50K local
│████████████████████░░░░░░░░░░│
▣ Compression guard L1 (70.0% of 1M)
→ Profile: engineering
→ Threshold preset: balanced
→ Topic: Local capsule refreshed
→ Action: continue current wave with local memory discipline
→ Pruned: -0 stale, 0 messages, 0 tool outputs compacted
→ Files: .opencode/openagent-labforge/runtime/<session>/context-capsule.md, ...
```

#### L2 级别（橙色警告）
**触发时机**：达到 75-90% 使用率

**系统行为**：
1. 写入 Context Capsule
2. 写入 Compression State
3. **写入 Auto Checkpoint**（`.opencode/openagent-labforge/checkpoints/auto/latest.md`）
4. 显示 Toast 提示
5. 在工具输出中注入压缩通知
6. **注入压缩指令到最后一条用户消息**（模型可见）

**模型指令**（Engineering Profile）：
```
[Labforge Compression Directive]
- Profile: engineering
- Context debt is rising.
- Keep the current wave narrow and reviewable.
- Avoid reopening old branches unless they directly unblock the active checkpoint.
- Prefer runtime memory and concrete files over replaying long history in chat.
```

**模型指令**（Bio Profile）：
```
[Labforge Compression Directive]
- Profile: bioinformatics / academic
- Context debt is rising.
- Keep the current biological checkpoint narrow and reviewable.
- Do not reopen old literature or evidence branches unless they are directly required for the active checkpoint.
- Prefer local notes and durable result files over repeating long scientific context in chat.
```

**效果**：模型会主动压缩回复，避免重复历史，使用文件存储而非聊天记录

#### L3 级别（红色警告）
**触发时机**：达到 85-98% 使用率

**系统行为**：同 L2

**模型指令**（Engineering Profile）：
```
[Labforge Compression Directive]
- Profile: engineering
- Severe context debt detected.
- Finish the current implementation wave only.
- Do NOT open broad new refactors, research branches, or side investigations in this session.
- Keep only the active checkpoint live in chat.
- Prefer repo-local runtime memory and durable project files over restating long chat history.
- If the current wave closes cleanly, prepare a checkpoint and ask whether to continue in a fresh session.
```

**模型指令**（Bio Profile）：
```
[Labforge Compression Directive]
- Profile: bioinformatics / academic
- Severe context debt detected.
- Finish the current biological checkpoint only.
- Do NOT open a new modality, dataset branch, literature sweep, or wet-lab branch in this session.
- Keep only the current execution checkpoint live in chat.
- Move durable context into local memory or project outputs:
  - execution note
  - evidence note
  - writing note
  - wet-lab next
- Do not restate broad paper synthesis or long interpretation history in chat.
- If the current checkpoint closes cleanly, prepare a checkpoint and ask whether to continue in a fresh session.
```

**效果**：模型会严格限制范围，完成当前任务后建议用户开启新会话

**Micro-Pruning**（所有级别）：
- 自动压缩过长的工具输出（>1000 字符）
- 移除旧的压缩通知
- 统计并报告移除的 tokens 数量

### 4. 自动压缩触发

**触发条件**：
```typescript
// Preemptive threshold = L3 threshold - 5%
// 例如：1M context, balanced profile
// L3 = 950K (95%)
// Preemptive = 900K (90%)

if (usageRatio >= preemptiveThreshold) {
  // 触发自动压缩
  await ctx.client.session.summarize({
    path: { id: sessionID },
    body: { 
      providerID: targetProviderID, 
      modelID: targetModelID, 
      auto: true 
    }
  })
}
```

**压缩模型选择**（`compaction-model-resolver.ts`）：
- 优先使用用户配置的 `compaction_model`
- 否则使用当前会话模型
- Fallback 到 Haiku（便宜快速）

### 5. 上下文切换缓冲机制

**场景**：用户从大模型切换到小模型（如 1M → 400K → 200K）

**问题**：切换后立即触发压缩，体验不佳

**解决方案**（`context-switch-buffer.ts`）：

```typescript
// 检测到上下文切换
if (previousLimit !== newLimit) {
  registerContextSwitch(sessionID, previousLimit, newLimit)
}

// 60 秒缓冲期内，放宽阈值
const bufferedThreshold = getBufferedThreshold(
  sessionID, 
  normalThreshold,  // 例如 90%
  currentLevel      // L1/L2/L3
)

// 如果在 L3 级别，放宽到 L2 级别（+15%）
// 例如：90% → 85%
```

**效果**：
- 切换后有 60 秒适应期
- 第一次压缩使用更宽松的阈值
- 压缩成功后清除缓冲

## 压缩过程详解

### OpenCode 的 `session.summarize()` 做了什么？

**步骤 1：分析会话历史**
- 读取所有消息（user + assistant）
- 识别关键信息：
  - 用户目标和需求
  - 已完成的工作
  - 当前状态和上下文
  - 待办事项

**步骤 2：生成摘要**
- 使用指定模型（或 fallback）
- 生成结构化摘要：
  ```markdown
  1. Primary Request and Intent
  2. Key Technical Concepts
  3. Files and Code Sections
  4. Errors and fixes
  5. Problem Solving
  6. All user messages
  7. Pending Tasks
  8. Current Work
  ```

**步骤 3：替换消息**
- 删除旧的 user/assistant 消息
- 插入摘要消息（system-reminder）
- 保留最近的几条消息（通常 2-3 条）

**步骤 4：更新 Token 计数**
- 重新计算会话 token 使用
- 通常压缩率：60-80%（取决于内容）

### 模型会压缩掉什么？

**会保留**：
- ✅ 用户的核心需求和目标
- ✅ 关键的技术决策和原因
- ✅ 已修改的文件和代码片段
- ✅ 错误和解决方案
- ✅ 待办任务列表
- ✅ 当前工作状态

**会压缩**：
- ❌ 重复的讨论
- ❌ 中间的探索过程
- ❌ 详细的代码输出（保留文件路径和摘要）
- ❌ 工具调用的详细日志
- ❌ 已解决的临时问题

**不会丢失**：
- ✅ 文件修改（已写入磁盘）
- ✅ 配置更改（已保存）
- ✅ 用户的所有原始消息（在摘要中引用）

## 完整流程示例

### 场景：1M Context, Balanced Profile

```
1. 初始状态
   - Context limit: 1,000,000 tokens
   - Current usage: 0 tokens
   - L1: 700K (70%), L2: 850K (85%), L3: 950K (95%)
   - Preemptive: 900K (90%)

2. 用户工作中...
   - 50K → 100K → 200K → 400K → 600K
   - 无警告

3. 达到 L1 (700K)
   - 🟡 Toast: "Context usage: 700K/1M (70%)"
   - 继续工作

4. 达到 L2 (850K)
   - 🟠 Toast: "Context usage: 850K/1M (85%) - Consider compacting"
   - 继续工作

5. 达到 Preemptive (900K)
   - 🔄 自动触发压缩
   - Toast: "Auto Compact: Summarizing session..."
   - 调用 session.summarize()

6. 压缩完成
   - ✅ Toast: "Session summarized. Context counter should drop now."
   - 新 usage: ~300K (压缩率 67%)
   - 继续工作

7. 用户切换模型（1M → 400K）
   - 检测到上下文切换
   - 注册 60 秒缓冲期
   - 新 L3: 380K (95%)
   - 新 Preemptive: 360K (90%)
   - 当前 usage: 300K (75%)
   - 缓冲期内放宽到 L2: 340K (85%)
   - 不触发压缩

8. 继续工作
   - 300K → 320K → 340K
   - 达到缓冲阈值 (340K)
   - 触发第一次压缩（使用放宽的阈值）
   - 压缩后清除缓冲
   - 后续使用正常阈值 (360K)
```

## 配置选项

### 用户可配置项

```jsonc
{
  "experimental": {
    // 上下文守卫配置文件
    "context_guard_profile": "balanced",  // conservative | balanced | aggressive
    
    // 自定义阈值（覆盖 profile）
    "context_guard_thresholds": {
      "one_million": {
        "l1_tokens": 700000,
        "l2_tokens": 850000,
        "l3_tokens": 950000
      },
      "four_hundred_k": {
        "l1_tokens": 280000,
        "l2_tokens": 340000,
        "l3_tokens": 380000
      }
    },
    
    // 自定义模型上下文限制
    // 使用场景：
    // 1. 自定义服务商/中转站（OpenCode 无法自动检测）
    // 2. 云服务器部署的开源模型
    // 3. 修正 OpenCode API 返回的错误值
    "model_context_limits": {
      "openai/gpt-4": 128000,
      "deepseek/deepseek-chat": 128000,
      "custom-provider/llama-3-70b": 32000,  // 自定义服务商示例
      "my-server/qwen-72b": 128000           // 自部署模型示例
    },
    
    // 压缩模型配置
    "compaction_model": "anthropic/claude-haiku-4-5"
  }
}
```

### 自定义服务商配置指南

如果你使用的是：
- 🔧 自建 API 服务器
- 🌐 第三方中转站
- ☁️ 云服务器部署的开源模型

OpenCode 可能无法自动检测上下文限制，你需要手动配置：

**步骤 1：确定模型的上下文窗口大小**

查看模型文档或 API 响应，确认实际的 context window：
- Llama 3 70B: 8K-32K（取决于部署配置）
- Qwen 72B: 32K-128K
- Mixtral 8x7B: 32K

**步骤 2：添加到配置文件**

```jsonc
{
  "experimental": {
    "model_context_limits": {
      "your-provider/your-model": 32000  // 替换为实际值
    }
  }
}
```

**步骤 3：验证配置**

启动会话后，检查日志：
```bash
grep "Using user custom limit" ~/.opencode/logs/opencode.log
```

应该看到类似输出：
```
[preemptive-compaction] Using user custom limit: { fullModelID: 'your-provider/your-model', limit: 32000 }
```

## 监控和调试

### 查看日志

```bash
# 搜索压缩相关日志
grep "preemptive-compaction" ~/.opencode/logs/opencode.log

# 关键日志：
# - Token data received
# - Using OpenCode API limit
# - Context switch detected
# - Native session summarize requested
# - Compaction failed
```

### 常见问题

**Q: 为什么压缩后 token 没有明显下降？**
A: 可能原因：
- 最近的消息占用大量 tokens（不会被压缩）
- 会话内容高度相关，难以压缩
- 检查日志确认压缩是否成功

**Q: 为什么切换模型后立即触发压缩？**
A: 检查是否启用了上下文切换缓冲：
- 应该有 60 秒缓冲期
- 检查日志中的 "Context switch detected"

**Q: 如何禁用自动压缩？**
A: 目前不支持完全禁用，但可以：
- 使用 aggressive profile（更晚触发）
- 自定义阈值设置为 98%

## 总结

本系统通过以下机制确保上下文管理的智能和平滑：

1. **准确检测** - 优先使用 OpenCode API 数据，完全信任官方适配
2. **分级警告** - L1/L2/L3 三级提示，用户可感知
3. **自动压缩** - 达到阈值自动触发，无需手动干预
4. **平滑切换** - 上下文切换缓冲，避免频繁压缩
5. **灵活配置** - 多种 profile 和自定义选项
6. **安全兜底** - 无法确定上下文时禁用自动压缩，避免错误限制

用户可以根据自己的使用习惯和预算，选择合适的配置策略。
