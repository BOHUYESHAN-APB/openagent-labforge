import { type ToolDefinition, tool } from '@opencode-ai/plugin';

export function createPlanEnterTool(): ToolDefinition {
  return tool({
    description: `Enter plan mode — switch the active agent to prometheus (planner) for strategic planning.

Use this when: the current task is complex enough to need a structured plan before execution.

Effects:
- The active agent switches to prometheus (planner), who works through a 5-phase planning workflow
- prometheus has read-only access (read/glob/grep/webfetch/Question/save_plan)
- prometheus CANNOT edit files, run commands, or call sub-agents
- Call plan_exit to return to the original agent with the completed plan

Usage: call this tool with no arguments. The current session's active agent is automatically saved for return.`,
    args: {},
    async execute() {
      return [
        'Plan mode entry triggered.',
        'The overlay will activate on the next turn. Your agent should now switch to prometheus (planner).',
        'Use plan_exit when planning is complete to return to the original agent.',
      ].join('\n');
    },
  });
}
