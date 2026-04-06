export const TODO_CLEAR_TEMPLATE = `Clear the current session's todo list and remove stale execution tracking.

Use this when:
- old todos keep interfering with normal conversation
- the current session has stale execution residue
- you want a clean session-level slate without wiping the whole project context

Expected effect:
1. clear the current session todo list
2. cancel countdown-based continuation for this session
3. clear continuation markers for this session
4. clear stale autonomous/session workflow state bound to this session

After this command, treat the current session as a normal conversation unless the user explicitly asks to resume execution.`
