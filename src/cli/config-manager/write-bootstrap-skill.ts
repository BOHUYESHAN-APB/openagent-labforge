import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { getConfigDir } from "./config-context"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"

const BOOTSTRAP_SKILL_NAME = "openagent-labforge"
const MANAGED_MARKER = "<!-- managed-by: openagent-labforge installer -->"

const BOOTSTRAP_SKILL_CONTENT = `---
name: openagent-labforge
description: Route work through openagent-labforge agents, commands, MCPs, and verification loops
compatibility: opencode
metadata:
  category: orchestration/plugin-bootstrap
  owner: openagent-labforge
---
${MANAGED_MARKER}

# OpenAgent Labforge Route

Use this skill when the workspace has the openagent-labforge plugin installed.

## Routing rules

1. Start by classifying the request: implementation, search, writing, refactor, release, or GitHub triage.
2. Prefer specialist agents before brute-force single-agent execution.
3. Prefer the plugin's MCPs and skill loaders for web/docs/code search when available.
4. Keep work aligned with AGENTS.md, project conventions, tests, and typecheck.
5. End with concise verification notes and suggested next steps.

## Agent routing

- Use 'sisyphus', 'hephaestus', 'prometheus', and 'atlas' for orchestration and execution.
- Use 'explore' for local codebase discovery and grep-heavy context gathering.
- Use 'librarian' for one specific external library, framework, SDK, or upstream implementation question.
- Use 'github-scout' for ranked repository landscapes, adoption signals, maintainer health, and study shortlists.
- Use 'tech-scout' for cross-source ecosystem scans across launches, papers, benchmarks, and strategic learning priorities.
- Use 'oracle' for read-only expert judgment and second-opinion analysis.
- Use 'article-writer' when the user wants polished docs, reports, or publishable writing for broad external readers.
- Use 'scientific-writer' when the user wants peer-facing scientific, research-style, or technology-paper writing with tighter evidence discipline and manuscript-draft structure.
- Use 'multimodal-looker' when screenshots, PDFs, or diagrams matter.

## Tooling route

- Prefer 'skill', 'websearch', 'context7', 'grep_app', and configured MCP servers for research.
- Prefer 'open_websearch_mcp' for aggregated multi-engine search when that MCP is enabled.
- Prefer 'task(subagent_type=...)' over 'call_omo_agent' when you want normal child-session delegation that stays inspectable in the OpenCode UI.
- Prefer slash commands like '/start-work', '/refactor', '/handoff', and '/publish' when they fit the request.
- For coding changes, validate with focused tests, then typecheck/build when appropriate.

## Output style

- Be concise, decisive, and verification-oriented.
- Cite concrete files, commands, and URLs when reporting findings.
- If a specialist path is clearly better, use it instead of staying in a generic workflow.
`

export interface BootstrapSkillWriteResult {
  success: boolean
  skillPath: string
  action?: "created" | "updated" | "kept"
  error?: string
}

export interface BootstrapSkillCleanupResult {
  success: boolean
  skillPath: string
  removed?: boolean
  error?: string
}

export function getBootstrapSkillPath(): string {
  return join(getConfigDir(), "skills", BOOTSTRAP_SKILL_NAME, "SKILL.md")
}

export function writeBootstrapSkill(): BootstrapSkillWriteResult {
  const skillPath = getBootstrapSkillPath()

  try {
    mkdirSync(join(getConfigDir(), "skills", BOOTSTRAP_SKILL_NAME), { recursive: true })

    if (!existsSync(skillPath)) {
      writeFileSync(skillPath, BOOTSTRAP_SKILL_CONTENT)
      return { success: true, skillPath, action: "created" }
    }

    const existingContent = readFileSync(skillPath, "utf-8")
    if (!existingContent.includes(MANAGED_MARKER)) {
      return { success: true, skillPath, action: "kept" }
    }

    if (existingContent !== BOOTSTRAP_SKILL_CONTENT) {
      writeFileSync(skillPath, BOOTSTRAP_SKILL_CONTENT)
      return { success: true, skillPath, action: "updated" }
    }

    return { success: true, skillPath, action: "kept" }
  } catch (err) {
    return {
      success: false,
      skillPath,
      error: formatErrorWithSuggestion(err, "write bootstrap skill"),
    }
  }
}

export function cleanupManagedBootstrapSkill(): BootstrapSkillCleanupResult {
  const skillPath = getBootstrapSkillPath()

  try {
    if (!existsSync(skillPath)) {
      return { success: true, skillPath, removed: false }
    }

    const existingContent = readFileSync(skillPath, "utf-8")
    if (!existingContent.includes(MANAGED_MARKER)) {
      return { success: true, skillPath, removed: false }
    }

    rmSync(join(getConfigDir(), "skills", BOOTSTRAP_SKILL_NAME), { recursive: true, force: true })
    return { success: true, skillPath, removed: true }
  } catch (err) {
    return {
      success: false,
      skillPath,
      error: formatErrorWithSuggestion(err, "cleanup bootstrap skill"),
    }
  }
}
