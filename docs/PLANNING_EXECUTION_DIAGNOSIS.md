# 规划执行系统问题诊断报告

## 诊断时间
2026-04-22

## 用户反馈的问题

1. **Task error 出现在日志中**
2. **提问机制问题**：倾向于一次问一个问题，而不是同时问多个
3. **计划路由问题**：需要确认是否正确路由到生信规划
4. **执行器显示混淆**：
   - 显示的是"任务计划器"（prometheus）
   - 但委派给了"生信全自动"（bio-autopilot）
   - 会话框颜色是"快速开发"（atlas）
5. **Boulder.json 未更新**：执行命令后仍显示旧计划

## 诊断结果

### ✅ 计划内容正确

**文件**: `.opencode/openagent-labforge/plans/ncbi-protein-analysis.md`

**内容分析**：
- ✅ 正确识别为生信任务（NCBI、Biopython、蛋白质序列分析）
- ✅ 推荐执行器：`生信全自动 (bio-autopilot)`
- ✅ 计划结构符合生信分析流程（数据获取 → QC → 分析 → 验证）
- ✅ 包含生信特征关键词：NCBI, Entrez, SeqIO, ProtParam, FASTA

**结论**：Prometheus 正确检测到生信任务并采用了 bio-planner 风格。

### ✅ 智能路由配置正确

**文件**: `src/agents/prometheus/intelligent-routing.ts`

**配置内容**：
```typescript
// 生信关键词检测
- NCBI, Biopython, 蛋白质, RNA-seq, DNA-seq, FASTQ, BAM, VCF 等
- 中文关键词：生信, 生物信息, 组学, 测序, 基因, 蛋白 等

// 路由逻辑
if (bioSignals > engSignals * 2) return "bioinformatics"
→ 采用 bio-planner 规划风格
→ 推荐 bio-autopilot 执行器
```

**结论**：智能路由逻辑正确，能够检测生信任务。

### ❌ Boulder.json 未更新

**文件**: `.opencode/openagent-labforge/boulder.json`

**当前内容**：
```json
{
  "active_plan": "gpt-account-pool-relay.md",  // 旧的工程任务
  "agent": "atlas"  // 快速开发
}
```

**问题**：
- 用户创建了新的生信计划（ncbi-protein-analysis.md）
- 但 boulder.json 仍指向旧计划
- 这会导致 /start-work 继续执行旧计划

**原因**：
- 用户可能只运行了 prometheus 创建计划
- 没有运行 /start-work 来更新 boulder.json
- 或者 /start-work 没有正确更新 boulder.json

### ⚠️ 执行器显示混淆

**用户描述**：
1. 执行命令的窗口颜色是"计划器"（prometheus）的颜色
2. 显示的执行器是"任务计划器"
3. 但实际委派给了"生信全自动"（bio-autopilot）
4. 会话框颜色是"快速开发"（atlas）

**分析**：
- **Prometheus 颜色**: #F59E0B（琥珀色）
- **Executor 颜色**: #10B981（绿色）
- **Atlas 颜色**: 需要确认

**可能原因**：
1. 用户选择了 prometheus 创建计划
2. 然后运行了某个命令（可能是 /start-work）
3. Executor 读取计划并委派给 bio-autopilot
4. 但 UI 显示的仍是 prometheus 或 atlas

**问题根源**：
- Executor agent 作为"路由器"，它的职责是读取计划并委派
- 但用户看到的是 executor 的颜色/名称，而不是最终执行的 bio-autopilot
- 这造成了混淆

### ⚠️ 提问机制问题

**用户反馈**：
- Agent 倾向于一次问一个问题
- 应该能够同时问多个问题

**可能原因**：
1. OpenCode 的 `question` 工具可能不支持一次问多个问题
2. Agent 的提示词没有鼓励批量提问
3. 模型倾向于逐步交互

**需要检查**：
- OpenCode 的 question 工具是否支持多问题
- Prometheus 的提示词是否鼓励批量提问

## 建议的修复方案

### 修复 1：优化 Executor 的用户体验

**问题**：Executor 作为路由器，用户看到的是 executor，但实际工作的是 bio-autopilot

**方案 A**：让 Executor 更透明
```typescript
// 在 executor.ts 中
"You are the intelligent executor (router).

When you delegate to another executor:
1. Clearly tell the user: '检测到生信任务，正在委派给生信全自动执行器...'
2. Use task() to delegate
3. The delegated agent will take over the conversation
4. You should exit after delegation"
```

**方案 B**：简化流程，让用户直接选择执行器
- 用户创建计划后，prometheus 推荐执行器
- 用户直接选择推荐的执行器（bio-autopilot）
- 不经过 executor 路由

**方案 C**：Executor 自动切换 agent
- Executor 检测到生信任务后
- 自动切换当前会话的 agent 为 bio-autopilot
- 用户看到的就是 bio-autopilot 在工作

**推荐**：方案 A（最简单，最透明）

### 修复 2：确保 /start-work 更新 boulder.json

**检查点**：
1. /start-work 是否正确读取最新的计划文件
2. 是否正确更新 boulder.json 的 active_plan
3. 是否正确设置 agent 字段

**建议**：
```typescript
// 在 start-work template 中强调
"5. **Update boulder.json** (CRITICAL):
   - Set active_plan to the selected plan file path
   - Set agent to the executor you will use (bio-autopilot or atlas)
   - Add current session_id to session_ids array
   - Set started_at timestamp"
```

### 修复 3：优化提问机制

**检查 Prometheus 提示词**：
```typescript
// 在 prometheus interview-mode 中添加
"## Efficient Questioning

When you need multiple pieces of information:
- Ask ALL questions at once in a single message
- Use numbered list format
- Don't wait for one answer before asking the next
- Example:
  '我需要了解以下信息：
   1. 测序类型是什么？（RNA-seq, DNA-seq, 等）
   2. 参考基因组版本？
   3. 样本分组信息？
   4. 预期的分析结果？'"
```

### 修复 4：清理旧的 boulder.json

**立即操作**：
```bash
# 用户工作区
cd D:\-Users-\Documents\GitHub\AUI

# 检查当前计划状态
cat .opencode/openagent-labforge/boulder.json

# 如果旧计划已完成，清理 boulder.json
# 让 /start-work 重新选择计划
```

## 测试建议

### 测试 1：完整的生信任务流程
```bash
1. 用户: "帮我规划一个 NCBI 蛋白质分析任务"
2. 选择 prometheus（任务规划）
3. Prometheus 创建计划，推荐 bio-autopilot
4. 用户: "/start-work"
5. 验证：
   - boulder.json 更新为 ncbi-protein-analysis.md
   - agent 字段为 bio-autopilot 或 executor
   - 执行器正确路由到 bio-autopilot
   - 用户看到清晰的路由信息
```

### 测试 2：工程任务流程
```bash
1. 用户: "帮我规划一个 REST API"
2. 选择 prometheus（任务规划）
3. Prometheus 创建计划，推荐 atlas
4. 用户: "/start-work"
5. 验证：
   - boulder.json 更新
   - 执行器路由到 atlas
```

### 测试 3：批量提问
```bash
1. 用户: "帮我规划一个 RNA-seq 分析"
2. Prometheus 应该一次性问：
   - 测序类型？
   - 参考基因组？
   - 样本分组？
   - 预期结果？
3. 而不是一个一个问
```

## 优先级

### P0（立即修复）
1. ✅ 优化 Executor 的用户提示（方案 A）
2. ✅ 确保 /start-work 更新 boulder.json

### P1（重要）
3. ⚠️ 优化 Prometheus 批量提问机制
4. ⚠️ 清理用户工作区的旧 boulder.json

### P2（改进）
5. 考虑简化流程（方案 B 或 C）
6. 添加更多的用户反馈和状态提示

## 下一步行动

1. **立即**：修改 executor.ts，添加清晰的路由提示
2. **立即**：检查 start-work template，确保更新 boulder.json
3. **今天**：测试完整流程
4. **今天**：优化 prometheus 批量提问
5. **明天**：用户测试和反馈收集
