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

export const COUNTDOWN_SECONDS = 2
export const TOAST_DURATION_MS = 900
export const COUNTDOWN_GRACE_PERIOD_MS = 500

export const ABORT_WINDOW_MS = 3000
export const COMPACTION_GUARD_MS = 60_000
export const CONTINUATION_COOLDOWN_MS = 30_000
export const MAX_STAGNATION_COUNT = 3
export const MAX_CONSECUTIVE_FAILURES = 5
export const FAILURE_RESET_WINDOW_MS = 5 * 60 * 1000

export const AUTONOMOUS_CONTINUATION_COOLDOWN_MS = 5_000
export const AUTONOMOUS_MAX_CONSECUTIVE_FAILURES = 50
