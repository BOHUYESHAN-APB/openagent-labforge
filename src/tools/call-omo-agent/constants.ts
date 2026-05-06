export const ALLOWED_AGENTS = [
  "explore",
  "librarian",
  "oracle",
  "general",
  "bio-orchestrator",
  "bio-methodologist",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
  "wet-lab-designer",
] as const

export const CALL_OMO_AGENT_DESCRIPTION = `Compatibility wrapper for specialized agents. run_in_background REQUIRED (true=async with task_id, false=sync).

Available: {agents}

Prefer \`task(subagent_type=...)\` for first-class child-session UI, inspectable task cards, and normal subagent delegation.

Pass \`session_id=<id>\` to continue previous agent with full context. Prompts MUST be in English. Use \`background_output\` for async results.`
