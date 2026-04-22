# Review 机制确认和输出验证

## ✅ 确认：Review 后的输出是短的

### Momus Review 工作流程

```
1. Prometheus 生成计划 → 写入 plans/{name}.md (5000 tokens)

2. 用户选择 "High Accuracy Review"

3. Prometheus 调用 Momus:
   task(
     subagent_type="momus",
     prompt=".opencode/openagent-labforge/plans/{name}.md"
   )

4. Momus 读取计划文件 (5000 tokens input)
   
5. Momus 返回 review 结果 (~500 tokens):
   ```
   REVIEW RESULT: NEEDS_REVISION
   
   Critical Issues:
   1. Task 3: Missing file path specification
   2. Task 7: Verification command unclear
   
   Minor Issues:
   1. Consider adding rollback step
   
   Recommendations:
   - Add specific file paths to Task 3
   - Specify exact verification command in Task 7
   ```

6. Prometheus 读取 review (500 tokens input)

7. Prometheus 编辑 plans/{name}.md (只修改问题部分)

8. Prometheus 输出简短确认 (~100 tokens):
   "✓ Plan updated based on Momus review. Resubmitting for verification."

9. 重复 3-8 直到 Momus 返回 "OKAY"
```

### Token 消耗分析

**单次 Review 循环：**
- Momus 读取计划：5000 tokens (input)
- Momus 输出 review：500 tokens (output)
- Prometheus 读取 review：500 tokens (input)
- Prometheus 编辑计划：0 tokens (文件操作)
- Prometheus 输出确认：100 tokens (output)
- **总消耗：6100 tokens**

**如果 Prometheus 重复输出整个计划（错误做法）：**
- Momus 读取计划：5000 tokens
- Momus 输出 review：500 tokens
- Prometheus 读取 review：500 tokens
- Prometheus 输出整个计划：5000 tokens ← 浪费！
- **总消耗：11000 tokens**
- **浪费：4900 tokens (45%)**

**结论：✅ 当前机制是正确的，Review 后输出是短的！**

---

## Momus 的输出格式

### 拒绝时（NEEDS_REVISION）

```
REVIEW RESULT: NEEDS_REVISION

Critical Issues:
1. [具体问题描述]
2. [具体问题描述]

Minor Issues:
1. [建议]
2. [建议]

Recommendations:
- [具体改进建议]
- [具体改进建议]
```

**输出长度：** ~300-800 tokens（取决于问题数量）

### 批准时（OKAY）

```
REVIEW RESULT: OKAY

The plan is executable and ready for implementation.

Verified:
- All file references exist and are valid
- All tasks have clear starting points
- QA scenarios are concrete and executable
- No critical blockers found

The plan meets the quality bar for high accuracy mode.
```

**输出长度：** ~100-200 tokens

---

## Prometheus 的响应

### 收到 NEEDS_REVISION 后

```typescript
// Prometheus 读取 Momus 的 review
const review = momusOutput

// Prometheus 分析问题
// Prometheus 编辑 plans/{name}.md（只修改问题部分）
Edit(".opencode/openagent-labforge/plans/{name}.md", 
  old_string="Task 3: Process data",
  new_string="Task 3: Process data from src/data/input.csv"
)

// Prometheus 输出简短确认
output = "✓ Plan updated based on Momus review. Resubmitting for verification."
```

**输出长度：** ~50-150 tokens

### 收到 OKAY 后

```typescript
// Prometheus 输出最终确认
output = `✓ Plan approved by Momus after high accuracy review.

Plan saved to: .opencode/openagent-labforge/plans/{name}.md

Next step: Run \`/ol-start-work\` to begin execution.`
```

**输出长度：** ~50-100 tokens

---

## 完整的 High Accuracy 流程示例

### 场景：生成 RNA-seq 分析计划

```
1. 用户: "/plan 设计 RNA-seq 差异表达分析流程"

2. Prometheus 采访、研究（多轮对话）

3. Prometheus 生成计划 → plans/rna-seq-analysis.md (5000 tokens)

4. Prometheus 询问: "需要 High Accuracy Review 吗？"

5. 用户: "是"

6. Prometheus → Momus (第一次)
   - Momus 读取计划
   - Momus 发现 3 个问题
   - Momus 输出 review (500 tokens)

7. Prometheus 读取 review (500 tokens)
   - Prometheus 修改计划文件
   - Prometheus 输出: "✓ 已更新，重新提交" (100 tokens)

8. Prometheus → Momus (第二次)
   - Momus 读取更新后的计划
   - Momus 发现 1 个问题
   - Momus 输出 review (300 tokens)

9. Prometheus 读取 review (300 tokens)
   - Prometheus 修改计划文件
   - Prometheus 输出: "✓ 已更新，重新提交" (100 tokens)

10. Prometheus → Momus (第三次)
    - Momus 读取最终计划
    - Momus 批准: "OKAY" (150 tokens)

11. Prometheus 输出最终确认 (100 tokens)
    "✓ 计划已通过高精度审查。运行 /ol-start-work 开始执行。"
```

### Token 消耗统计

| 步骤 | 操作 | Tokens |
|------|------|--------|
| 3 | 生成计划（写入文件） | 5000 |
| 6 | Momus 读取 + 输出 | 5500 |
| 7 | Prometheus 读取 + 输出 | 600 |
| 8 | Momus 读取 + 输出 | 5300 |
| 9 | Prometheus 读取 + 输出 | 400 |
| 10 | Momus 读取 + 输出 | 5150 |
| 11 | Prometheus 输出 | 100 |
| **总计** | | **22050 tokens** |

**如果 Prometheus 每次都重复输出整个计划：**
- 额外浪费：5000 × 3 = 15000 tokens
- 总消耗：37050 tokens
- **浪费：40%**

**结论：✅ 当前机制避免了这种浪费！**

---

## 关键设计原则

### 1. 文件是 Single Source of Truth

```
计划文件 = 唯一真相来源
├─ Prometheus 写入
├─ Momus 读取
├─ Prometheus 编辑
├─ Atlas 读取并执行
└─ 用户直接查看
```

**好处：**
- 避免重复输出
- 所有人看到同一版本
- 历史可追溯（git）

### 2. Review 结果是增量信息

```
Review 不是重复计划，而是：
- 发现的问题
- 改进建议
- 验证结果
```

**好处：**
- 输出简短
- 聚焦问题
- 易于理解

### 3. 确认消息是元信息

```
Prometheus 的确认不是内容，而是：
- 状态更新
- 下一步指引
- 元数据
```

**好处：**
- 极短输出
- 清晰指引
- 不重复内容

---

## 对比：错误的做法

### ❌ 错误做法 1：重复输出计划

```typescript
// Momus 返回 review
const review = momusOutput

// Prometheus 读取计划文件
const plan = readFile("plans/{name}.md")

// Prometheus 输出（错误！）
output = `
Momus Review Result:
${review}

Updated Plan:
${plan}  ← 5000 tokens 的重复！
`
```

### ❌ 错误做法 2：在对话中修改计划

```typescript
// Prometheus 不修改文件，而是在输出中展示修改
output = `
I've updated the plan as follows:

Task 3 (old): Process data
Task 3 (new): Process data from src/data/input.csv  ← 用户看不到文件变化

Task 7 (old): Verify results
Task 7 (new): Run pytest tests/test_analysis.py  ← 文件没有真正更新
`
```

### ✅ 正确做法：文件操作 + 简短确认

```typescript
// Prometheus 直接编辑文件
Edit("plans/{name}.md", 
  old_string="Task 3: Process data",
  new_string="Task 3: Process data from src/data/input.csv"
)

Edit("plans/{name}.md",
  old_string="Task 7: Verify results", 
  new_string="Task 7: Run pytest tests/test_analysis.py"
)

// Prometheus 输出简短确认
output = "✓ Plan updated based on Momus review. Resubmitting for verification."
```

---

## 总结

### ✅ 已确认

1. **Review 后输出是短的** - Momus 只返回 review 结果（~500 tokens）
2. **Prometheus 不重复计划** - 只输出简短确认（~100 tokens）
3. **文件是唯一真相** - 所有修改都在文件中
4. **Token 消耗合理** - 避免了 40% 的浪费

### 🎯 设计优势

1. **高效** - 不重复大量内容
2. **清晰** - 文件是唯一版本
3. **可追溯** - 文件历史可查
4. **可扩展** - 适用于集群 agent

### 📋 为 Swarm 的启示

集群 agent 也应该遵循同样的原则：
1. **结果写入文件** - 不在消息中传递大量内容
2. **消息是元信息** - 只传递状态、指令、简短摘要
3. **文件是真相** - 所有 agent 读取同一文件
4. **避免重复** - 不在多个地方存储同样的内容
