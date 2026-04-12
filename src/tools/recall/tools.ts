import { existsSync, readFileSync } from "node:fs"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import {
  getRuntimeWorkflowPaths,
  readBoulderState,
  readLatestCheckpointMetadata,
  readRuntimeWorkflowState,
} from "../../features/boulder-state"
import { RECALL_TOOL_DESCRIPTION } from "./constants"
import type { RecallArgs, RecallSection } from "./types"

const DEFAULT_SECTIONS: RecallSection[] = [
  "state",
  "session-origin",
  "structured-todos",
  "manual-boundaries",
  "review",
  "artifact-policy",
]

function readTextIfExists(path: string): string | null {
  if (!existsSync(path)) return null
  return readFileSync(path, "utf-8").trim()
}

function formatStateSection(state: NonNullable<ReturnType<typeof readRuntimeWorkflowState>>): string {
  const lines = [
    "## State",
    `- Stage: \`${state.current_stage}\``,
    `- Wave: \`${String(state.current_wave ?? 1).padStart(3, "0")}\``,
    `- Auto mode: \`${state.auto_mode_level ?? "light"}\``,
    `- Interaction mode: \`${state.interaction_mode ?? "batch"}\``,
    ...(state.active_agent ? [`- Active agent: \`${state.active_agent}\``] : []),
    ...(state.last_rehydration_reason ? [`- Last rehydration reason: ${state.last_rehydration_reason}`] : []),
    ...(state.last_checkpoint_kind ? [`- Last checkpoint kind: \`${state.last_checkpoint_kind}\``] : []),
    ...(state.todo_graph_generation !== undefined ? [`- Todo graph generation: \`${state.todo_graph_generation}\``] : []),
  ]

  return lines.join("\n")
}

function formatStructuredTodosSection(state: NonNullable<ReturnType<typeof readRuntimeWorkflowState>>): string | null {
  if (!state.structured_todos || state.structured_todos.length === 0) return null
  return [
    "## Structured Todos",
    ...state.structured_todos.map(
      (todo) =>
        `- [${todo.status}] (${todo.kind}/${todo.owner}/${todo.source}) ${todo.content}`,
    ),
  ].join("\n")
}

function formatManualBoundariesSection(state: NonNullable<ReturnType<typeof readRuntimeWorkflowState>>): string | null {
  if (!state.manual_boundaries || state.manual_boundaries.length === 0) return null
  return [
    "## Manual Boundaries",
    ...state.manual_boundaries.map((boundary) => `- ${boundary}`),
  ].join("\n")
}

function formatReviewSection(state: NonNullable<ReturnType<typeof readRuntimeWorkflowState>>): string | null {
  const lines = [
    ...(state.last_review_verdict ? [`- Last review verdict: \`${state.last_review_verdict}\``] : []),
    ...(state.blocking_findings && state.blocking_findings.length > 0
      ? ["- Blocking findings:", ...state.blocking_findings.map((item) => `  - ${item}`)]
      : []),
    ...(state.last_review_signature ? [`- Last review signature: \`${state.last_review_signature}\``] : []),
    ...(state.last_review_handled_signature
      ? [`- Last handled review signature: \`${state.last_review_handled_signature}\``]
      : []),
  ]
  if (lines.length === 0) return null
  return ["## Review", ...lines].join("\n")
}

function formatArtifactPolicySection(state: NonNullable<ReturnType<typeof readRuntimeWorkflowState>>): string | null {
  const lines = [
    ...(state.artifact_mode ? [`- Artifact mode: \`${state.artifact_mode}\``] : []),
    ...(state.artifact_root ? [`- Artifact root: \`${state.artifact_root}\``] : []),
    ...(state.artifact_strategy ? [`- Artifact strategy: \`${state.artifact_strategy}\``] : []),
    ...(state.active_work_item ? [`- Active work item: ${state.active_work_item}`] : []),
    ...(state.artifact_rationale ? [`- Rationale: ${state.artifact_rationale}`] : []),
  ]
  if (lines.length === 0) return null
  return ["## Artifact Policy", ...lines].join("\n")
}

function formatSessionOriginSection(args: {
  directory: string
  targetSessionID: string
}): string | null {
  const { directory, targetSessionID } = args
  const lines: string[] = []
  const boulderState = readBoulderState(directory)
  const latestCheckpoint = readLatestCheckpointMetadata(directory)

  const sessionOrigin = boulderState?.session_origins?.[targetSessionID]
  if (sessionOrigin) {
    lines.push(`- Active-plan session origin: \`${sessionOrigin}\``)
  }

  if (boulderState?.session_ids?.includes(targetSessionID)) {
    lines.push(`- Active-plan session count: \`${boulderState.session_ids.length}\``)
  }

  if (latestCheckpoint?.consumed_by_session_id === targetSessionID) {
    lines.push("- Latest checkpoint metadata was consumed by this session.")
    if (latestCheckpoint.source_session_id) {
      lines.push(`- Checkpoint source session: \`${latestCheckpoint.source_session_id}\``)
    }
    if (latestCheckpoint.checkpoint_kind) {
      lines.push(`- Checkpoint kind: \`${latestCheckpoint.checkpoint_kind}\``)
    }
    if (latestCheckpoint.checkpoint_scope) {
      lines.push(`- Checkpoint scope: \`${latestCheckpoint.checkpoint_scope}\``)
    }
    if (latestCheckpoint.source_stage) {
      lines.push(`- Source stage: \`${latestCheckpoint.source_stage}\``)
    }
  }

  if (lines.length === 0) return null
  return ["## Session Origin", ...lines].join("\n")
}

export async function executeRecallOperation(args: {
  directory: string
  sessionID: string
  sessionIdOverride?: string
  sections?: RecallSection[]
}): Promise<string> {
  const targetSessionID = args.sessionIdOverride ?? args.sessionID
  const state = readRuntimeWorkflowState(args.directory, targetSessionID)
  if (!state) {
    return `No runtime workflow memory found for session \`${targetSessionID}\`.`
  }

  const paths = getRuntimeWorkflowPaths(args.directory, targetSessionID)
  const sections = args.sections && args.sections.length > 0 ? args.sections : DEFAULT_SECTIONS
  const output: string[] = [`# Recall`, `- Session: \`${targetSessionID}\``]

  for (const section of sections) {
    if (section === "state") {
      output.push("", formatStateSection(state))
      continue
    }
    if (section === "session-origin") {
      const formatted = formatSessionOriginSection({
        directory: args.directory,
        targetSessionID,
      })
      if (formatted) output.push("", formatted)
      continue
    }
    if (section === "structured-todos") {
      const formatted = formatStructuredTodosSection(state)
      if (formatted) output.push("", formatted)
      continue
    }
    if (section === "manual-boundaries") {
      const formatted = formatManualBoundariesSection(state)
      if (formatted) output.push("", formatted)
      continue
    }
    if (section === "review") {
      const formatted = formatReviewSection(state)
      if (formatted) output.push("", formatted)
      continue
    }
    if (section === "artifact-policy") {
      const formatted = formatArtifactPolicySection(state)
      if (formatted) output.push("", formatted)
      continue
    }
    if (section === "mission") {
      const text = readTextIfExists(paths.missionFile)
      if (text) output.push("", "## Mission", text)
      continue
    }
    if (section === "roadmap") {
      const text = readTextIfExists(paths.roadmapFile)
      if (text) output.push("", "## Roadmap", text)
      continue
    }
    if (section === "stage-anchor") {
      const text = readTextIfExists(paths.stageAnchorFile)
      if (text) output.push("", "## Stage Anchor File", text)
      continue
    }
    if (section === "stage-capsule") {
      const text = readTextIfExists(paths.stageCapsuleFile)
      if (text) output.push("", "## Stage Capsule File", text)
      continue
    }
    if (section === "stage-file") {
      const stageFile =
        state.current_stage === "plan"
          ? paths.planFile
          : state.current_stage === "review"
            ? paths.reviewFile
            : paths.buildFile
      const text = readTextIfExists(stageFile)
      if (text) output.push("", `## Stage File (${state.current_stage})`, text)
    }
  }

  return output.join("\n")
}

export function createRecallTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description: RECALL_TOOL_DESCRIPTION,
    args: {
      session_id: tool.schema.string().optional().describe("Optional session ID to inspect. Defaults to the current session."),
      sections: tool.schema
        .array(
          tool.schema.enum([
            "state",
            "session-origin",
            "mission",
            "roadmap",
            "stage-anchor",
            "stage-capsule",
            "stage-file",
            "structured-todos",
            "manual-boundaries",
            "review",
            "artifact-policy",
          ]),
        )
        .optional()
        .describe("Sections to recall. Defaults to state, session-origin, structured-todos, manual-boundaries, review, artifact-policy."),
    },
    execute: async (args: RecallArgs, context) => {
      const runtimeCtx = context as Record<string, unknown>
      const directory = typeof runtimeCtx.directory === "string" ? runtimeCtx.directory : ctx.directory
      const sessionID = typeof runtimeCtx.sessionID === "string" ? runtimeCtx.sessionID : ""

      return executeRecallOperation({
        directory,
        sessionID,
        sessionIdOverride: args.session_id,
        sections: args.sections,
      })
    },
  })
}
