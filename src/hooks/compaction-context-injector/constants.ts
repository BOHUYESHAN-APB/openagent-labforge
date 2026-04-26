export const HOOK_NAME = "compaction-context-injector"

/**
 * Agent recovery prompt injected as a synthetic message part after compaction.
 * 
 * This is intentionally brief and uses synthetic:true to stay hidden from
 * the user's visible context. The actual recovery logic happens via
 * session.promptAsync with noReply:true, which restores the agent/model/tools
 * configuration without generating visible output.
 */
export const AGENT_RECOVERY_PROMPT =
  "[restore checkpointed session agent configuration after compaction]"

export const NO_TEXT_TAIL_THRESHOLD = 5
export const RECOVERY_COOLDOWN_MS = 60_000
export const RECENT_COMPACTION_WINDOW_MS = 10 * 60 * 1000
