export const CHECKPOINT_TEMPLATE = `# Checkpoint Command

## Purpose

Use /checkpoint when:
- you want a durable stage memory snapshot without trusting the current chat history alone
- you reached a meaningful milestone and want a clean recovery point
- you may continue in this session, a fresh session, or multiple sessions later

This command creates a repo-local checkpoint that can be resumed later without depending on the old chat history.

Checkpoint modes:
- \`light\`: stage handoff / same-session recovery / multi-session reference card
- \`heavy\`: cross-session high-fidelity handoff for long-running continuation

If the user did not specify \`light\` or \`heavy\`, default to \`light\`.

IMPORTANT:
- creating a checkpoint does NOT automatically mean switching sessions
- after the checkpoint is written, recommend whether session switching may help
- if switching sessions would materially change workflow, ASK THE USER
- do not auto-create a new session

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
- whether the repo already has a selected bootstrap / engineering posture:
  - primary bootstrap mode
  - secondary companion modes
  - custom bootstrap instruction if present
- whether runtime workflow memory already exposes stage anchor information:
  - current_stage
  - current_wave
  - stage_anchor_epoch
  - stage_anchor_hash
  - auto_mode_level
  - interaction_mode

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
- bootstrap_primary_key
- bootstrap_primary_label_zh
- bootstrap_primary_label_en
- bootstrap_secondary_keys
- bootstrap_custom_instruction
- checkpoint_kind
- checkpoint_scope
- session_switch_recommendation
- user_confirmation_required
- source_stage
- source_wave
- source_auto_mode_level
- source_interaction_mode
- stage_anchor_epoch
- stage_anchor_hash
- stage_anchor_file
- stage_capsule_file

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
  "active_work_item": "<current active item if one should carry across sessions>",
  "bootstrap_primary_key": "<selected bootstrap primary mode key or empty>",
  "bootstrap_primary_label_zh": "<selected bootstrap primary label zh or empty>",
  "bootstrap_primary_label_en": "<selected bootstrap primary label en or empty>",
  "bootstrap_secondary_keys": ["<optional companion mode key>"],
  "bootstrap_custom_instruction": "<custom bootstrap instruction if user used custom mode>",
  "checkpoint_kind": "<light|heavy>",
  "checkpoint_scope": "<same-session|cross-session|multi-session>",
  "session_switch_recommendation": "<stay|ask-user|recommend-switch>",
  "user_confirmation_required": true,
  "source_stage": "<plan|build|review>",
  "source_wave": 1,
  "source_auto_mode_level": "<light|heavy>",
  "source_interaction_mode": "<batch|continuous>",
  "stage_anchor_epoch": 1,
  "stage_anchor_hash": "<runtime anchor hash or empty>",
  "stage_anchor_file": ".opencode/openagent-labforge/runtime/$SESSION_ID/stage-anchor.md",
  "stage_capsule_file": ".opencode/openagent-labforge/runtime/$SESSION_ID/stage-capsule.md"
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
- Checkpoint Kind: [light|heavy]
- Checkpoint Scope: [same-session|cross-session|multi-session]

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
- [Why this should stay in-session or why it may benefit from a new session]

WORK COMPLETED
--------------
- [Concrete work already done]
- [Important implementation or analysis outcomes]

CURRENT STATE
-------------
- [Current code / research / document state]
- [Build/test/run status if applicable]
- [Environment or artifact state if relevant]
- [Current runtime stage / wave / auto mode / interaction mode]

ARTIFACT STRATEGY
-----------------
- [Current artifact mode if one exists]
- [Current artifact root if one exists]
- [Current active work item if one exists]
- [Whether the next session should update existing outputs first or open a new top-level deliverable]

ENGINEERING POSTURE
-------------------
- [Current bootstrap primary mode if one exists]
- [Current companion modes if any]
- [Current custom bootstrap instruction if any]
- [How this posture constrains the next session]

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

SESSION SWITCH RECOMMENDATION
-----------------------------
- [stay | ask-user | recommend-switch]
- [Why]
- [If the user stays in the same session, how this checkpoint should still be used]
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
- print the checkpoint kind and scope you used
- provide a compact resume prompt
- provide a same-session continuation hint
- if a new session would help, ASK the user which path they want

The resume prompt must be:

\`\`\`
Continue from checkpoint file .opencode/openagent-labforge/checkpoints/latest.md. [Next task]
\`\`\`

The same-session continuation hint must be:

\`\`\`
Continue in the current session, but treat .opencode/openagent-labforge/checkpoints/latest.md as the recovery anchor for the next wave. [Next task]
\`\`\`

---

# IMPORTANT CONSTRAINTS

- Do NOT attempt to create a new OpenCode session programmatically
- Do write the checkpoint files to disk
- Do keep the checkpoint self-contained
- Do not include secrets or credentials
- Do not exceed 12 files in KEY FILES
- Do separate checkpoint creation from session-switch decisions
- Do default to \`light\` unless the user explicitly asked for \`heavy\` or the handoff clearly needs cross-session high-fidelity continuation
- Do ask the user before switching sessions when the recommendation is not \`stay\`
- Do preserve artifact policy in compact form when the session is continuing inside an existing package, document workspace, or output bundle
- Do preserve bootstrap / engineering posture in compact form so the next session does not have to re-ask how the repo should be organized

---

# EXECUTE NOW

Gather context, write the checkpoint files, then present the resume prompt.
`
