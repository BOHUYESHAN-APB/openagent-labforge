/**
 * Start Work Command
 *
 * /start-work [plan-name] [--worktree <path>]
 *
 * Core logic:
 * 1. Find available plans in .opencode/openagent-labforge/plans/
 * 2. Check active boulder state
 * 3. Detect domain (bio vs engineering)
 * 4. Route to appropriate executor
 * 5. Create/update boulder.json
 */

import type { PluginInput } from "@opencode-ai/plugin"
import * as fs from "node:fs/promises"
import * as path from "node:path"

// ==========================================
// Types
// ==========================================

interface BoulderState {
  active_plan: string
  started_at: string
  session_ids: string[]
  plan_name: string
  worktree_path?: string
  agent?: string
  domain?: "bio" | "engineering" | "hybrid"
}

interface PlanInfo {
  name: string
  path: string
  modified: Date
  checkboxCount: number
  completedCount: number
}

// ==========================================
// Constants
// ==========================================

const PLANS_DIR = ".opencode/openagent-labforge/plans"
const BOULDER_FILE = ".opencode/openagent-labforge/boulder.json"

const BIO_SIGNALS = [
  "bio", "bioinformatics", "rna", "dna", "genome", "proteomics",
  "scrnaseq", "rnaseq", "atacseq", "chipseq", "sequencing",
  "pipeline", "fastq", "bam", "vcf", "gene expression",
  "pathway", "star", "deseq2", "seurat",
  "生信", "组学", "生物", "文献",
]

const ENGINEERING_SIGNALS = [
  "api", "database", "frontend", "backend", "react", "node.js",
  "docker", "testing", "代码", "开发", "测试", "refactor",
  "architecture", "typescript", "javascript", "python",
]

// ==========================================
// Helper Functions
// ==========================================

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function findPlans(directory: string): Promise<PlanInfo[]> {
  const plansDir = path.join(directory, PLANS_DIR)

  if (!(await fileExists(plansDir))) {
    return []
  }

  const entries = await fs.readdir(plansDir, { withFileTypes: true })
  const plans: PlanInfo[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue
    }

    const planPath = path.join(plansDir, entry.name)
    const stat = await fs.stat(planPath)
    const content = await fs.readFile(planPath, "utf-8")

    // Count checkboxes
    const checkboxMatches = content.match(/^\s*[-*]\s*\[[ xX]\]/gm) ?? []
    const completedMatches = content.match(/^\s*[-*]\s*\[[xX]\]/gm) ?? []

    plans.push({
      name: entry.name.replace(/\.md$/, ""),
      path: planPath,
      modified: stat.mtime,
      checkboxCount: checkboxMatches.length,
      completedCount: completedMatches.length,
    })
  }

  // Sort by modified time (newest first)
  plans.sort((a, b) => b.modified.getTime() - a.modified.getTime())

  return plans
}

async function readBoulderState(directory: string): Promise<BoulderState | null> {
  const boulderPath = path.join(directory, BOULDER_FILE)

  if (!(await fileExists(boulderPath))) {
    return null
  }

  try {
    const content = await fs.readFile(boulderPath, "utf-8")
    return JSON.parse(content) as BoulderState
  } catch {
    return null
  }
}

async function writeBoulderState(
  directory: string,
  state: BoulderState
): Promise<void> {
  const boulderPath = path.join(directory, BOULDER_FILE)
  const boulderDir = path.dirname(boulderPath)

  await fs.mkdir(boulderDir, { recursive: true })
  await fs.writeFile(boulderPath, JSON.stringify(state, null, 2), "utf-8")
}

function detectDomain(text: string): "bio" | "engineering" | "hybrid" {
  const lower = text.toLowerCase()

  const bioCount = BIO_SIGNALS.filter((signal) => lower.includes(signal)).length
  const engCount = ENGINEERING_SIGNALS.filter((signal) => lower.includes(signal)).length

  if (bioCount > 0 && engCount > 0) {
    return "hybrid"
  }
  if (bioCount > 0) {
    return "bio"
  }
  return "engineering"
}

function resolveExecutor(domain: "bio" | "engineering" | "hybrid"): string {
  switch (domain) {
    case "bio":
      return "bio-worker"
    case "engineering":
      return "deep-worker"
    case "hybrid":
      return "ultrawork" // Let ultrawork decide
  }
}

// ==========================================
// Command Template
// ==========================================

const START_WORK_TEMPLATE = `You are starting a work session.

## ARGUMENTS
- \`/start-work [plan-name] [--worktree <path>]\`

## WHAT TO DO

1. **Find available plans**: Search for plan files at \`.opencode/openagent-labforge/plans/\`

2. **Check for active boulder state**: Read \`.opencode/openagent-labforge/boulder.json\` if it exists

3. **Decision logic**:
   - If boulder.json exists AND plan is NOT complete: Continue work on existing plan
   - If no active plan OR plan is complete: List available plans for selection

4. **Domain detection**:
   - Bio signals: RNA-seq, ChIP-seq, genome, proteomics, etc.
   - Engineering signals: API, database, frontend, backend, etc.
   - Hybrid: Both bio and engineering signals

5. **Route to executor**:
   - Bio: bio-worker
   - Engineering: deep-worker
   - Hybrid: ultrawork (decides)

6. **Create/Update boulder.json**:
   \`\`\`json
   {
     "active_plan": "/absolute/path/to/plan.md",
     "started_at": "ISO_TIMESTAMP",
     "session_ids": ["session_id"],
     "plan_name": "plan-name",
     "domain": "bio|engineering|hybrid"
   }
   \`\`\`

## OUTPUT FORMAT

When listing plans:
\`\`\`
Available Work Plans

1. [plan-name-1] - Modified: {date} - Progress: 3/10 tasks
2. [plan-name-2] - Modified: {date} - Progress: 0/5 tasks

Which plan would you like to work on?
\`\`\`

When starting work:
\`\`\`
Starting Work Session

Plan: {plan-name}
Domain: {bio|engineering|hybrid}
Executor: {bio-worker|deep-worker|ultrawork}

Reading plan and routing to executor...
\`\`\`
`

// ==========================================
// Hook Factory
// ==========================================

export function createStartWorkHook(ctx: PluginInput) {
  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
      },
      output: {
        parts: Array<{ type: string; text?: string }>
      }
    ): Promise<void> => {
      const promptText = output.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("\n")
        .trim()

      // Check if this is a start-work command
      if (!promptText.includes("/start-work") && !promptText.includes("/ol-start-work")) {
        return
      }

      // Parse arguments
      const argsMatch = promptText.match(
        /\/(?:ol-)?start-work\s+(.+?)(?:\s+--worktree\s+(.+?))?$/
      )
      const planName = argsMatch?.[1]?.trim()
      const worktreePath = argsMatch?.[2]?.trim()

      // Find plans
      const plans = await findPlans(ctx.directory)

      if (plans.length === 0) {
        output.parts.push({
          type: "text",
          text: "No plans found. Create a plan first using prometheus.",
        })
        return
      }

      // Check existing boulder state
      const existingBoulder = await readBoulderState(ctx.directory)

      if (existingBoulder && planName) {
        // Append session to existing boulder
        existingBoulder.session_ids.push(input.sessionID)
        await writeBoulderState(ctx.directory, existingBoulder)

        output.parts.push({
          type: "text",
          text: `Resuming Work Session\n\nActive Plan: ${existingBoulder.plan_name}\nDomain: ${existingBoulder.domain ?? "engineering"}\nSessions: ${existingBoulder.session_ids.length}\n\nReading plan and routing to executor...`,
        })
        return
      }

      // Find matching plan
      let selectedPlan: PlanInfo | undefined

      if (planName) {
        // Exact match first
        selectedPlan = plans.find(
          (p) => p.name.toLowerCase() === planName.toLowerCase()
        )
        // Partial match
        if (!selectedPlan) {
          selectedPlan = plans.find((p) =>
            p.name.toLowerCase().includes(planName.toLowerCase())
          )
        }
      }

      if (!selectedPlan) {
        // List plans for selection
        const planList = plans
          .map(
            (p, i) =>
              `${i + 1}. [${p.name}] - Modified: ${p.modified.toISOString()} - Progress: ${p.completedCount}/${p.checkboxCount} tasks`
          )
          .join("\n")

        output.parts.push({
          type: "text",
          text: `Available Work Plans\n\n${planList}\n\nWhich plan would you like to work on? (Enter number or plan name)`,
        })
        return
      }

      // Read plan content for domain detection
      const planContent = await fs.readFile(selectedPlan.path, "utf-8")
      const domain = detectDomain(planContent)
      const executor = resolveExecutor(domain)

      // Create boulder state
      const boulderState: BoulderState = {
        active_plan: selectedPlan.path,
        started_at: new Date().toISOString(),
        session_ids: [input.sessionID],
        plan_name: selectedPlan.name,
        worktree_path: worktreePath,
        agent: executor,
        domain,
      }

      await writeBoulderState(ctx.directory, boulderState)

      output.parts.push({
        type: "text",
        text: `Starting Work Session\n\nPlan: ${selectedPlan.name}\nDomain: ${domain}\nExecutor: ${executor}\nSessions: 1\n\nReading plan and routing to executor...`,
      })
    },
  }
}

export { START_WORK_TEMPLATE }
