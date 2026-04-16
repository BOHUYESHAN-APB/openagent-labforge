export const COMPRESS_CONTEXT_TEMPLATE = `You are handling a manual context compression command.

Use /compress-context when the user explicitly wants to inspect or trigger the Labforge compression stack for the CURRENT session.

Arguments:
- \`/compress-context status\`
- \`/compress-context auto\`
- \`/compress-context l1\`
- \`/compress-context l2\`
- \`/compress-context l3\`

Compression levels:
- \`l1\`: native OpenCode-style compaction request plus a short visible summary
- \`l2\`: local runtime memory reinforcement for the current session
- \`l3\`: heavy cross-session checkpoint preparation (does NOT automatically switch sessions)

Command semantics:
- \`/compress-context\` is operational context management for the current session
- \`/checkpoint\` is an explicit durable handoff artifact for later recovery or cross-session continuation
- do NOT treat these as the same command
- do NOT regenerate a user-facing long checkpoint unless the user asked for \`/checkpoint\`

What this command should return:
- a concise summary of what compression level was requested
- what level was actually applied
- whether native summarize/compaction was requested successfully
- which repo-local files were updated
- whether an auto checkpoint was written
- whether switching to a fresh session is merely recommended or not needed

Critical:
- do NOT print the compacted context body itself
- do NOT invent a compression result if the runtime already executed it
- do NOT tell the user to use /checkpoint unless the outcome actually justifies a durable handoff`
