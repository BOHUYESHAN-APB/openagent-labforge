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

---

# PHASE 2: WRITE CHECKPOINT FILES

Create these repo-local files:

1. .opencode/openagent-labforge/checkpoints/latest.md
2. .opencode/openagent-labforge/checkpoints/by-session/$SESSION_ID.md
3. .opencode/openagent-labforge/checkpoints/latest.meta.json

Use workspace-relative paths. Create parent directories if needed.

The metadata JSON MUST include:
- source_session_id
- created_at
- goal
- cwd
- key_files
- resume_hint

Use this exact metadata shape:

\`\`\`json
{
  "source_session_id": "$SESSION_ID",
  "created_at": "$TIMESTAMP",
  "goal": "<one-sentence goal>",
  "cwd": "<current workspace-relative or absolute cwd>",
  "key_files": ["path/one", "path/two"],
  "resume_hint": "Continue from the checkpoint above. <next task>"
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

PENDING TASKS
-------------
- [Still-open tasks]
- [Next logical wave]
- [Blockers, caveats, or unresolved questions]

KEY FILES
---------
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

---

# EXECUTE NOW

Gather context, write the checkpoint files, then present the resume prompt.
`
