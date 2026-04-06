export const WORKFLOW_RESET_TEMPLATE = `Reset execution workflow state for the current session/project.

Use this when:
- an old execution workflow is still leaking into the current session
- boulder/runtime workflow state is stale
- continuation mechanisms should be fully reset before starting fresh

Expected effect:
1. stop continuation for the current session
2. cancel active Ralph / ULTRAWORK loop for the current session
3. clear the current session todo list
4. clear the current session runtime workflow memory
5. clear project boulder state if this session is attached to the active work session

After this command, the current session should no longer auto-resume old execution waves.
If the user wants to restart tracked execution later, they should use \`/start-work\` again.`
