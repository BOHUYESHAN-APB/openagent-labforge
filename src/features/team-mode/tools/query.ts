// Team tools query
import type { TeamModeConfig } from '../../../config/schema/team-mode'
import { aggregateStatus, listAllTeamStatuses, type TeamStatus } from '../team-runtime/status'
import { listTeams } from '../team-registry/loader'

/**
 * Get comprehensive team status including members, tasks, and sessions.
 */
export async function teamStatus(
  teamRunId: string,
  config: TeamModeConfig,
): Promise<TeamStatus | null> {
  return aggregateStatus(teamRunId, config)
}

/**
 * List all team names from the registry.
 */
export async function teamList(): Promise<string[]> {
  return listTeams()
}

/**
 * List all active teams with their status.
 */
export async function teamListWithStatus(
  config: TeamModeConfig,
): Promise<TeamStatus[]> {
  return listAllTeamStatuses(config)
}
