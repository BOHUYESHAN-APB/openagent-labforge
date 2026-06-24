import { type ToolDefinition, tool } from '@opencode-ai/plugin';

/**
 * enter_plan_mode tool — activates plan overlay and switches to prometheus.
 *
 * On the next turn, prometheus receives the return value of this tool as
 * a conversation message. The return is designed as a direct instruction
 * that forces prometheus to immediately use the Question tool.
 */
export function createEnterPlanModeTool(): ToolDefinition {
  return tool({
    description: `Enter plan mode — switch the active agent to prometheus (planner) for strategic planning.

Use this when the current task is complex enough to need a structured plan before execution.

Effects:
- The active agent switches to prometheus (planner), who works through a 5-phase planning workflow
- prometheus has read-only access (read/glob/grep/webfetch/Question/save_plan)
- prometheus CANNOT edit files, run commands, or call sub-agents
- Call /ol-plan-exit to return to the original agent with the completed plan

Usage: call this tool with no arguments. The current session's active agent is automatically saved for return.`,
    args: {},
    async execute() {
      return [
        '## Plan Mode Activated — prometheus (planner) is now active',
        '',
        'Your first task is to gather requirements.',
        '',
        '- If the user already typed what they want: use that as requirements',
        '- If unclear: use the Question tool or just reply in chat',
        '- Keep asking until all requirements are clear',
        '- Do NOT skip to research or planning without confirmed requirements',
      ].join('\n');
    },
  });
}
