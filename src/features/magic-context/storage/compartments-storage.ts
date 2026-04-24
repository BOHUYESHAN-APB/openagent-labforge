import { existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { getMagicContextDir, readJSONFile, writeJSON } from "./file-storage"

export interface Compartment {
  sequence: number
  startTag: number
  endTag: number
  title: string
  content: string
  createdAt: number
  byteSize: number
}

interface CompartmentRegistry {
  compartments: Compartment[]
}

function getCompartmentsPath(directory: string, sessionId: string): string {
  const magicContextDir = getMagicContextDir(directory)
  const compartmentsDir = join(magicContextDir, "compartments")
  if (!existsSync(compartmentsDir)) {
    mkdirSync(compartmentsDir, { recursive: true })
  }
  return join(compartmentsDir, `${sessionId}.json`)
}

function loadCompartmentRegistry(directory: string, sessionId: string): CompartmentRegistry {
  const path = getCompartmentsPath(directory, sessionId)
  const data = readJSONFile<CompartmentRegistry>(path)
  return data ?? { compartments: [] }
}

function saveCompartmentRegistry(
  directory: string,
  sessionId: string,
  registry: CompartmentRegistry,
): void {
  const path = getCompartmentsPath(directory, sessionId)
  writeJSON(path, registry)
}

/**
 * Add a new compartment to the registry.
 */
export function addCompartment(
  directory: string,
  sessionId: string,
  compartment: Omit<Compartment, "sequence" | "createdAt" | "byteSize">,
): Compartment {
  const registry = loadCompartmentRegistry(directory, sessionId)

  const nextSequence = registry.compartments.length > 0
    ? Math.max(...registry.compartments.map(c => c.sequence)) + 1
    : 1

  const newCompartment: Compartment = {
    ...compartment,
    sequence: nextSequence,
    createdAt: Date.now(),
    byteSize: Buffer.byteLength(compartment.content, "utf-8"),
  }

  registry.compartments.push(newCompartment)
  saveCompartmentRegistry(directory, sessionId, registry)

  return newCompartment
}

/**
 * Get all compartments for a session.
 */
export function getSessionCompartments(
  directory: string,
  sessionId: string,
): Compartment[] {
  const registry = loadCompartmentRegistry(directory, sessionId)
  return registry.compartments.sort((a, b) => a.sequence - b.sequence)
}

/**
 * Get compartments that overlap with a tag range.
 */
export function getCompartmentsByTagRange(
  directory: string,
  sessionId: string,
  startTag: number,
  endTag: number,
): Compartment[] {
  const compartments = getSessionCompartments(directory, sessionId)
  return compartments.filter(
    c => c.startTag <= endTag && c.endTag >= startTag,
  )
}

/**
 * Delete compartments that overlap with a tag range.
 */
export function deleteCompartmentsByTagRange(
  directory: string,
  sessionId: string,
  startTag: number,
  endTag: number,
): number {
  const registry = loadCompartmentRegistry(directory, sessionId)
  const before = registry.compartments.length

  registry.compartments = registry.compartments.filter(
    c => !(c.startTag <= endTag && c.endTag >= startTag),
  )

  saveCompartmentRegistry(directory, sessionId, registry)
  return before - registry.compartments.length
}
