import { join } from "path"
import { existsSync, readdirSync, readFileSync } from "fs"
import { writeJSONAtomically } from "../../shared/write-file-atomically"

export interface SwarmResult {
  agent: string
  task: string
  status: "completed" | "in_progress" | "failed"
  result: string
  files_modified?: string[]
  error?: string
  updated_at: string
}

function getResultsDir(swarmId: string): string {
  return join(process.cwd(), ".opencode", "openagent-labforge", "swarm", swarmId, "results")
}

function getResultPath(swarmId: string, agentName: string): string {
  return join(getResultsDir(swarmId), `${agentName}.json`)
}

export async function writeResult(swarmId: string, result: SwarmResult): Promise<void> {
  const resultsDir = getResultsDir(swarmId)

  if (!existsSync(resultsDir)) {
    throw new Error(`Swarm ${swarmId} results directory not found`)
  }

  const resultPath = getResultPath(swarmId, result.agent)

  // Single writer per agent, no locking needed
  writeJSONAtomically(resultPath, result)
}

export async function readResult(
  swarmId: string,
  agentName: string
): Promise<SwarmResult | null> {
  const resultPath = getResultPath(swarmId, agentName)

  if (!existsSync(resultPath)) {
    return null
  }

  try {
    const content = readFileSync(resultPath, "utf-8")
    return JSON.parse(content) as SwarmResult
  } catch (error) {
    console.error(`Failed to read result for agent ${agentName} in swarm ${swarmId}:`, error)
    return null
  }
}

export async function readAllResults(swarmId: string): Promise<SwarmResult[]> {
  const resultsDir = getResultsDir(swarmId)

  if (!existsSync(resultsDir)) {
    return []
  }

  try {
    const files = readdirSync(resultsDir).filter((f) => f.endsWith(".json"))

    const results: SwarmResult[] = []

    for (const file of files) {
      const filePath = join(resultsDir, file)
      const content = readFileSync(filePath, "utf-8")
      const result = JSON.parse(content) as SwarmResult
      results.push(result)
    }

    // Sort by updated_at (descending, most recent first)
    results.sort((a, b) => b.updated_at.localeCompare(a.updated_at))

    return results
  } catch (error) {
    console.error(`Failed to read all results for swarm ${swarmId}:`, error)
    return []
  }
}

export async function deleteResult(swarmId: string, agentName: string): Promise<void> {
  const resultPath = getResultPath(swarmId, agentName)

  if (!existsSync(resultPath)) {
    return
  }

  try {
    const fs = await import("fs")
    fs.unlinkSync(resultPath)
  } catch (error) {
    console.error(`Failed to delete result for agent ${agentName} in swarm ${swarmId}:`, error)
  }
}
