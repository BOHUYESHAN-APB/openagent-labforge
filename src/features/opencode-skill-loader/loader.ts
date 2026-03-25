import { join } from "path"
import { homedir } from "os"
import { getClaudeConfigDir } from "../../shared/claude-config-dir"
import { getOpenCodeConfigDir } from "../../shared/opencode-config-dir"
import type { CommandDefinition } from "../claude-code-command-loader/types"
import type { LoadedSkill } from "./types"
import { skillsToCommandDefinitionRecord } from "./skill-definition-record"
import { deduplicateSkillsByName } from "./skill-deduplication"
import { discoverProjectSkillDirectories } from "./project-skill-directory-discovery"
import { loadSkillsFromDir } from "./skill-directory-loader"

async function loadSkillsFromDirectories(options: { directories: string[]; scope: "project" | "opencode-project" }): Promise<LoadedSkill[]> {
  const skills = await Promise.all(
    options.directories.map((skillsDir) => loadSkillsFromDir({ skillsDir, scope: options.scope }))
  )

  return deduplicateSkillsByName(skills.flat())
}

export async function loadUserSkills(): Promise<Record<string, CommandDefinition>> {
  const userSkillsDir = join(getClaudeConfigDir(), "skills")
  const skills = await loadSkillsFromDir({ skillsDir: userSkillsDir, scope: "user" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadProjectSkills(directory?: string): Promise<Record<string, CommandDefinition>> {
  const projectSkillsDirs = discoverProjectSkillDirectories(directory ?? process.cwd(), join(".claude", "skills"))
  const skills = await loadSkillsFromDirectories({ directories: projectSkillsDirs, scope: "project" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadOpencodeGlobalSkills(): Promise<Record<string, CommandDefinition>> {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const opencodeSkillsDir = join(configDir, "skills")
  const skills = await loadSkillsFromDir({ skillsDir: opencodeSkillsDir, scope: "opencode" })
  return skillsToCommandDefinitionRecord(skills)
}

export async function loadOpencodeProjectSkills(directory?: string): Promise<Record<string, CommandDefinition>> {
  const opencodeProjectDirs = discoverProjectSkillDirectories(directory ?? process.cwd(), join(".opencode", "skills"))
  const skills = await loadSkillsFromDirectories({ directories: opencodeProjectDirs, scope: "opencode-project" })
  return skillsToCommandDefinitionRecord(skills)
}

export interface DiscoverSkillsOptions {
  includeClaudeCodePaths?: boolean
  directory?: string
}

export async function discoverAllSkills(directory?: string): Promise<LoadedSkill[]> {
  const [opencodeProjectSkills, opencodeGlobalSkills, projectSkills, userSkills, agentsProjectSkills, agentsGlobalSkills] =
    await Promise.all([
      discoverOpencodeProjectSkills(directory),
      discoverOpencodeGlobalSkills(),
      discoverProjectClaudeSkills(directory),
      discoverUserClaudeSkills(),
      discoverProjectAgentsSkills(directory),
      discoverGlobalAgentsSkills(),
    ])

  // Priority: opencode-project > opencode > project (.claude + .agents) > user (.claude + .agents)
  return deduplicateSkillsByName([
    ...opencodeProjectSkills,
    ...opencodeGlobalSkills,
    ...projectSkills,
    ...agentsProjectSkills,
    ...userSkills,
    ...agentsGlobalSkills,
  ])
}

export async function discoverSkills(options: DiscoverSkillsOptions = {}): Promise<LoadedSkill[]> {
  const { includeClaudeCodePaths = true, directory } = options

  const [opencodeProjectSkills, opencodeGlobalSkills] = await Promise.all([
    discoverOpencodeProjectSkills(directory),
    discoverOpencodeGlobalSkills(),
  ])

  if (!includeClaudeCodePaths) {
    // Priority: opencode-project > opencode
    return deduplicateSkillsByName([...opencodeProjectSkills, ...opencodeGlobalSkills])
  }

  const [projectSkills, userSkills, agentsProjectSkills, agentsGlobalSkills] = await Promise.all([
    discoverProjectClaudeSkills(directory),
    discoverUserClaudeSkills(),
    discoverProjectAgentsSkills(directory),
    discoverGlobalAgentsSkills(),
  ])

  // Priority: opencode-project > opencode > project (.claude + .agents) > user (.claude + .agents)
  return deduplicateSkillsByName([
    ...opencodeProjectSkills,
    ...opencodeGlobalSkills,
    ...projectSkills,
    ...agentsProjectSkills,
    ...userSkills,
    ...agentsGlobalSkills,
  ])
}

export async function getSkillByName(name: string, options: DiscoverSkillsOptions = {}): Promise<LoadedSkill | undefined> {
  const skills = await discoverSkills(options)
  return skills.find(s => s.name === name)
}

export async function discoverUserClaudeSkills(): Promise<LoadedSkill[]> {
  const userSkillsDir = join(getClaudeConfigDir(), "skills")
  return loadSkillsFromDir({ skillsDir: userSkillsDir, scope: "user" })
}

export async function discoverProjectClaudeSkills(directory?: string): Promise<LoadedSkill[]> {
  const projectSkillsDirs = discoverProjectSkillDirectories(directory ?? process.cwd(), join(".claude", "skills"))
  return loadSkillsFromDirectories({ directories: projectSkillsDirs, scope: "project" })
}

export async function discoverOpencodeGlobalSkills(): Promise<LoadedSkill[]> {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" })
  const opencodeSkillsDir = join(configDir, "skills")
  return loadSkillsFromDir({ skillsDir: opencodeSkillsDir, scope: "opencode" })
}

export async function discoverOpencodeProjectSkills(directory?: string): Promise<LoadedSkill[]> {
  const opencodeProjectDirs = discoverProjectSkillDirectories(directory ?? process.cwd(), join(".opencode", "skills"))
  return loadSkillsFromDirectories({ directories: opencodeProjectDirs, scope: "opencode-project" })
}

export async function discoverProjectAgentsSkills(directory?: string): Promise<LoadedSkill[]> {
  const agentsProjectDirs = discoverProjectSkillDirectories(directory ?? process.cwd(), join(".agents", "skills"))
  return loadSkillsFromDirectories({ directories: agentsProjectDirs, scope: "project" })
}

export async function discoverGlobalAgentsSkills(): Promise<LoadedSkill[]> {
  const agentsGlobalDir = join(homedir(), ".agents", "skills")
  return loadSkillsFromDir({ skillsDir: agentsGlobalDir, scope: "user" })
}
