export const CHECKPOINT_RESUME_TEMPLATE = `# Checkpoint Resume Command

## Purpose

Use /checkpoint-resume in a fresh session to continue from a repo-local checkpoint instead of dragging the previous session forward.

Default checkpoint sources:
- .opencode/openagent-labforge/checkpoints/latest.md
- .opencode/openagent-labforge/checkpoints/latest.meta.json

If the user passes an argument, treat it as:
- a checkpoint path
- or a session id whose file lives at .opencode/openagent-labforge/checkpoints/by-session/<session-id>.md

---

# PHASE 0: RESOLVE CHECKPOINT SOURCE

1. If $ARGUMENTS is empty:
   - read .opencode/openagent-labforge/checkpoints/latest.meta.json if it exists
   - read .opencode/openagent-labforge/checkpoints/latest.md

2. If $ARGUMENTS looks like a session id:
   - read .opencode/openagent-labforge/checkpoints/by-session/$ARGUMENTS.md

3. If $ARGUMENTS looks like a path:
   - read that file directly

If no checkpoint file exists, say that clearly and stop.

After resolving the source, if latest.meta.json exists:
- update its status from \`pending\` to \`consumed\`
- set \`consumed_by_session_id\` to \`$SESSION_ID\`
- do this only after you actually loaded the checkpoint successfully

---

# PHASE 1: LOAD MINIMUM CONTINUATION CONTEXT

Read:
- the chosen checkpoint markdown file
- the matching latest.meta.json if available
- repo-local runtime workflow files mentioned by the checkpoint, only if needed

If the checkpoint metadata includes artifact policy fields:
- artifact_mode
- artifact_root
- artifact_strategy
- active_work_item

carry them forward into this session's runtime workflow memory and treat them as the default continuation policy.

Do NOT try to reconstruct the entire old session.
Treat the checkpoint as the primary source of truth for continuation.

---

# PHASE 2: REBUILD EXECUTION STATE

After reading the checkpoint:
- restate the carried-forward mission
- restate the carried-forward goal
- restate the current state
- restate the carried-forward artifact policy if one exists
- rebuild a fresh todo/task list for this session from the checkpoint's pending tasks
- continue with the user's new request in this session

If the checkpoint says work was mid-flight:
- do not ask the user to repeat the old context
- do not re-open the whole old conversation
- do create a fresh execution wave for the remaining work
- do not reread broad package indexes or output trees if artifact_root and active_work_item already identify the active target well enough

---

# PHASE 3: RESPONSE FORMAT

Start with:

\`\`\`
Checkpoint loaded from: <path>
\`\`\`

Then provide:
- CARRIED-FORWARD MISSION
- GOAL CARRIED FORWARD
- CURRENT STATE
- ARTIFACT POLICY
- NEXT EXECUTION WAVE

Keep it concise, actionable, and ready to continue immediately.

---

# IMPORTANT CONSTRAINTS

- Do not claim you loaded a checkpoint unless you actually read the file
- Do not regenerate the checkpoint from memory
- Do not depend on access to the old session
- Do not reopen a huge session if the checkpoint is sufficient
- Do prefer compact artifact-policy recovery over rereading large bundle directories when the checkpoint already captured the active root and work item

---

# EXECUTE NOW

Resolve the checkpoint source, read it, rebuild the next execution wave, and continue.
`
