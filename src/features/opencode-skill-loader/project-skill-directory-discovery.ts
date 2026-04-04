import {
  findProjectAgentsSkillDirs,
  findProjectClaudeSkillDirs,
  findProjectOpencodeSkillDirs,
} from "../../shared/project-discovery-dirs"

export function discoverProjectSkillDirectories(startDirectory: string, skillDirectoryName: string): string[] {
  if (skillDirectoryName === ".claude/skills") {
    return findProjectClaudeSkillDirs(startDirectory)
  }

  if (skillDirectoryName === ".agents/skills") {
    return findProjectAgentsSkillDirs(startDirectory)
  }

  if (skillDirectoryName === ".opencode/skills" || skillDirectoryName === ".opencode/skill") {
    return findProjectOpencodeSkillDirs(startDirectory)
  }

  return []
}
