// Team runtime create - with BackgroundManager integration
import { randomUUID } from "node:crypto"
import type { TeamSpec, RuntimeState, Member } from "../types"
import { saveRuntimeState, loadRuntimeState } from "../team-state-store/index"
import { registerTeamSession } from "../team-session-registry"

// Type for BackgroundManager (simplified)
interface BackgroundManager {
  launch(input: {
    description: string
    prompt: string
    agent: string
    parentSessionId: string
    parentMessageId: string
    teamRunId?: string
    suppressTmuxSpawn?: boolean
    model?: { providerID: string; modelID: string }
    category?: string
    onSessionCreated?: (sessionId: string) => void | Promise<void>
  }): Promise<{ id: string; sessionId?: string }>
}

export interface CreateTeamRunOptions {
  leadSessionId?: string
  parentMessageID?: string
}

function buildMemberPrompt(
  spec: TeamSpec,
  member: Member,
  teamRunId: string,
  worktreePath?: string,
): string {
  const promptLines = [
    `Team: ${spec.name}`,
    `TeamRunId: ${teamRunId}`,
    `Member: ${member.name}`,
  ]
  if (worktreePath) promptLines.push(`Worktree: ${worktreePath}`)
  if (member.prompt) promptLines.push(member.prompt)
  promptLines.push(`
# Team Communication

You are running as a team member. Use team_send_message to communicate.
Use team_task_update to report task progress.
`)
  return promptLines.join("\n")
}

export async function createTeamRun(
  teamName: string,
  spec: TeamSpec,
  specSource: "project" | "user" = "user",
  bgMgr?: BackgroundManager,
  options?: CreateTeamRunOptions,
): Promise<RuntimeState> {
  const teamRunId = randomUUID()
  const leadSessionId = options?.leadSessionId

  const state: RuntimeState = {
    version: 1,
    teamRunId,
    teamName,
    specSource,
    createdAt: Date.now(),
    status: "creating",
    leadSessionId,
    members: spec.members.map(member => ({
      name: member.name,
      agentType: member.name === spec.leadAgentId ? "leader" : "general-purpose",
      subagent_type: member.kind === "subagent_type" ? member.subagent_type : undefined,
      category: member.kind === "category" ? member.category : undefined,
      status: "pending" as const,
      color: member.color,
      pendingInjectedMessageIds: [],
    })),
    shutdownRequests: [],
    bounds: {
      maxMembers: 8,
      maxParallelMembers: 4,
      maxMessagesPerRun: 10000,
      maxWallClockMinutes: 120,
      maxMemberTurns: 500,
    },
  }

  await saveRuntimeState(teamName, state)

  // If we have a BackgroundManager, launch member sessions
  if (bgMgr) {
    await launchMemberSessions(teamName, spec, state, bgMgr, leadSessionId, options?.parentMessageID)
  }

  return state
}

async function launchMemberSessions(
  teamName: string,
  spec: TeamSpec,
  state: RuntimeState,
  bgMgr: BackgroundManager,
  leadSessionId?: string,
  parentMessageID?: string,
): Promise<void> {
  const launchPromises = spec.members.map(async (member, index) => {
    // Skip lead if it's reusing the caller session
    if (leadSessionId && member.name === spec.leadAgentId) {
      const currentState = await loadRuntimeState(teamName)
      if (currentState) {
        currentState.members[index].sessionId = leadSessionId
        currentState.members[index].status = "running"
        await saveRuntimeState(teamName, currentState)
      }
      registerTeamSession(leadSessionId, {
        teamRunId: state.teamRunId,
        memberName: member.name,
        role: "lead",
      })
      return
    }

    // Launch member session
    const prompt = buildMemberPrompt(spec, member, state.teamRunId)
    const agent = member.kind === "subagent_type" ? member.subagent_type : "orchestrator"

    try {
      const task = await bgMgr.launch({
        description: `Team member: ${teamName}/${member.name}`,
        prompt,
        agent,
        parentSessionId: leadSessionId || state.teamRunId,
        parentMessageId: parentMessageID || `team-create:${state.teamRunId}:${member.name}`,
        teamRunId: state.teamRunId,
        suppressTmuxSpawn: true,
        category: member.kind === "category" ? member.category : undefined,
        onSessionCreated: async (sessionId: string) => {
          registerTeamSession(sessionId, {
            teamRunId: state.teamRunId,
            memberName: member.name,
            role: member.name === spec.leadAgentId ? "lead" : "member",
          })
          const currentState = await loadRuntimeState(teamName)
          if (currentState) {
            currentState.members[index].sessionId = sessionId
            currentState.members[index].status = "running"
            await saveRuntimeState(teamName, currentState)
          }
        },
      })

      // Update task ID in state
      const currentState = await loadRuntimeState(teamName)
      if (currentState) {
        currentState.members[index].taskId = task.id
        await saveRuntimeState(teamName, currentState)
      }
    } catch (error) {
      console.error(`Failed to launch team member ${member.name}:`, error)
      const currentState = await loadRuntimeState(teamName)
      if (currentState) {
        currentState.members[index].status = "errored"
        await saveRuntimeState(teamName, currentState)
      }
    }
  })

  await Promise.all(launchPromises)

  // Update team status to active
  const finalState = await loadRuntimeState(teamName)
  if (finalState) {
    finalState.status = "active"
    await saveRuntimeState(teamName, finalState)
  }
}
