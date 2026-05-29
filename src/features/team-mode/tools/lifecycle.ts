// Team tools lifecycle
import type { TeamSpec } from "../types"
import { parseMember } from "../types"
import { loadTeamSpec, saveTeamSpec } from "../team-registry/loader"
import { createTeamRun } from "../team-runtime/create"
import { deleteTeam as deleteTeamRuntime } from "../team-runtime/shutdown"
import { createWorktree, removeWorktree } from "../team-worktree/manager"

export async function teamCreate(
  teamName: string,
  specInput: unknown
): Promise<{ teamName: string; spec: TeamSpec }> {
  // Parse and validate the spec
  const spec = specInput as TeamSpec
  
  // Validate all members
  for (const member of spec.members) {
    parseMember(member)
  }
  
  // Save the spec
  await saveTeamSpec(teamName, spec)
  
  // Create the runtime state
  await createTeamRun(teamName, spec)
  
  // Create worktrees for each member
  for (const member of spec.members) {
    await createWorktree(teamName, member.name)
  }
  
  return { teamName, spec }
}

export async function teamDelete(teamName: string): Promise<void> {
  // Load the spec to get member names
  const spec = await loadTeamSpec(teamName)
  if (spec) {
    // Clean up worktrees
    for (const member of spec.members) {
      await removeWorktree(teamName, member.name)
    }
  }
  
  // Delete the runtime state
  await deleteTeamRuntime(teamName)
}
