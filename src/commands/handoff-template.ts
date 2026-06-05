export const HANDOFF_TEMPLATE = `## HANDOFF COMMAND

Create a detailed context summary for continuing work in a new session.

### PHASE 1: GATHER PROGRAMMATIC CONTEXT
Execute these tools:
1. \`todoread()\` - Current todo list
2. \`Bash({ command: "git diff --stat HEAD~10..HEAD" })\` - Recent changes
3. \`Bash({ command: "git status --porcelain" })\` - Working tree status
4. \`Bash({ command: "git log --oneline -10" })\` - Recent commits

### PHASE 2: EXTRACT CONTEXT (First Person)
Analyze the conversation and gather:
- What was done (concrete accomplishments)
- What remains (pending tasks)
- Key decisions (technical choices made)
- Important files (max 10)
- Relevant skills for continuation

### PHASE 3: FORMAT OUTPUT
Output the HANDOFF CONTEXT in this exact format:

\`\`\`
HANDOFF CONTEXT
===============

USER REQUESTS (AS-IS)
---------------------
[Exact verbatim user requests - NOT paraphrased]

GOAL
----
[One sentence summary]

WORK COMPLETED
--------------
[First person bullets of concrete work done]

CURRENT STATE
-------------
[Current state of code/research/documents]

PENDING TASKS
-------------
[From todoread(), still-open tasks]

KEY FILES
---------
[Max 10 files with descriptions, workspace-relative paths]

IMPORTANT DECISIONS
-------------------
[Technical decisions and rationale]

EXPLICIT CONSTRAINTS
--------------------
[Verbatim constraints only, not inferred]

SUGGESTED SKILLS
----------------
[Based on the work type, suggest 2-3 skills to load in the new session]
- \`skill("skill-name")\` — [why this skill is relevant]

ARTIFACTS
---------
[Reference any checkpoints, memory capsules, or plans created]
- Checkpoint: [path if exists]
- Plan: [path if exists]
- Memory capsules: [list if any]

CONTEXT FOR CONTINUATION
------------------------
[What next session needs to know]
\`\`\`

### PHASE 4: PROVIDE INSTRUCTIONS
Tell the user:

\`\`\`
TO CONTINUE IN A NEW SESSION:

1. Press 'n' in OpenCode TUI to open a new session
2. Paste the HANDOFF CONTEXT above as your first message
3. Add your request: "Continue from the handoff context above. [Your next task]"
4. Load suggested skills: [list the suggested skills]
\`\`\`

### CONSTRAINTS
- NO automatic session creation
- Self-contained summary (works without old session access)
- Workspace-relative file paths
- NO sensitive information (secrets, keys, credentials)
- USER REQUESTS and EXPLICIT CONSTRAINTS must be verbatim
- Max 10 files in KEY FILES
- Suggest 2-3 relevant skills for the new session
- Reference any artifacts (checkpoints, plans, memory capsules) created during the session`;
