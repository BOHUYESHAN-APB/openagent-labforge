export const CHECKPOINT_TEMPLATE = `# Checkpoint Command

## Purpose

Use /checkpoint when:
- the current session is getting too long and quality or UI responsiveness is degrading
- you have reached a meaningful milestone and want a clean handoff point
- the task will continue in a fresh session instead of stretching this one further

This command creates a repo-local checkpoint that can be resumed from a new session without depending on the old chat history.

---

# PHASE 0: VALIDATE NEED

Before proceeding, confirm:
- [ ] There is meaningful work or context worth preserving
- [ ] The current session has reached a real milestone, checkpoint, or stable handoff state

If the session is still empty or no meaningful progress exists, say so and stop.

---

# PHASE 1: GATHER PROGRAMMATIC CONTEXT

Gather concrete context before writing the checkpoint:

1. session_read({ session_id: "$SESSION_ID" })
2. todoread()
3. Bash({ command: "git diff --stat HEAD~10..HEAD" })
4. Bash({ command: "git status --porcelain" })
5. Read repo-local runtime memory if present:
   - .opencode/openagent-labforge/runtime/
   - .opencode/openagent-labforge/plans/
   - .opencode/openagent-labforge/notepads/

Analyze:
- original user goal
- what was completed
- what remains unfinished
- what decisions or constraints matter going forward
- what files and artifacts are most important
- whether the session already has a stable artifact policy in runtime workflow memory:
  - artifact_mode
  - artifact_root
  - artifact_strategy
  - active_work_item

---

# PHASE 2: WRITE CHECKPOINT FILES

Create these repo-local files:

1. .opencode/openagent-labforge/checkpoints/latest.md
2. .opencode/openagent-labforge/checkpoints/by-session/$SESSION_ID.md
3. .opencode/openagent-labforge/checkpoints/latest.meta.json

Use workspace-relative paths. Create parent directories if needed.

The metadata JSON MUST include:
- handoff_mission
- source_session_id
- created_at
- goal
- cwd
- key_files
- resume_hint
- status
- consumed_by_session_id
- artifact_mode
- artifact_root
- artifact_strategy
- active_work_item

Use this exact metadata shape:

\`\`\`json
{
  "handoff_mission": "<1-2 sentence durable mission carried across sessions>",
  "source_session_id": "$SESSION_ID",
  "created_at": "$TIMESTAMP",
  "goal": "<one-sentence goal>",
  "cwd": "<current workspace-relative or absolute cwd>",
  "key_files": ["path/one", "path/two"],
  "resume_hint": "Continue from the checkpoint above. <next task>",
  "status": "pending",
  "consumed_by_session_id": null,
  "artifact_mode": "<patch-existing|single-doc-rollup|package-bundle|or empty>",
  "artifact_root": "<current artifact root if one already governs the work>",
  "artifact_strategy": "<update-existing-first|append-supporting-artifacts|spawn-new-top-level-item|or empty>",
  "active_work_item": "<current active item if one should carry across sessions>"
}
\`\`\`

---

# PHASE 3: CHECKPOINT FORMAT

Write the markdown checkpoint using this exact structure:

\`\`\`
CHECKPOINT CONTEXT
==================

SOURCE SESSION
--------------
- Session ID: $SESSION_ID
- Created At: $TIMESTAMP

USER REQUESTS (AS-IS)
---------------------
- [Verbatim user requests only]

GOAL
----
[One short paragraph describing what the next session should accomplish]

CARRIED-FORWARD MISSION
-----------------------
[1-2 sentences describing the longer-running mission that survives this session boundary]

CHECKPOINT REACHED
------------------
- [What milestone was completed]
- [Why this is a good handoff boundary]

WORK COMPLETED
--------------
- [Concrete work already done]
- [Important implementation or analysis outcomes]

CURRENT STATE
-------------
- [Current code / research / document state]
- [Build/test/run status if applicable]
- [Environment or artifact state if relevant]

ARTIFACT STRATEGY
-----------------
- [Current artifact mode if one exists]
- [Current artifact root if one exists]
- [Current active work item if one exists]
- [Whether the next session should update existing outputs first or open a new top-level deliverable]

PENDING TASKS
-------------
- [Still-open tasks]
- [Next logical wave]
- [Blockers, caveats, or unresolved questions]

KEY FILES
---------
- Put the primary business/research/product files first.
- Put checkpoint bookkeeping files last if you include them at all.
- [path] - [why it matters]
- [path] - [why it matters]
(Maximum 12 files)

IMPORTANT DECISIONS
-------------------
- [Decision and rationale]
- [Constraint or preference that must carry forward]

RESUME INSTRUCTIONS
-------------------
- [How the new session should pick this up]
- [Fresh todo/task list the next session should create]
- [Warnings or gotchas]
\`\`\`

Rules:
- plain text only
- no emojis
- no filler
- USER REQUESTS (AS-IS) must stay verbatim
- write for continuation, not for storytelling

---

# PHASE 4: RESPOND TO USER

After writing the files:
- print the path to latest.md
- print the path to by-session/$SESSION_ID.md
- provide a compact resume prompt the user can paste into a new session

The resume prompt must be:

\`\`\`
Continue from checkpoint file .opencode/openagent-labforge/checkpoints/latest.md. [Next task]
\`\`\`

---

# IMPORTANT CONSTRAINTS

- Do NOT attempt to create a new OpenCode session programmatically
- Do write the checkpoint files to disk
- Do keep the checkpoint self-contained
- Do not include secrets or credentials
- Do not exceed 12 files in KEY FILES
- Do preserve artifact policy in compact form when the session is continuing inside an existing package, document workspace, or output bundle

---

# EXECUTE NOW

Gather context, write the checkpoint files, then present the resume prompt.
`
