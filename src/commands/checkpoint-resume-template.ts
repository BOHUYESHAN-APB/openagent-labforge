export const CHECKPOINT_RESUME_TEMPLATE = `## CHECKPOINT RESUME COMMAND

Load a checkpoint and resume work from it.
Checkpoint is the "reinforcement board" for compaction — it preserves detailed state that compaction might lose.

### PHASE 0: RESOLVE CHECKPOINT SOURCE
Determine which checkpoint to load:

**Priority order:**
1. If session ID argument provided → read that session's checkpoint
2. If no argument → read current session's checkpoint
3. If "latest" argument → read workspace-level latest checkpoint

**File resolution order (per session):**
1. \`.opencode/extendai-lab/checkpoints/by-session/$SESSION_ID.md\` (manual checkpoint — preferred)
2. \`.opencode/extendai-lab/checkpoints/by-session-auto/$SESSION_ID.md\` (auto-compaction checkpoint — fallback)
3. \`.opencode/extendai-lab/checkpoints/latest.md\` (workspace latest — last resort)

**Directory structure:**
\`\`\`
.opencode/extendai-lab/checkpoints/
├── latest.md                    ← 最新的人工 checkpoint
├── latest.meta.json
├── by-session/
│   └── {session-id}.md          ← 该会话最新的人工 checkpoint（优先读取）
├── by-session-auto/
│   └── {session-id}.md          ← 自动压缩 checkpoint（fallback）
└── history/
    └── {session-id}/
        └── {timestamp}-{level}.md
\`\`\`

### PHASE 1: LOAD CHECKPOINT CONTEXT
1. Read the checkpoint markdown file (using priority order above)
2. Read metadata:
   - For manual: \`.opencode/extendai-lab/checkpoints/latest.meta.json\`
   - For auto: \`.opencode/extendai-lab/checkpoints/by-session-auto/$SESSION_ID.meta.json\`
3. Extract: goal, current state, pending tasks, key decisions, resume instructions
4. Check if checkpoint was created before compaction (pre_compaction flag)
5. If checkpoint mentions an active execution plan / boulder-backed plan, treat that as the authoritative execution lane to restore

### PHASE 2: REBUILD EXECUTION STATE
1. Restate the carried-forward mission from checkpoint
2. Restate the goal and current state
3. If checkpoint contains active execution plan details, re-read that saved plan file first and rebuild todos from the current top-level plan checkboxes before trusting any stale todo state
4. Create todo list from pending tasks in checkpoint
5. Acknowledge any new user request
6. If checkpoint was pre-compaction: note that some context may have been compressed

### PHASE 3: UPDATE METADATA
If checkpoint has metadata file, update:
\`\`\`json
{
  "checkpoint_status": "consumed",
  "consumed_by_session_id": "$SESSION_ID",
  "consumed_at": "$TIMESTAMP"
}
\`\`\`

### PHASE 4: RESPOND
1. Confirm checkpoint loaded (show level: light/heavy, source: manual/auto)
2. Show restored goal and current state
3. Show restored todo list
4. If an active execution plan was recovered, say so explicitly and continue from that plan instead of asking for a fresh execution target
5. If pre-compaction checkpoint: warn that context was compressed
6. Ask user for next action or continue with their request

### CONSTRAINTS
- If checkpoint not found, inform user clearly
- Preserve all context from checkpoint
- Create todos from pending tasks immediately
- Do not modify original checkpoint .md files
- You MAY update metadata file to mark checkpoint as consumed`;
