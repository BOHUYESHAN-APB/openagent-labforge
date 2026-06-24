import { type ToolDefinition, tool } from '@opencode-ai/plugin';

export function createPlanExitTool(): ToolDefinition {
  return tool({
    description: `Exit plan mode — return to the agent that was active before plan_enter.

Use this when: planning is complete and the plan has been saved via save_plan.

Effects:
- Clears the plan overlay, restoring the original agent (engineer/bio/chem/deep-worker)
- The original agent receives the saved plan and begins execution
- prometheus (planner) MUST call this before stopping — otherwise the session stays in read-only plan mode

Usage: call this tool with no arguments. The return agent is automatically resolved from the saved overlay state.`,
    args: {},
    async execute() {
      return [
        'Plan mode exit triggered.',
        'Overlay will clear on the next turn. Returning to the original agent.',
      ].join('\n');
    },
  });
}
