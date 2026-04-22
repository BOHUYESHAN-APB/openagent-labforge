import { existsSync, readFileSync } from "fs"
import { join } from "path"

export interface SwarmConfig {
  enabled: boolean
  max_workers: number
  heartbeat_interval_ms: number
  heartbeat_timeout_ms: number
  auto_cleanup: boolean
  coordinator_model?: string
  worker_model?: string
  specialist_model?: string
}

const DEFAULT_SWARM_CONFIG: SwarmConfig = {
  enabled: false,
  max_workers: 5,
  heartbeat_interval_ms: 10000,
  heartbeat_timeout_ms: 30000,
  auto_cleanup: true,
}

function readConfigFile(configPath: string): any {
  try {
    if (!existsSync(configPath)) {
      return null
    }
    const content = readFileSync(configPath, "utf-8")
    return JSON.parse(content)
  } catch (error) {
    console.error(`Failed to read config from ${configPath}:`, error)
    return null
  }
}

export function getSwarmConfig(): SwarmConfig {
  // Try project-level config first
  const projectConfigPath = join(process.cwd(), ".opencode", "openagent-labforge.json")
  const projectConfig = readConfigFile(projectConfigPath)

  if (projectConfig?.experimental?.swarm) {
    return {
      ...DEFAULT_SWARM_CONFIG,
      ...projectConfig.experimental.swarm,
    }
  }

  // Try user-level config
  const userConfigDir = process.env.OPENCODE_CONFIG_DIR || join(process.env.HOME || process.env.USERPROFILE || "", ".opencode")
  const userConfigPath = join(userConfigDir, "openagent-labforge.json")
  const userConfig = readConfigFile(userConfigPath)

  if (userConfig?.experimental?.swarm) {
    return {
      ...DEFAULT_SWARM_CONFIG,
      ...userConfig.experimental.swarm,
    }
  }

  // Return defaults
  return DEFAULT_SWARM_CONFIG
}

export function isSwarmEnabled(): boolean {
  return getSwarmConfig().enabled
}

export function getMaxWorkers(): number {
  const config = getSwarmConfig()
  // Clamp to valid range
  return Math.max(1, Math.min(20, config.max_workers))
}

export function getHeartbeatInterval(): number {
  return getSwarmConfig().heartbeat_interval_ms
}

export function getHeartbeatTimeout(): number {
  return getSwarmConfig().heartbeat_timeout_ms
}

export function shouldAutoCleanup(): boolean {
  return getSwarmConfig().auto_cleanup
}

export function getCoordinatorModel(): string | undefined {
  return getSwarmConfig().coordinator_model
}

export function getWorkerModel(): string | undefined {
  return getSwarmConfig().worker_model
}

export function getSpecialistModel(): string | undefined {
  return getSwarmConfig().specialist_model
}
