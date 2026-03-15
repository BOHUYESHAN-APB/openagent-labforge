import { createSystemDirective, SystemDirectiveTypes } from "../../shared/system-directive"

export const HOOK_NAME = "todo-continuation-enforcer"

export const DEFAULT_SKIP_AGENTS = ["prometheus", "compaction"]

// Treat background tasks as "active" only if they had recent progress.
// This prevents main-session continuation from deadlocking forever on stuck/stale child sessions.
export const BACKGROUND_TASK_ACTIVE_WINDOW_MS = 90_000

// Cooldown for tool-intent recovery injections (assistant promised a tool call but didn't do it).
export const TOOL_INTENT_RECOVERY_COOLDOWN_MS = 15_000

export const CONTINUATION_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TODO_CONTINUATION)}

Incomplete tasks remain in your todo list. Continue with the next pending task now.

- Continue immediately; do not ask for permission to proceed
- Use tools when needed, then keep going
- Keep responses concise and task-focused
- If user input is required, ask one clear question; otherwise do not pause
- Mark each task complete when finished`

export const TOOL_INTENT_RECOVERY_PROMPT = `${createSystemDirective(SystemDirectiveTypes.TOOL_INTENT_RECOVERY)}

You said you were about to use a tool (e.g. Read) but no tool call happened and the session went idle.

Fix this immediately:
- Call the correct tool now (do not ask the user)
- After the tool result arrives, continue the task you already committed to`

export const COUNTDOWN_SECONDS = 1
export const TOAST_DURATION_MS = 900
export const COUNTDOWN_GRACE_PERIOD_MS = 500

export const ABORT_WINDOW_MS = 3000
export const CONTINUATION_COOLDOWN_MS = 20_000
export const MAX_STAGNATION_COUNT = 3
export const MAX_CONSECUTIVE_FAILURES = 5
export const FAILURE_RESET_WINDOW_MS = 5 * 60 * 1000
