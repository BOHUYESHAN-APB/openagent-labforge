// Team registry paths
import { join } from "node:path"
import { homedir } from "node:os"

export function getTeamBaseDir(): string {
  return join(homedir(), ".omo", "teams")
}

export function getTeamDir(teamName: string): string {
  return join(getTeamBaseDir(), teamName)
}

export function getTeamConfigPath(teamName: string): string {
  return join(getTeamDir(teamName), "config.json")
}

export function getTeamStatePath(teamName: string): string {
  return join(getTeamDir(teamName), "state.json")
}

export function getTeamMailboxDir(teamName: string): string {
  return join(getTeamDir(teamName), "mailbox")
}

export function getTeamTasklistPath(teamName: string): string {
  return join(getTeamDir(teamName), "tasklist.jsonl")
}

export function getTeamWorktreeDir(teamName: string, memberName: string): string {
  return join(getTeamDir(teamName), "worktrees", memberName)
}
