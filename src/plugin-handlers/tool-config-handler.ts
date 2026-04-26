import type { OhMyOpenCodeConfig } from "../config";
import { getAgentDisplayName } from "../shared/agent-display-names";

type AgentWithPermission = { permission?: Record<string, unknown> };

function agentByKey(agentResult: Record<string, unknown>, key: string): AgentWithPermission | undefined {
  return (agentResult[key] ?? agentResult[getAgentDisplayName(key)]) as
    | AgentWithPermission
    | undefined;
}

export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  agentResult: Record<string, unknown>;
}): void {
  const denyTodoTools = params.pluginConfig.experimental?.task_system
    ? { todowrite: "deny", todoread: "deny" }
    : {}

  params.config.tools = {
    ...(params.config.tools as Record<string, unknown>),
    "grep_app_*": false,
    LspHover: false,
    LspCodeActions: false,
    LspCodeActionResolve: false,
    "task_*": false,
    teammate: false,
    ...(params.pluginConfig.experimental?.task_system
      ? { todowrite: false, todoread: false }
      : {}),
  };

  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
  const questionPermission = isCliRunMode ? "deny" : "allow";

  // Read-only subagents - no task delegation
  const oracle = agentByKey(params.agentResult, "oracle");
  if (oracle) {
    oracle.permission = {
      ...oracle.permission,
      task: "deny",
      call_omo_agent: "deny",
      write: "deny",
      edit: "deny",
    };
  }
  const librarian = agentByKey(params.agentResult, "librarian");
  if (librarian) {
    librarian.permission = {
      ...librarian.permission,
      "grep_app_*": "allow",
      task: "deny",
      call_omo_agent: "deny",
      write: "deny",
      edit: "deny",
    };
  }
  const explore = agentByKey(params.agentResult, "explore");
  if (explore) {
    explore.permission = {
      ...explore.permission,
      task: "deny",
      call_omo_agent: "deny",
      write: "deny",
      edit: "deny",
    };
  }
  const githubScout = agentByKey(params.agentResult, "github-scout");
  if (githubScout) {
    githubScout.permission = {
      ...githubScout.permission,
      "grep_app_*": "allow",
      websearch_web_search_exa: "allow",
    };
  }
  const techScout = agentByKey(params.agentResult, "tech-scout");
  if (techScout) {
    techScout.permission = {
      ...techScout.permission,
      "grep_app_*": "allow",
      websearch_web_search_exa: "allow",
      "context7_resolve-library-id": "allow",
      "context7_query-docs": "allow",
      paper_search_mcp_search_arxiv: "allow",
      paper_search_mcp_search_google_scholar: "allow",
      paper_search_mcp_search_pubmed: "allow",
      paper_search_mcp_search_biorxiv: "allow",
      paper_search_mcp_search_medrxiv: "allow",
    };
  }
  const looker = agentByKey(params.agentResult, "multimodal-looker");
  if (looker) {
    looker.permission = { ...looker.permission, task: "deny", look_at: "deny" };
  }
  const atlas = agentByKey(params.agentResult, "atlas");
  if (atlas) {
    atlas.permission = {
      ...atlas.permission,
      task: "allow",
      call_omo_agent: "deny",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const sisyphus = agentByKey(params.agentResult, "sisyphus");
  if (sisyphus) {
    sisyphus.permission = {
      ...sisyphus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const hephaestus = agentByKey(params.agentResult, "hephaestus");
  if (hephaestus) {
    hephaestus.permission = {
      ...hephaestus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      ...denyTodoTools,
    };
  }
  const prometheus = agentByKey(params.agentResult, "prometheus");
  if (prometheus) {
    prometheus.permission = {
      ...prometheus.permission,
      call_omo_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  // Orchestrator agents - full delegation capabilities
  for (const orchestratorName of [
    "wase",
    "orchestrator",
    "bio-autopilot",
    "bio-orchestrator",
    "engineering-orchestrator",
    "bio-planner",
    "bio-methodologist",
    "bio-pipeline-operator",
  ]) {
    const orchestrator = agentByKey(params.agentResult, orchestratorName);
    if (orchestrator) {
      orchestrator.permission = {
        ...orchestrator.permission,
        call_omo_agent: "deny",
        task: "allow",
        question: questionPermission,
        "task_*": "allow",
        teammate: "allow",
        ...denyTodoTools,
      };
    }
  }
  
  // Executor - direct execution without delegation
  const executor = agentByKey(params.agentResult, "executor");
  if (executor) {
    executor.permission = {
      ...executor.permission,
      call_omo_agent: "deny",
      task: "deny",
      question: questionPermission,
      ...denyTodoTools,
    };
  }
  const junior = agentByKey(params.agentResult, "sisyphus-junior");
  if (junior) {
    junior.permission = {
      ...junior.permission,
      task: "allow",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }

  params.config.permission = {
    webfetch: "allow",
    external_directory: "allow",
    ...(params.config.permission as Record<string, unknown>),
    task: "deny",
  };
}
