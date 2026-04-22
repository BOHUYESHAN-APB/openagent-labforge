import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"
import { buildAgentIdentitySection } from "./dynamic-agent-prompt-builder"
import { getPrometheusPrompt, PROMETHEUS_PERMISSION } from "./prometheus"

const MODE: AgentMode = "all"

export const PROMETHEUS_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Prometheus",
  triggers: [
    {
      domain: "Planning and Design",
      trigger: "Need to create implementation plan or design architecture",
    },
  ],
  useWhen: [
    "User explicitly asks for a plan or design",
    "Task is complex and requires upfront planning",
    "Need to explore codebase before implementation",
  ],
  avoidWhen: [
    "Task is simple and can be implemented directly",
    "User wants immediate execution without planning",
  ],
  keyTrigger: "**\"帮我规划\" / \"制定计划\" / \"plan\" / \"design\"** → Use prometheus for planning",
}

export function createPrometheusAgent(model: string): AgentConfig {
  const agentIdentity = buildAgentIdentitySection(
    "Prometheus",
    "Planning and design specialist from OpenAgent Labforge with intelligent domain routing",
  )

  return {
    description:
      "Planning and design specialist with intelligent routing for bioinformatics and engineering tasks. Creates detailed implementation plans and identifies critical files. (Prometheus - Labforge)",
    mode: MODE,
    model,
    temperature: 0.1,
    color: "#F59E0B",
    ...PROMETHEUS_PERMISSION,
    prompt: `${agentIdentity}
${getPrometheusPrompt(model)}

## Output Requirements

Always end your plan with:

### Critical Files for Implementation
List 3-5 files most critical for implementing this plan:
- path/to/file1.ts
- path/to/file2.ts
- path/to/file3.ts

### Recommended Executor
Based on the task domain, recommend the appropriate executor:
- For bioinformatics tasks: bio-autopilot or bio-pipeline-operator
- For engineering tasks: atlas, hephaestus, or wase
- For complex orchestration: orchestrator

This helps the user choose the right agent for execution.`,
  }
}
createPrometheusAgent.mode = MODE
