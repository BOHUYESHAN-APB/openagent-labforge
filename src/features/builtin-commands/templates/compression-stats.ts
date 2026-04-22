export const COMPRESSION_STATS_TEMPLATE = `You are being invoked via the /ol-compression-stats command.

## Your Task

Read and analyze the compression history from the current session's context-pressure.json file, then present a clear statistical summary to the user.

## Steps

1. **Locate the file**:
   - Path: .opencode/openagent-labforge/runtime/<session-id>/context-pressure.json
   - Use the current session ID from the session context

2. **Read the file**:
   - Parse the JSON content
   - Extract the "history" array (if present)
   - Extract current state fields

3. **Calculate statistics**:
   - Total compression events
   - Breakdown by level (L1/L2/L3)
   - Breakdown by action (micro-prune/checkpoint/preemptive)
   - Average compression ratio per level
   - Total tokens removed
   - Time range (first to last event)

4. **Present the summary**:
   Format the output as a clear, readable report:

   \`\`\`
   Compression Statistics for Session <session-id>
   ================================================

   Current State:
   - Carried Tokens: <tokens> / <limit> (<percentage>%)
   - Current Level: L<level>
   - Last Updated: <timestamp>

   Compression History (<count> events):

   By Level:
   - L1: <count> events, avg compression: <ratio>%
   - L2: <count> events, avg compression: <ratio>%
   - L3: <count> events, avg compression: <ratio>%

   By Action:
   - Micro-prune: <count> events
   - Checkpoint: <count> events
   - Preemptive: <count> events

   Total Tokens Removed: <tokens>
   Time Range: <first> to <last>

   Recent Events (last 5):
   1. [<timestamp>] L<level> <action>: removed <tokens> tokens (<ratio>%)
   2. [<timestamp>] L<level> <action>: removed <tokens> tokens (<ratio>%)
   ...
   \`\`\`

5. **Handle edge cases**:
   - If file doesn't exist: "No compression history found for this session."
   - If history is empty: "No compression events recorded yet."
   - If history field is missing: "History tracking not enabled (old format)."

## Important Notes

- Be concise and clear
- Use formatted output for readability
- Include percentages and ratios for context
- Show recent events for quick insight
- If user provides arguments, interpret them as filters (e.g., "l2" = show only L2 events)
`
