import { createSystemDirective, SystemDirectiveTypes } from "../../shared/system-directive"

export const HOOK_NAME = "todo-continuation-enforcer"

export const DEFAULT_SKIP_AGENTS = ["prometheus", "compaction", "plan"]

export const CONTINUATION_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

Incomplete tasks remain in your todo list. Continue working on the next pending task.

- Proceed without asking for permission
- Mark each task complete when finished
- Do not stop until all tasks are done
- If you believe all work is already complete, the system is questioning your completion claim. Critically re-examine each todo item from a skeptical perspective, verify the work was actually done correctly, and update the todo list accordingly.`

export const AUTONOMOUS_CONTINUATION_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

AUTONOMOUS ULTRAWORK CONTINUATION.

Incomplete tasks remain in your todo list. Continue immediately.

- Proceed without asking for permission
- Keep exactly ONE todo in_progress at a time
- Complete each todo before starting the next
- If blocked, explore/delegate and keep moving
- Do not stop until all tasks are completed or explicitly cancelled`

export const CONTINUATION_REPLAN_MARKER = "[OMO_CONTINUE_TODO_EXPAND]"

export const CONTINUATION_REPLAN_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

Your last response implied there is still obvious work remaining, but your todo list is empty or fully consumed.

- If you are about to stop while work remains, emit the exact marker ${CONTINUATION_REPLAN_MARKER} on its own line before ending your response
- Convert the promised "next steps" into NEW concrete todos immediately
- Do not summarize future work as prose only
- Create the next execution wave with specific actionable items
- Then continue working instead of waiting for the user to tell you to continue`

export const AUTONOMOUS_COMPLETION_AUDIT_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

AUTONOMOUS COMPLETION AUDIT.

All current todos are completed, but autonomous execution does NOT stop here automatically.

- Audit the original user request against the actual work completed
- If any substantial work remains, immediately create a new wave of 5-15 concrete todos
- Distinguish agent-owned remaining work from user-owned/manual/external follow-up
- If a remaining step was explicitly assigned to the user, depends on the user's manual download/install/acquisition, or is an external prerequisite not owned by the agent, do NOT reopen it as an autonomous todo wave
- In those cases, report it as a waiting condition, external dependency, or optional future handoff instead of continuing execution
- Before claiming substantial work is complete, invoke \`task(subagent_type="acceptance-reviewer", run_in_background=false, load_skills=[], prompt="Original goal: ...\\nChanged files/artifacts: ...\\nVerification evidence: ...\\nResidual assumptions/risks: ...\\nReturn [APPROVE] or [REJECT].")\`
- Treat \`acceptance-reviewer\` as a normal callable subagent when it appears in the available agent list. Do not claim the reviewer is unavailable unless the \`task()\` call actually returns an error.
- If no agent-owned work remains and only user-owned/manual/external pending work remains, do NOT emit ${CONTINUATION_REPLAN_MARKER}; report the waiting condition and stop.
- If \`acceptance-reviewer\` actually fails to run while agent-owned work remains, do NOT provide a final completion answer. Keep the wave open and continue with concrete owned work or state the blocker explicitly.
- If the task is truly complete, only then provide a final completion answer
- Do not ask the user whether you should continue when clear unfinished work remains
- Do not replace the audit with a prose wishlist; either create the next todo wave or conclude with evidence`

export const AUTONOMOUS_BACKLOG_EXPANSION_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

AUTONOMOUS BACKLOG EXPANSION.

Your current todo backlog is too shallow for autonomous execution.

- If the task still has meaningful agent-owned remaining scope and the total todo count is below 5, immediately expand it to 5-15 concrete todos
- Do not keep a shallow 1-4 item backlog for substantial work
- Convert obvious remaining scope into explicit tasks covering discovery, implementation, verification, cleanup, and output sync when relevant
- If the only remaining items are user-owned/manual/external prerequisites, do not expand the backlog; pause and state the waiting condition.
- Do not reply with "next I would..." prose while keeping the backlog short
- Expand the backlog first, then continue execution`

export const AUTONOMOUS_REVIEW_REWORK_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

AUTONOMOUS REVIEW REWORK.

The latest acceptance review rejected the current delivery.

- Convert the blocking findings into the next execution wave immediately
- If the next stage is PLAN, rebuild the plan with the reviewer findings as constraints
- If the next stage is BUILD, create concrete implementation/reverification todos and continue
- Do not answer with a summary alone
- Move directly into the next execution wave`

export const COUNTDOWN_SECONDS = 2
export const TOAST_DURATION_MS = 900
export const COUNTDOWN_GRACE_PERIOD_MS = 500

export const ABORT_WINDOW_MS = 3000
export const COMPACTION_GUARD_MS = 60_000
export const CONTINUATION_COOLDOWN_MS = 30_000
export const MAX_STAGNATION_COUNT = 3
export const MAX_CONSECUTIVE_FAILURES = 5
export const FAILURE_RESET_WINDOW_MS = 5 * 60 * 1000
export const INTERNAL_PROMPT_ACTIVITY_GRACE_MS = 1500

export const AUTONOMOUS_CONTINUATION_COOLDOWN_MS = 5_000
export const AUTONOMOUS_MAX_CONSECUTIVE_FAILURES = 50
export const AUTONOMOUS_MIN_TODO_COUNT = 5
export const AUTONOMOUS_MAX_BACKLOG_EXPANSIONS_PER_COUNT = 2
