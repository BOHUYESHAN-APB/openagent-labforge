# Todo Continuation

Auto-continue the orchestrator when it stops with incomplete todos. Opt-in only — nothing resumes automatically unless you enable it.

## Controls

| Tool / Command | Description |
|----------------|-------------|
| `auto_continue` | Toggle auto-continuation. Call with `{ enabled: true }` to activate, `{ enabled: false }` to disable |
| `/ol-auto-continue-on` | Recommended complete command for enabling auto-continuation in current OpenCode UIs |
| `/ol-auto-continue-off` | Recommended complete command for disabling auto-continuation in current OpenCode UIs |
| `/ol-auto-continue` | Legacy-compatible shortcut. Accepts `on`, `off`, or toggles with no argument. Legacy `/auto-continue` is accepted by the hook but not registered as the primary command |

## How It Works

1. When the orchestrator goes idle with incomplete todos, a countdown notification appears
2. After the cooldown (default 3s), a continuation prompt is injected and the orchestrator resumes work
3. Press Esc×2 during the cooldown or after injection to stop it

The countdown notification is intentionally **user-visible**. It is not only an internal/system reminder; it should make unfinished work obvious in the UI before the next automatic step.

When context pressure reaches forced-checkpoint territory (L2+), the hook now emits a separate **user-visible context pressure warning** before the internal checkpoint-first continuation prompt. This warning is meant to surface why the next step is pausing normal work and prioritizing checkpoint/handoff behavior.

## Auto Review

When all todos are complete during an auto-work batch, the orchestrator is forced through a structured auto-review before it is allowed to stop.

That review now starts with its own **user-visible review notification** before the internal review prompt is injected. If the review rejects the work, or concludes that user input / an external blocker is stopping progress, the hook also emits a user-visible review status reminder instead of only relying on internal/system control prompts.

The review stage now uses a dedicated **review overlay**:

- effective execution agent = `reviewer`
- the visible UI agent may stay unchanged
- the review turn gets a reviewer-specific system prompt stack instead of inheriting the ordinary orchestrator prompt
- the reply is marked as `reviewer` for that turn without permanently changing the session's main-agent identity

That review now explicitly requires the agent to:

- re-read the **earliest real user request(s)**
- compare the finished work against the actual request, not just the latest assistant summary
- ignore fake user-shaped system/internal control text when deciding what the user asked for
- run diagnostics/tests/build when applicable before claiming completion
- treat `[REJECT]`, `[NEEDS_USER]`, and `[BLOCKED]` as surfaced runtime outcomes, not just invisible internal states

## Safety Gates

All of these must pass before continuation happens:

- Auto-continue is enabled
- The session is the orchestrator
- Incomplete todos exist
- The last assistant message is not a question
- The consecutive continuation count is under the limit
- The session is not in the post-abort suppress window (5s)
- No pending injection is already in flight

## Configuration

Configure it in `~/.config/opencode/extendai-lab.json` or `~/.config/opencode/extendai-lab.jsonc`:

```jsonc
{
  "todoContinuation": {
    "maxContinuations": 5,      // Max consecutive auto-continuations (1–50)
    "cooldownMs": 3000,         // Delay before each continuation (0–30000)
    "autoEnable": false,        // Auto-enable when session has enough todos
    "autoEnableThreshold": 4    // Number of todos to trigger auto-enable
  }
}
```

> See [Configuration](configuration.md) for the full option reference.
