import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { loadPluginConfig } from "../plugin-config"
import { detectPluginConfigFile, getOpenCodeConfigDir, parseJsonc } from "../shared"
import { CONFIG_BASENAME } from "../shared/plugin-identity"
import type { OhMyOpenCodeConfig } from "../config"

export const BIO_AGENT_NAMES = [
  "bio-autopilot",
  "bio-orchestrator",
  "bio-methodologist",
  "wet-lab-designer",
  "bio-pipeline-operator",
  "paper-evidence-synthesizer",
] as const

const BIO_AGENT_NAME_SET = new Set<string>(BIO_AGENT_NAMES)

export type SettingsScope = "project" | "user"

export type ScopeConfigSnapshot = {
  path: string
  config: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return structuredClone(value)
}

function resolveProjectConfigPath(directory: string): string {
  const base = join(directory, ".opencode")
  const detected = detectPluginConfigFile(base)
  if (detected.format !== "none") {
    return detected.path
  }
  return join(base, `${CONFIG_BASENAME}.jsonc`)
}

function resolveUserConfigPath(): string {
  const configDir = getOpenCodeConfigDir({ binary: "opencode", version: null })
  const detected = detectPluginConfigFile(configDir)
  if (detected.format !== "none") {
    return detected.path
  }
  return join(configDir, `${CONFIG_BASENAME}.jsonc`)
}

export function resolveScopeConfigPath(scope: SettingsScope, directory: string): string {
  return scope === "project" ? resolveProjectConfigPath(directory) : resolveUserConfigPath()
}

export function readScopeConfig(scope: SettingsScope, directory: string): ScopeConfigSnapshot {
  const path = resolveScopeConfigPath(scope, directory)
  if (!existsSync(path)) {
    return { path, config: {} }
  }

  const content = readFileSync(path, "utf-8")
  if (content.trim().length === 0) {
    return { path, config: {} }
  }

  const parsed = parseJsonc<Record<string, unknown>>(content)
  if (!isRecord(parsed)) {
    return { path, config: {} }
  }

  return { path, config: parsed }
}

export function writeScopeConfig(scope: SettingsScope, directory: string, config: Record<string, unknown>): string {
  const path = resolveScopeConfigPath(scope, directory)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf-8")
  return path
}

export function readEffectiveConfig(directory: string): OhMyOpenCodeConfig {
  return loadPluginConfig(directory, undefined)
}

export function updateScopeConfig(
  scope: SettingsScope,
  directory: string,
  mutate: (config: Record<string, unknown>) => void,
): string {
  const current = readScopeConfig(scope, directory)
  const next = cloneRecord(current.config)
  mutate(next)
  return writeScopeConfig(scope, directory, next)
}

export function getNestedRecord(root: Record<string, unknown>, path: string[]): Record<string, unknown> | undefined {
  let current: unknown = root
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return isRecord(current) ? current : undefined
}

export function getNestedString(root: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = root
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return typeof current === "string" ? current : undefined
}

export function getNestedBoolean(root: Record<string, unknown>, path: string[]): boolean | undefined {
  let current: unknown = root
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return typeof current === "boolean" ? current : undefined
}

export function getNestedNumber(root: Record<string, unknown>, path: string[]): number | undefined {
  let current: unknown = root
  for (const key of path) {
    if (!isRecord(current)) return undefined
    current = current[key]
  }
  return typeof current === "number" ? current : undefined
}

export function setNestedValue(root: Record<string, unknown>, path: string[], value: unknown): void {
  if (path.length === 0) return

  let current = root
  for (const key of path.slice(0, -1)) {
    const next = current[key]
    if (!isRecord(next)) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  const leaf = path[path.length - 1]
  if (value === undefined) {
    delete current[leaf]
    return
  }
  current[leaf] = value
}

export function isBioAgentsVisible(config: OhMyOpenCodeConfig): boolean {
  const disabledAgents = config.disabled_agents ?? []
  return !BIO_AGENT_NAMES.some((agent) => disabledAgents.includes(agent))
}

export function setBioAgentsVisible(root: Record<string, unknown>, visible: boolean): void {
  const disabledAgents = Array.isArray(root.disabled_agents)
    ? root.disabled_agents.filter((value): value is string => typeof value === "string")
    : []

  const next = visible
    ? disabledAgents.filter((agent) => !BIO_AGENT_NAME_SET.has(agent))
    : Array.from(new Set([...disabledAgents, ...BIO_AGENT_NAMES]))

  if (next.length === 0) {
    delete root.disabled_agents
    return
  }
  root.disabled_agents = next
}
