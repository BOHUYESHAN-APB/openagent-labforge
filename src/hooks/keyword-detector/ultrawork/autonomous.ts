/**
 * Autonomous ultrawork add-on.
 *
 * This directive upgrades ultrawork into an execution-first mode where the
 * orchestrator keeps iterating without repeatedly asking for confirmation.
 */

export const AUTONOMOUS_ULTRAWORK_MESSAGE = `[ultrawork-autonomous-mode]
AUTONOMOUS EXECUTION ENABLED.

Execution policy:
- Default to ACTION, not permission-seeking.
- Do NOT ask "Should I proceed?" for normal implementation steps.
- If ambiguity is small, state assumption briefly and continue.
- Keep iterating until requested outcomes are complete.

Only ask user when one of these high-risk conditions applies:
- irreversible/destructive operations (mass delete/reset/history rewrite)
- security-sensitive operations (secrets, credentials, auth tokens)
- external side effects requiring explicit consent (force push, publish, paid API spend)
- conflicts where multiple options have materially different product outcomes

When blocked:
- explore first, delegate specialists, then continue execution.
- ask user only if blocker remains after exploration/delegation.
`

export function getAutonomousUltraworkMessage(): string {
  return AUTONOMOUS_ULTRAWORK_MESSAGE
}
