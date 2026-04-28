# Session Handoff — 2026-04-28

## Context State

- **Session agent**: Sisyphus (主代理)
- **Active stage**: build / wave 001 / heavy + continuous
- **Context pressure**: L3 (55.8% of 1.0M) — recommends restart
- **Working repo**: `D:\-Users-\Documents\GitHub\chat-model\openagent-labforge`

---

## All Fixes Deployed (v3.15.2, installed but needs restart)

### Subagent Prompt Fixes
| File | Change |
|------|--------|
| `src/agents/explore.ts` | Added SCOPE DISCIPLINE table + Mode A/B classification + NEVER-ask directive |
| `src/agents/librarian.ts` | Changed identity from "THE LIBRARIAN" to "RESEARCH EXECUTOR"; removed welcome/asking paragraphs |
| `src/agents/oracle.ts` | Changed from "strategic technical advisor / consultant" to "read-only engineering analysis agent" |

### Model Selection Fix
| File | Change |
|------|--------|
| `src/shared/init-model-preferences.ts` | Removed `preferred_model` from ALL 23 agents and 8 categories — user manual selection now wins |

### Context Isolation Fixes
| File | Change |
|------|--------|
| `src/shared/question-denied-session-permission.ts` | NEW — subagent sessions deny question tool |
| `src/tools/delegate-task/sync-session-creator.ts` | parentID removed from session.create() |
| `src/features/background-agent/spawner.ts` | parentID removed from session.create(); question-denied as default |
| `src/plugin/chat-message.ts` | isSubagentSession guard for soul-rules + stage-managed context |
| `src/hooks/context-window-monitor.ts` | subagentSessions.has(sessionID) guard — skip compression directives |

### Execution Fixes
| File | Change |
|------|--------|
| `src/tools/delegate-task/sync-session-poller.ts` | Atomics.waitAsync + 300-turn fuse + abortSyncSession + PENDING_TOOL_PART_TYPES |
| `src/tools/delegate-task/sync-result-fetcher.ts` | Removed console.log leaks |
| `src/agents/executor-review-gate.ts` | Silence-continue when todos remain; only closeout when ALL done |

### Agent Registry Fix
| File | Change |
|------|--------|
| `src/tools/call-omo-agent/constants.ts` | ALLOWED_AGENTS trimmed: removed metis/momus/acceptance-reviewer/github-scout/multimodal-looker/hephaestus |

---

## Known Issues (Unresolved)

1. **Subagent context inflates main session** — 300K→500K. Likely cause: subagent output injection via background task completion. Need to check if full conversation is injected or just final answer.

2. **background_output returns "Task not found"** — multiple times (bg_4106b23e, bg_acd11b20, bg_c19241fa). Root cause unknown.

3. **Context window stats hardcoded to 1M** — `inferContextLimit` doesn't read OpenCode's actual `token_budget`. Shows wrong percentages for models with 200K/400K/173K limits.

4. **Duplicate workspace (openagent-labforge-refactor)** — appears with both our plugin and upstream. Likely OpenCode worktree interaction, not plugin-specific.

5. **Some agents show 0ms (never execute)** — metis/momus/github-scout etc. removed from ALLOWED_AGENTS; remaining unregistered agents need same cleanup.

6. **Model switching + agent switching interaction** — preference model removed, but needs live verification with restart.

---

## Verification Checklist (After Restart)

### Subagent Tests (Use Flash model first)
1. `task(subagent_type="explore")` — read explore.ts, count lines → should return number only
2. `task(subagent_type="librarian")` — same test → should execute, not ask "what would you like"
3. `task(subagent_type="oracle")` — same test → should execute, not consult

### Model Switching Test
4. Select GPT model → switch agent to different agent → model should stay GPT (not change)

### WASE Autopilot Test  
5. Give wase multi-todo task → should complete ALL todos without stopping to ask

---

## Files Modified This Session

```
src/agents/explore.ts
src/agents/librarian.ts
src/agents/oracle.ts
src/agents/executor-review-gate.ts
src/hooks/context-window-monitor.ts
src/plugin/chat-message.ts
src/shared/init-model-preferences.ts
src/shared/question-denied-session-permission.ts (NEW)
src/shared/session-prompt-params-state.ts (NEW)
src/shared/session-prompt-params-helpers.ts (NEW)
src/shared/model-resolution-types.ts
src/shared/index.ts
src/tools/call-omo-agent/constants.ts
src/tools/call-omo-agent/sync-executor.ts
src/tools/call-omo-agent/tools.ts
src/tools/call-omo-agent/background-executor.ts
src/tools/delegate-task/sync-session-creator.ts
src/tools/delegate-task/sync-session-poller.ts
src/tools/delegate-task/sync-result-fetcher.ts
src/features/background-agent/spawner.ts
src/features/background-agent/types.ts
src/plugin/tool-registry.ts
```

---

## Restart Prompt

Copy this into a new OpenCode window after restart:

```
我在 openagent-labforge 仓库。会话交接——请先检查上文 HANDOFF 文件了解上下文。

1. 我已经重启，当前模型可能是 Flash（之后可能换 Pro）
2. 请先快速过一遍 HANDOFF.md 里的待验证清单
3. 跑子代理测试：explore/librarian/oracle 各一次
4. 测试模型切换：选模型 → 切 agent → 确认模型不变
5. 如果子代理跑偏，优先检查：子代理上下文是否被主会话污染（看日志里的 LLM 调用内容）

仓库：D:\-Users-\Documents\GitHub\chat-model\openagent-labforge
```
