import { resolve } from "node:path"
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { executeRecallOperation } from "../recall"
import { runRgFiles } from "../glob/cli"
import { formatGlobResult } from "../glob/result-formatter"
import { resolveGrepCliWithAutoInstall } from "../glob/constants"
import { runRg, runRgCount } from "../grep/cli"
import { formatCountResult, formatGrepResult } from "../grep/result-formatter"

type BatchCall =
  | {
      tool: "recall"
      parameters: {
        session_id?: string
        sections?: Array<
          | "state"
          | "session-origin"
          | "mission"
          | "roadmap"
          | "stage-anchor"
          | "stage-capsule"
          | "stage-file"
          | "structured-todos"
          | "manual-boundaries"
          | "review"
          | "artifact-policy"
        >
      }
    }
  | {
      tool: "glob"
      parameters: {
        pattern: string
        path?: string
      }
    }
  | {
      tool: "grep"
      parameters: {
        pattern: string
        include?: string
        path?: string
        output_mode?: "content" | "files_with_matches" | "count"
        head_limit?: number
      }
    }

async function executeBatchCall(args: {
  ctx: PluginInput
  sessionID: string
  call: BatchCall
}): Promise<{ tool: string; success: boolean; output: string }> {
  const { ctx, sessionID, call } = args

  try {
    if (call.tool === "recall") {
      return {
        tool: call.tool,
        success: true,
        output: await executeRecallOperation({
          directory: ctx.directory,
          sessionID,
          sessionIdOverride: call.parameters.session_id,
          sections: call.parameters.sections,
        }),
      }
    }

    if (call.tool === "glob") {
      const cli = await resolveGrepCliWithAutoInstall()
      const searchPath = call.parameters.path
        ? resolve(ctx.directory, call.parameters.path)
        : ctx.directory
      const result = await runRgFiles(
        {
          pattern: call.parameters.pattern,
          paths: [searchPath],
        },
        cli,
      )
      return {
        tool: call.tool,
        success: true,
        output: formatGlobResult(result),
      }
    }

    const searchPath = call.parameters.path
      ? resolve(ctx.directory, call.parameters.path)
      : ctx.directory
    const outputMode = call.parameters.output_mode ?? "files_with_matches"

    if (outputMode === "count") {
      const results = await runRgCount({
        pattern: call.parameters.pattern,
        paths: [searchPath],
        globs: call.parameters.include ? [call.parameters.include] : undefined,
      })
      const limited =
        (call.parameters.head_limit ?? 0) > 0
          ? results.slice(0, call.parameters.head_limit)
          : results
      return {
        tool: call.tool,
        success: true,
        output: formatCountResult(limited),
      }
    }

    const result = await runRg({
      pattern: call.parameters.pattern,
      paths: [searchPath],
      globs: call.parameters.include ? [call.parameters.include] : undefined,
      context: 0,
      outputMode,
      headLimit: call.parameters.head_limit ?? 0,
    })

    return {
      tool: call.tool,
      success: true,
      output: formatGrepResult(result),
    }
  } catch (error) {
    return {
      tool: call.tool,
      success: false,
      output: error instanceof Error ? error.message : String(error),
    }
  }
}

export function createBatchTool(ctx: PluginInput): ToolDefinition {
  return tool({
    description:
      "Execute a batch of read-only helper operations in parallel. " +
      "Supports `recall`, `glob`, and `grep`. Use this for fast context gathering without manually issuing multiple separate tool calls.",
    args: {
      tool_calls: tool.schema
        .array(
          tool.schema.object({
            tool: tool.schema.enum(["recall", "glob", "grep"]),
            parameters: tool.schema.object({}).loose(),
          }),
        )
        .min(1)
        .max(12)
        .describe("Read-only tool calls to execute in parallel."),
    },
    execute: async (args, context) => {
      const runtimeCtx = context as Record<string, unknown>
      const sessionID = typeof runtimeCtx.sessionID === "string" ? runtimeCtx.sessionID : ""
      const calls = args.tool_calls as BatchCall[]
      const results = await Promise.all(
        calls.map((call) =>
          executeBatchCall({
            ctx,
            sessionID,
            call,
          }),
        ),
      )

      const successful = results.filter((result) => result.success).length
      const failed = results.length - successful
      const sections = results.map((result, index) =>
        [`## ${index + 1}. ${result.tool} (${result.success ? "ok" : "error"})`, result.output].join("\n\n"),
      )

      return [
        `Batch execution (${successful}/${results.length} successful)`,
        "",
        ...sections.flatMap((section) => [section, "", "---", ""]),
      ].join("\n").replace(/\n---\n\n$/, "\n")
    },
  })
}
