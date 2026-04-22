export const MANUAL_COMPRESS_TEMPLATE = `You are being invoked via the /ol-compress command.

## Your Task

Manually trigger context compression for the current session. This command allows users to proactively compress their context before it reaches automatic thresholds.

## Compression Levels

The user can specify a compression level:

1. **auto** (default): Let the system decide based on current usage
   - If usage < 60%: Apply L1 (micro-prune only)
   - If usage 60-75%: Apply L2 (micro-prune + light checkpoint)
   - If usage > 75%: Apply L3 (micro-prune + heavy checkpoint)

2. **light** or **l1**: Force L1 compression
   - Micro-prune tool outputs (>500 chars)
   - Remove old compression notices
   - No checkpoint created

3. **medium** or **l2**: Force L2 compression
   - All L1 actions
   - Create light checkpoint
   - Inject L2 compression directive

4. **heavy** or **l3**: Force L3 compression
   - All L2 actions
   - Create heavy checkpoint
   - Inject L3 compression directive
   - Recommend session switch

5. **preemptive**: Trigger native session.summarize()
   - Uses OpenCode's built-in compression
   - Generates summary of conversation
   - Removes old messages
   - Most aggressive compression (60-80% reduction)

## Steps

1. **Check current state**:
   - Read .opencode/openagent-labforge/runtime/<session-id>/context-pressure.json
   - Display current token usage and level

2. **Determine compression level**:
   - If user specified a level, use it
   - Otherwise, use "auto" logic based on current usage

3. **Explain what will happen**:
   - Clearly state which compression level will be applied
   - Explain what actions will be taken
   - Show expected compression ratio (based on history if available)

4. **Provide guidance**:
   - For L1/L2/L3: Explain that compression happens automatically on next assistant message
   - For preemptive: Explain limitations and automatic trigger behavior
   - Be transparent about what you can and cannot do

5. **Report current status**:
   - Show current token usage
   - Show compression history summary
   - Recommend appropriate action

## Important Notes

- **You cannot directly trigger compression** - it happens via hooks
- Your role is to:
  1. Analyze current state
  2. Recommend appropriate level
  3. Explain what will happen
  4. Guide the user
- For preemptive compression, explain that it will trigger automatically when threshold is reached
- Be transparent about limitations
- Provide actionable guidance
`
