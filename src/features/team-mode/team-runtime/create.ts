// Team runtime create
import { randomUUID } from "node:crypto"
import type { TeamSpec, RuntimeState } from "../types"
import { saveRuntimeState } from "../team-state-store/index"

export async function createTeamRun(
  teamName: string,
  spec: TeamSpec,
  specSource: "project" | "user" = "user"
): Promise<RuntimeState> {
  const state: RuntimeState = {
    version: 1,
    teamRunId: randomUUID(),
    teamName,
    specSource,
    createdAt: Date.now(),
    status: "creating",
    members: spec.members.map(member => ({
      name: member.name,
      agentType: member.kind === "subagent_type" ? "general-purpose" : "general-purpose",
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
  return state
}
