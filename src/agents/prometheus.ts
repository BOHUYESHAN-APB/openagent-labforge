import { type AgentDefinition, resolvePrompt } from './orchestrator';
import { PROMETHEUS_HEAVY_PROMPT } from './prompts';

/**
 * Prometheus - Strategic Planner
 *
 * Inspired by Omo's Prometheus agent:
 * - Interview mode for requirement gathering
 * - Structured plan generation
 * - Parallel context gathering before planning
 * - Plan review with Metis and Momus
 */
export function createPrometheusAgent(
  model: string | undefined,
  customPrompt?: string,
  customAppendPrompt?: string,
): AgentDefinition {
  return {
    name: 'prometheus',
    displayName: 'planner',
    description:
      'Strategic planner for complex projects. Creates detailed, executable plans with parallel execution waves.',
    config: {
      model,
      temperature: 0.2,
      prompt: resolvePrompt(
        PROMETHEUS_HEAVY_PROMPT,
        customPrompt,
        customAppendPrompt,
      ),
    },
  };
}
