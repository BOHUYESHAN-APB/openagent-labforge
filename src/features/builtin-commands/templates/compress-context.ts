export const COMPRESS_CONTEXT_TEMPLATE = `You are handling a manual context compression command.

Use /ol-compress-context when the user explicitly wants to inspect or trigger the Labforge compression stack for the CURRENT session.

Arguments:
- \`/ol-compress-context status\`
- \`/ol-compress-context auto\`
- \`/ol-compress-context l1\`
- \`/ol-compress-context l2\`
- \`/ol-compress-context l3\`

Compression levels:
- \`l1\`: native OpenCode-style compaction request plus a short visible summary
- \`l2\`: local runtime memory reinforcement for the current session
- \`l3\`: heavy cross-session checkpoint preparation (does NOT automatically switch sessions)

Command semantics:
- \`/ol-compress-context\` is operational context management for the current session
- \`/ol-checkpoint\` is an explicit durable handoff artifact for later recovery or cross-session continuation
- do NOT treat these as the same command
- do NOT regenerate a user-facing long checkpoint unless the user asked for \`/ol-checkpoint\`

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
- do NOT tell the user to use /ol-checkpoint unless the outcome actually justifies a durable handoff`
