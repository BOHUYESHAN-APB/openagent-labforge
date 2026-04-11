import { statSync } from "node:fs"
import type { PluginInput } from "@opencode-ai/plugin"
import {
  appendRuntimeWorkflowNote,
  readBoulderState,
  writeBoulderState,
  appendSessionId,
  findPrometheusPlans,
  getPlanProgress,
  createBoulderState,
  getPlanName,
  clearBoulderState,
  ensureRuntimeWorkflowSession,
} from "../../features/boulder-state"
import { log } from "../../shared/logger"
import {
  getSessionAgent,
  isAgentRegistered,
  resolveRegisteredAgentName,
  updateSessionAgent,
} from "../../features/claude-code-session-state"
import {
  getAgentConfigKey,
  getAgentDisplayName,
} from "../../shared/agent-display-names"
import { START_WORK_TEMPLATE } from "../../features/builtin-commands/templates/start-work"
import { detectWorktreePath } from "./worktree-detector"
import { parseUserRequest } from "./parse-user-request"

export const HOOK_NAME = "start-work" as const

interface StartWorkHookInput {
  sessionID: string
  messageID?: string
}

interface StartWorkHookOutput {
  parts: Array<{ type: string; text?: string }>
}

const START_WORK_MARKER = START_WORK_TEMPLATE.split("\n")[0]?.trim() ?? ""

function isStartWorkCommandPrompt(promptText: string): boolean {
  if (!promptText.includes("<session-context>")) {
    return false
  }

  if (!promptText.includes("<command-instruction>")) {
    return true
  }

  return START_WORK_MARKER.length > 0 && promptText.includes(START_WORK_MARKER)
}

function findPlanByName(plans: string[], requestedName: string): string | null {
  const lowerName = requestedName.toLowerCase()
  const exactMatch = plans.find((p) => getPlanName(p).toLowerCase() === lowerName)
  if (exactMatch) return exactMatch
  const partialMatch = plans.find((p) => getPlanName(p).toLowerCase().includes(lowerName))
  return partialMatch || null
}

function createWorktreeActiveBlock(worktreePath: string): string {
  return `
## Worktree Active

**Worktree**: \`${worktreePath}\`

**CRITICAL — DO NOT FORGET**: You are working inside a git worktree. ALL operations MUST be performed exclusively within this worktree directory.
- Every file read, write, edit, and git operation MUST target paths under: \`${worktreePath}\`
- When delegating tasks to subagents, you MUST include the worktree path in your delegation prompt so they also operate exclusively within the worktree
- NEVER operate on the main repository directory — always use the worktree path above`
}

function createRuntimeWorkflowBlock(args: {
  rootDir: string
  stateFile: string
  missionFile: string
  roadmapFile: string
  planFile: string
  buildFile: string
  reviewFile: string
  autoModeLevel?: string
  interactionMode?: string
  currentWave?: number
}): string {
  const {
    rootDir,
    stateFile,
    missionFile,
    roadmapFile,
    planFile,
    buildFile,
    reviewFile,
    autoModeLevel,
    interactionMode,
    currentWave,
  } = args

  return `
## Runtime Workflow Memory

**Runtime Dir**: \`${rootDir}\`
**State**: \`${stateFile}\`
**Mission**: \`${missionFile}\`
**Roadmap**: \`${roadmapFile}\`
**Auto Mode**: \`${autoModeLevel ?? "light"}\`
**Interaction Mode**: \`${interactionMode ?? "batch"}\`
**Current Wave**: \`${String(currentWave ?? 1).padStart(3, "0")}\`
**Stage Files**:
- plan: \`${planFile}\`
- build: \`${buildFile}\`
- review: \`${reviewFile}\`
**Current Wave Files**:
- wave plan: \`${rootDir}/wave-${String(currentWave ?? 1).padStart(3, "0")}-plan.md\`
- wave build: \`${rootDir}/wave-${String(currentWave ?? 1).padStart(3, "0")}-build.md\`
- wave review: \`${rootDir}/wave-${String(currentWave ?? 1).padStart(3, "0")}-review.md\`

Use these files as the current repository's temporary execution memory.
- Read and update only the stage files relevant to the current phase
- Keep long-horizon intent in mission/roadmap, and wave-local execution detail in the stage files
- Do not duplicate the whole conversation into them
- Treat them as compaction-safe runtime memory
- They are repo-local temporary files and should not be committed`
}

function resolveWorktreeContext(
  explicitWorktreePath: string | null,
): { worktreePath: string | undefined; block: string } {
  if (explicitWorktreePath === null) {
    return { worktreePath: undefined, block: "" }
  }

  const validatedPath = detectWorktreePath(explicitWorktreePath)
  if (validatedPath) {
    return { worktreePath: validatedPath, block: createWorktreeActiveBlock(validatedPath) }
  }

  return {
    worktreePath: undefined,
    block: `\n**Worktree** (needs setup): \`git worktree add ${explicitWorktreePath} <branch>\`, then add \`"worktree_path"\` to boulder.json`,
  }
}

export function createStartWorkHook(ctx: PluginInput) {
  return {
    "chat.message": async (input: StartWorkHookInput, output: StartWorkHookOutput): Promise<void> => {
      const parts = output.parts
      const promptText =
        parts
          ?.filter((p) => p.type === "text" && p.text)
          .map((p) => p.text)
          .join("\n")
          .trim() || ""

      if (!isStartWorkCommandPrompt(promptText)) return

      log(`[${HOOK_NAME}] Processing start-work command`, { sessionID: input.sessionID })
      const currentSessionAgent = getSessionAgent(input.sessionID)
      const currentSessionAgentKey = currentSessionAgent
        ? getAgentConfigKey(currentSessionAgent)
        : undefined
      const activeAgent = currentSessionAgent
        && currentSessionAgentKey
        && currentSessionAgentKey !== "prometheus"
        && currentSessionAgentKey !== "atlas"
          ? currentSessionAgent
          : isAgentRegistered("atlas")
            ? "atlas"
            : "sisyphus"
      const activeAgentDisplayName = getAgentDisplayName(activeAgent)
      const resolvedActiveAgentName = resolveRegisteredAgentName(activeAgent) ?? activeAgentDisplayName
      updateSessionAgent(input.sessionID, activeAgent)
      const outputMessage = output as StartWorkHookOutput & { message?: Record<string, unknown> }
      if (outputMessage.message) {
        outputMessage.message.agent = resolvedActiveAgentName
      }

      const existingState = readBoulderState(ctx.directory)
      const sessionId = input.sessionID
      const timestamp = new Date().toISOString()

      const { planName: explicitPlanName, explicitWorktreePath } = parseUserRequest(promptText)
      const { worktreePath, block: worktreeBlock } = resolveWorktreeContext(explicitWorktreePath)

      let contextInfo = ""
      let runtimeWorkflowBlock = ""

      if (explicitPlanName) {
        log(`[${HOOK_NAME}] Explicit plan name requested: ${explicitPlanName}`, { sessionID: input.sessionID })

        const allPlans = findPrometheusPlans(ctx.directory)
        const matchedPlan = findPlanByName(allPlans, explicitPlanName)

        if (matchedPlan) {
          const progress = getPlanProgress(matchedPlan)

          if (progress.isComplete) {
            contextInfo = `
## Plan Already Complete

The requested plan "${getPlanName(matchedPlan)}" has been completed.
All ${progress.total} tasks are done. Create a new plan with: /plan "your task"`
          } else {
            if (existingState) clearBoulderState(ctx.directory)
            const newState = createBoulderState(matchedPlan, sessionId, activeAgent, worktreePath)
            writeBoulderState(ctx.directory, newState)
            const runtimeWorkflow = ensureRuntimeWorkflowSession({
              directory: ctx.directory,
              sessionId,
              activePlan: matchedPlan,
              activeAgent,
              worktreePath,
              currentStage: "plan",
            })
            appendRuntimeWorkflowNote({
              directory: ctx.directory,
              sessionId,
              stage: "plan",
              content: "Execution session started from /start-work. Read the active plan and prepare the first implementation wave.",
            })
            runtimeWorkflowBlock = createRuntimeWorkflowBlock({
              ...runtimeWorkflow.paths,
              autoModeLevel: runtimeWorkflow.state.auto_mode_level,
              interactionMode: runtimeWorkflow.state.interaction_mode,
              currentWave: runtimeWorkflow.state.current_wave,
            })

            contextInfo = `
## Auto-Selected Plan

**Plan**: ${getPlanName(matchedPlan)}
**Path**: ${matchedPlan}
**Progress**: ${progress.completed}/${progress.total} tasks
**Session ID**: ${sessionId}
**Started**: ${timestamp}
${worktreeBlock}
${runtimeWorkflowBlock}

boulder.json has been created. Read the plan and begin execution.`
          }
        } else {
          const incompletePlans = allPlans.filter((p) => !getPlanProgress(p).isComplete)
          if (incompletePlans.length > 0) {
            const planList = incompletePlans
              .map((p, i) => {
                const prog = getPlanProgress(p)
                return `${i + 1}. [${getPlanName(p)}] - Progress: ${prog.completed}/${prog.total}`
              })
              .join("\n")

            contextInfo = `
## Plan Not Found

Could not find a plan matching "${explicitPlanName}".

Available incomplete plans:
${planList}

Ask the user which plan to work on.`
          } else {
            contextInfo = `
## Plan Not Found

Could not find a plan matching "${explicitPlanName}".
No incomplete plans available. Create a new plan with: /plan "your task"`
          }
        }
      } else if (existingState) {
        const progress = getPlanProgress(existingState.active_plan)

        if (!progress.isComplete) {
          const effectiveWorktree = worktreePath ?? existingState.worktree_path

            const sessionAlreadyTracked = existingState.session_ids.includes(sessionId)
            const updatedSessions = sessionAlreadyTracked
              ? existingState.session_ids
              : [...existingState.session_ids, sessionId]
            const shouldRewriteState = existingState.agent !== activeAgent || worktreePath !== undefined

            if (shouldRewriteState) {
              writeBoulderState(ctx.directory, {
                ...existingState,
                agent: activeAgent,
                ...(worktreePath !== undefined ? { worktree_path: worktreePath } : {}),
                session_ids: updatedSessions,
                session_origins: {
                  ...(existingState.session_origins ?? {}),
                  [sessionId]: "direct",
                },
              })
            } else if (!sessionAlreadyTracked) {
              appendSessionId(ctx.directory, sessionId, "direct")
            }

          const runtimeWorkflow = ensureRuntimeWorkflowSession({
            directory: ctx.directory,
            sessionId,
            activePlan: existingState.active_plan,
            activeAgent,
            worktreePath: effectiveWorktree,
            currentStage: "plan",
          })
          appendRuntimeWorkflowNote({
            directory: ctx.directory,
            sessionId,
            stage: "plan",
            content: "Execution session resumed from /start-work. Re-read the active plan and continue from the next unfinished item.",
          })
          runtimeWorkflowBlock = createRuntimeWorkflowBlock({
            ...runtimeWorkflow.paths,
            autoModeLevel: runtimeWorkflow.state.auto_mode_level,
            interactionMode: runtimeWorkflow.state.interaction_mode,
            currentWave: runtimeWorkflow.state.current_wave,
          })

          const worktreeDisplay = effectiveWorktree ? createWorktreeActiveBlock(effectiveWorktree) : worktreeBlock

          contextInfo = `
## Active Work Session Found

**Status**: RESUMING existing work
**Plan**: ${existingState.plan_name}
**Path**: ${existingState.active_plan}
**Progress**: ${progress.completed}/${progress.total} tasks completed
**Sessions**: ${existingState.session_ids.length + 1} (current session appended)
**Started**: ${existingState.started_at}
${worktreeDisplay}
${runtimeWorkflowBlock}

The current session (${sessionId}) has been added to session_ids.
Read the plan file and continue from the first unchecked task.`
        } else {
          contextInfo = `
## Previous Work Complete

The previous plan (${existingState.plan_name}) has been completed.
Looking for new plans...`
        }
      }

      if (
        (!existingState && !explicitPlanName) ||
        (existingState && !explicitPlanName && getPlanProgress(existingState.active_plan).isComplete)
      ) {
        const plans = findPrometheusPlans(ctx.directory)
        const incompletePlans = plans.filter((p) => !getPlanProgress(p).isComplete)

        if (plans.length === 0) {
          contextInfo += `
## No Plans Found

No Prometheus plan files found at .opencode/openagent-labforge/plans/
Use Prometheus to create a work plan first: /plan "your task"`
        } else if (incompletePlans.length === 0) {
          contextInfo += `

## All Plans Complete

All ${plans.length} plan(s) are complete. Create a new plan with: /plan "your task"`
        } else if (incompletePlans.length === 1) {
          const planPath = incompletePlans[0]
          const progress = getPlanProgress(planPath)
          const newState = createBoulderState(planPath, sessionId, activeAgent, worktreePath)
          writeBoulderState(ctx.directory, newState)
          const runtimeWorkflow = ensureRuntimeWorkflowSession({
            directory: ctx.directory,
            sessionId,
            activePlan: planPath,
            activeAgent,
            worktreePath,
            currentStage: "plan",
          })
          appendRuntimeWorkflowNote({
            directory: ctx.directory,
            sessionId,
            stage: "plan",
            content: "A single incomplete plan was auto-selected. Re-read the plan and start the next execution wave.",
          })
          runtimeWorkflowBlock = createRuntimeWorkflowBlock({
            ...runtimeWorkflow.paths,
            autoModeLevel: runtimeWorkflow.state.auto_mode_level,
            interactionMode: runtimeWorkflow.state.interaction_mode,
            currentWave: runtimeWorkflow.state.current_wave,
          })

          contextInfo += `

## Auto-Selected Plan

**Plan**: ${getPlanName(planPath)}
**Path**: ${planPath}
**Progress**: ${progress.completed}/${progress.total} tasks
**Session ID**: ${sessionId}
**Started**: ${timestamp}
${worktreeBlock}
${runtimeWorkflowBlock}

boulder.json has been created. Read the plan and begin execution.`
        } else {
          const planList = incompletePlans
            .map((p, i) => {
              const progress = getPlanProgress(p)
              const modified = new Date(statSync(p).mtimeMs).toISOString()
              return `${i + 1}. [${getPlanName(p)}] - Modified: ${modified} - Progress: ${progress.completed}/${progress.total}`
            })
            .join("\n")

          contextInfo += `

<system-reminder>
## Multiple Plans Found

Current Time: ${timestamp}
Session ID: ${sessionId}

${planList}

Ask the user which plan to work on. Present the options above and wait for their response.
${worktreeBlock}
</system-reminder>`
        }
      }

      const idx = output.parts.findIndex((p) => p.type === "text" && p.text)
      if (idx >= 0 && output.parts[idx].text) {
        output.parts[idx].text = output.parts[idx].text
          .replace(/\$SESSION_ID/g, sessionId)
          .replace(/\$TIMESTAMP/g, timestamp)

        output.parts[idx].text += `\n\n---\n${contextInfo}`
      }

      log(`[${HOOK_NAME}] Context injected`, {
        sessionID: input.sessionID,
        hasExistingState: !!existingState,
        worktreePath,
      })
    },
  }
}
