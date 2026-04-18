import { beforeEach, describe, test, expect } from "bun:test"
import { loadBuiltinCommands } from "./commands"
import { HANDOFF_TEMPLATE } from "./templates/handoff"
import { COMPRESS_CONTEXT_TEMPLATE } from "./templates/compress-context"
import { CHECKPOINT_TEMPLATE } from "./templates/checkpoint"
import { CHECKPOINT_RESUME_TEMPLATE } from "./templates/checkpoint-resume"
import { REMOVE_AI_SLOPS_TEMPLATE } from "./templates/remove-ai-slops"
import { TODO_CLEAR_TEMPLATE } from "./templates/todo-clear"
import { WORKFLOW_RESET_TEMPLATE } from "./templates/workflow-reset"
import { FOCUS_CHAT_TEMPLATE } from "./templates/focus-chat"
import { _resetForTesting, registerAgentName } from "../claude-code-session-state"
import type { BuiltinCommandName } from "./types"

describe("loadBuiltinCommands", () => {
  beforeEach(() => {
    _resetForTesting()
  })

  test("should include handoff command in loaded commands", () => {
    //#given
    const disabledCommands: BuiltinCommandName[] = []

    //#when
    const commands = loadBuiltinCommands(disabledCommands)

    //#then
    expect(commands["ol-checkpoint"]).toBeDefined()
    expect(commands["ol-checkpoint-resume"]).toBeDefined()
    expect(commands["ol-compress-context"]).toBeDefined()
    expect(commands["ol-handoff"]).toBeDefined()
    expect(commands["ol-handoff"].name).toBe("ol-handoff")
    expect(commands["ol-todo-clear"]).toBeDefined()
    expect(commands["ol-workflow-reset"]).toBeDefined()
    expect(commands["ol-focus-chat"]).toBeDefined()
    expect(commands["ol-settings"]).toBeUndefined()
    expect(commands["ol-settings-image-bus"]).toBeUndefined()
  })

  test("should exclude handoff when disabled", () => {
    //#given
    const disabledCommands: BuiltinCommandName[] = ["ol-handoff"]

    //#when
    const commands = loadBuiltinCommands(disabledCommands)

    //#then
    expect(commands["ol-handoff"]).toBeUndefined()
  })

  test("should include handoff template content in command template", () => {
    //#given - no disabled commands

    //#when
    const commands = loadBuiltinCommands()

    //#then
    expect(commands["ol-handoff"].template).toContain(HANDOFF_TEMPLATE)
  })

  test("should include session context variables in handoff template", () => {
    //#given - no disabled commands

    //#when
    const commands = loadBuiltinCommands()

    //#then
    expect(commands["ol-handoff"].template).toContain("$SESSION_ID")
    expect(commands["ol-handoff"].template).toContain("$TIMESTAMP")
    expect(commands["ol-handoff"].template).toContain("$ARGUMENTS")
  })

  test("should have correct description for handoff", () => {
    //#given - no disabled commands

    //#when
    const commands = loadBuiltinCommands()

    //#then
    expect(commands["ol-handoff"].description).toContain("context summary")
  })

  test("should include checkpoint commands with template content", () => {
    const commands = loadBuiltinCommands()

    expect(commands["ol-compress-context"]).toBeDefined()
    expect(commands["ol-compress-context"].template).toContain(COMPRESS_CONTEXT_TEMPLATE)
    expect(commands["ol-compress-context"].template).toContain("$SESSION_ID")
    expect(commands["ol-compress-context"].template).toContain("$TIMESTAMP")
    expect(commands["ol-compress-context"].template).toContain("$ARGUMENTS")
    expect(commands["ol-checkpoint"]).toBeDefined()
    expect(commands["ol-checkpoint-resume"]).toBeDefined()
    expect(commands["ol-checkpoint"].template).toContain(CHECKPOINT_TEMPLATE)
    expect(commands["ol-checkpoint-resume"].template).toContain(CHECKPOINT_RESUME_TEMPLATE)
    expect(commands["ol-checkpoint"].template).toContain("$SESSION_ID")
    expect(commands["ol-checkpoint"].template).toContain("$TIMESTAMP")
    expect(commands["ol-checkpoint-resume"].template).toContain("$ARGUMENTS")
  })

  test("should include remove-ai-slops command for upstream command compatibility", () => {
    const commands = loadBuiltinCommands()

    expect(commands["ol-remove-ai-slops"]).toBeDefined()
    expect(commands["ol-remove-ai-slops"].template).toContain(REMOVE_AI_SLOPS_TEMPLATE)
    expect(commands["ol-remove-ai-slops"].description).toContain("AI-generated code smells")
  })

  test("should include session cleanup commands", () => {
    const commands = loadBuiltinCommands()

    expect(commands["ol-todo-clear"]).toBeDefined()
    expect(commands["ol-todo-clear"].template).toContain(TODO_CLEAR_TEMPLATE)
    expect(commands["ol-workflow-reset"]).toBeDefined()
    expect(commands["ol-workflow-reset"].template).toContain(WORKFLOW_RESET_TEMPLATE)
    expect(commands["ol-focus-chat"]).toBeDefined()
    expect(commands["ol-focus-chat"].template).toContain(FOCUS_CHAT_TEMPLATE)
    expect(commands["ol-settings"]).toBeUndefined()
    expect(commands["ol-settings-image-bus"]).toBeUndefined()
  })

  test("should route start-work to atlas when registered-agent mode is enabled and atlas exists", () => {
    registerAgentName("atlas")

    const commands = loadBuiltinCommands([], { useRegisteredAgents: true })

    expect(commands["ol-start-work"].agent).toBe("atlas")
  })

  test("should route start-work to sisyphus when registered-agent mode is enabled and atlas is unavailable", () => {
    registerAgentName("sisyphus")

    const commands = loadBuiltinCommands([], { useRegisteredAgents: true })

    expect(commands["ol-start-work"].agent).toBe("sisyphus")
  })
})

describe("HANDOFF_TEMPLATE", () => {
  test("should include session reading instruction", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("session_read")
  })

  test("should include compaction-style sections in output format", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("USER REQUESTS (AS-IS)")
    expect(HANDOFF_TEMPLATE).toContain("EXPLICIT CONSTRAINTS")
  })

  test("should include programmatic context gathering instructions", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("todoread")
    expect(HANDOFF_TEMPLATE).toContain("git diff")
    expect(HANDOFF_TEMPLATE).toContain("git status")
  })

  test("should include context extraction format", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("WORK COMPLETED")
    expect(HANDOFF_TEMPLATE).toContain("CURRENT STATE")
    expect(HANDOFF_TEMPLATE).toContain("PENDING TASKS")
    expect(HANDOFF_TEMPLATE).toContain("KEY FILES")
    expect(HANDOFF_TEMPLATE).toContain("IMPORTANT DECISIONS")
    expect(HANDOFF_TEMPLATE).toContain("CONTEXT FOR CONTINUATION")
    expect(HANDOFF_TEMPLATE).toContain("GOAL")
  })

  test("should enforce first person perspective", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("first person perspective")
  })

  test("should limit key files to 10", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("Maximum 10 files")
  })

  test("should instruct plain text format without markdown", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("Plain text with bullets")
    expect(HANDOFF_TEMPLATE).toContain("No markdown headers")
  })

  test("should include user instructions for new session", () => {
    //#given - the template string

    //#when / #then
    expect(HANDOFF_TEMPLATE).toContain("new session")
    expect(HANDOFF_TEMPLATE).toContain("opencode")
  })

  test("should not contain emojis", () => {
    //#given - the template string

    //#when / #then
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    expect(emojiRegex.test(HANDOFF_TEMPLATE)).toBe(false)
  })
})

describe("checkpoint command templates", () => {
  test("checkpoint template writes repo-local checkpoint files", () => {
    expect(CHECKPOINT_TEMPLATE).toContain(".opencode/openagent-labforge/checkpoints/latest.md")
    expect(CHECKPOINT_TEMPLATE).toContain("latest.meta.json")
    expect(CHECKPOINT_TEMPLATE).toContain("by-session/$SESSION_ID.md")
    expect(CHECKPOINT_TEMPLATE).toContain("CHECKPOINT CONTEXT")
    expect(CHECKPOINT_TEMPLATE).toContain("\"status\": \"pending\"")
    expect(CHECKPOINT_TEMPLATE).toContain("\"consumed_by_session_id\": null")
    expect(CHECKPOINT_TEMPLATE).toContain("\"artifact_mode\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"artifact_root\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"bootstrap_primary_key\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"checkpoint_kind\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"checkpoint_scope\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"session_switch_recommendation\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"stage_anchor_epoch\":")
    expect(CHECKPOINT_TEMPLATE).toContain("\"stage_anchor_hash\":")
    expect(CHECKPOINT_TEMPLATE).toContain("ENGINEERING POSTURE")
    expect(CHECKPOINT_TEMPLATE).toContain("ARTIFACT STRATEGY")
    expect(CHECKPOINT_TEMPLATE).toContain("CARRIED-FORWARD MISSION")
  })

  test("checkpoint template separates checkpoint creation from session switching", () => {
    expect(CHECKPOINT_TEMPLATE).toContain("creating a checkpoint does NOT automatically mean switching sessions")
    expect(CHECKPOINT_TEMPLATE).toContain("same-session continuation hint")
    expect(CHECKPOINT_TEMPLATE).toContain("ASK the user")
    expect(CHECKPOINT_TEMPLATE).toContain("Continue from checkpoint file")
  })

  test("checkpoint resume template loads latest or session-scoped checkpoint", () => {
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("checkpoints/latest.md")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("checkpoints/auto/latest.md")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("checkpoints/auto/by-session/$ARGUMENTS.md")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("by-session/<session-id>.md")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("rebuild a fresh todo/task list")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("status from `pending` to `consumed`")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("consumed_by_session_id")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("artifact_mode")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("bootstrap_primary_key")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("checkpoint_kind")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("stage_anchor_epoch")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("ENGINEERING POSTURE")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("ARTIFACT POLICY")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("do not reread broad package indexes or output trees")
    expect(CHECKPOINT_RESUME_TEMPLATE).toContain("CARRIED-FORWARD MISSION")
  })
})

describe("REMOVE_AI_SLOPS_TEMPLATE", () => {
  test("should preserve upstream-compatible remove-ai-slops guidance", () => {
    expect(REMOVE_AI_SLOPS_TEMPLATE).toContain("ai-slop-remover")
    expect(REMOVE_AI_SLOPS_TEMPLATE).toContain("Critical Review")
    expect(REMOVE_AI_SLOPS_TEMPLATE).toContain("git symbolic-ref refs/remotes/origin/HEAD")
  })
})
