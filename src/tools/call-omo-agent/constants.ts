export const ALLOWED_AGENTS = [
  "explore",
  "librarian",
  "oracle",
  "hephaestus",
  "article-writer",
  "scientific-writer",
  "github-scout",
  "tech-scout",
  "metis",
  "momus",
  "multimodal-looker",
] as const

export const CALL_OMO_AGENT_DESCRIPTION = `Compatibility wrapper for specialized agents. run_in_background REQUIRED (true=async with task_id, false=sync).

Available: {agents}

Prefer \`task(subagent_type=...)\` for first-class child-session UI, inspectable task cards, and normal subagent delegation.

Pass \`session_id=<id>\` to continue previous agent with full context. Prompts MUST be in English. Use \`background_output\` for async results.`
