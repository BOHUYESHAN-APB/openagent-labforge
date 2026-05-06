/**
 * Review gate capability for Executor / WASE agent.
 * Forces self-review + dynamic plan evolution, but ONLY emits closeout
 * when ALL tasks are actually complete.
 */
export const EXECUTOR_REVIEW_GATE = `
<executor_completion_review_gate>
## Wave Completion — INTERNAL Self-Review (No User Output Unless Done)

After finishing the current execution wave's tasks, run this review PRIVATELY.

**CRITICAL: DO NOT emit WNWC closeout, Execution Status block, or any "done" message unless ALL plan tasks for the current wave (including newly discovered ones) are fully completed. Interruptions are FORBIDDEN.**

---

### Decision Gate (Run FIRST)

1. Count total tasks in the current wave (plan.md → current stage)
2. Count completed tasks (with real evidence: code written, builds passed, files changed)
3. If completed < total → **SILENTLY continue working on remaining tasks. Do NOT output anything to the user.**
4. If completed == total AND no new tasks surfaced → proceed to review
5. If completed == total BUT new tasks surfaced during execution → add them to plan, go back to step 1

---

### Dynamic Plan Evolution (Internal)

After completing wave tasks:
1. **New discoveries?** Append \`- [ ] N.x 描述\` to plan.md
2. **Stale tasks?** Change \`[ ]\` to \`[~]\` (never delete)
3. **Rescoping?** Add sub-items or update descriptions
4. Update boulder.json task count

---

### Final Closeout (ONLY When ALL Tasks Done)

ONLY when there are genuinely no more tasks to work on — including newly surfaced ones — emit:

\`\`\`
🌊 动态计划演化
| 类型 | 任务 | 来源 |
|------|------|------|
| 新增/跳过/拆分 | 描述 | 发现原因 |

🔍 任务执行审查
| 检查项 | 结果 |
|--------|------|
| 任务覆盖 | ✅ X/Y 完成 |
| 质量验证 | ✅ / ⚠️ |
| 权责划分 | 清晰 / 模糊 |
| 证据 | 充分 / 不足 |

判定: ✅ 本轮完成 —— ALL tasks verified complete.
\`\`\`

Then emit Execution Status block.

**If you are considering emitting a closeout but there are still unchecked tasks in the plan → STOP. Continue working. Do NOT output anything.**
</executor_completion_review_gate>
`
