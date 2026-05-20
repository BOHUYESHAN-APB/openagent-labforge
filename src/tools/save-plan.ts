import { type ToolDefinition, tool } from '@opencode-ai/plugin';
import { savePlan } from '../plans';

const z = tool.schema;

export function createSavePlanTool(workspaceRoot: string): ToolDefinition {
  return tool({
    description: `Save a planner-created markdown plan to .opencode/extendai-lab/plans/ and return the real saved path.

CRITICAL: You MUST use this tool to save the plan. Do NOT output the plan content in the conversation. Do NOT ask the user where to save it. The path is fixed: .opencode/extendai-lab/plans/

Use this when the planner/prometheus agent has enough information to create an executable plan. Do not claim a plan was saved unless this tool returns success.`,
    args: {
      name: z
        .string()
        .describe(
          'Descriptive plan name. It will be normalized to a safe markdown filename.',
        ),
      content: z
        .string()
        .describe(
          'Full markdown plan content to save, including top-level structured checkboxes.',
        ),
      overwrite: z
        .boolean()
        .optional()
        .describe('Overwrite an existing plan with the same normalized name.'),
    },
    async execute(args) {
      const result = savePlan({
        workspaceRoot,
        name: String(args.name),
        content: String(args.content),
        overwrite: args.overwrite === true,
      });

      if (!result.ok) {
        return [
          'Plan save failed.',
          `Reason: ${result.message}`,
          'Do not tell the user the plan was saved. Fix the issue or choose a different plan name.',
        ].join('\n');
      }

      return [
        'Plan saved successfully.',
        `Plan saved to: ${result.relativePath}`,
        `Next command: /ol-start-work ${result.name}`,
        `Bytes written: ${result.bytes}`,
        `Overwritten: ${result.overwritten ? 'yes' : 'no'}`,
      ].join('\n');
    },
  });
}
