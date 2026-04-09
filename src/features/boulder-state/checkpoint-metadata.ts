import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import type {
  RuntimeWorkflowArtifactMode,
  RuntimeWorkflowArtifactStrategy,
} from "./types"
import { OPENCODE_LABFORGE_DIR } from "./constants"

export interface CheckpointMetadata {
  handoff_mission?: string
  source_session_id?: string
  created_at?: string
  goal?: string
  cwd?: string
  key_files?: string[]
  resume_hint?: string
  status?: string
  consumed_by_session_id?: string | null
  artifact_mode?: RuntimeWorkflowArtifactMode
  artifact_root?: string
  artifact_strategy?: RuntimeWorkflowArtifactStrategy
  active_work_item?: string
  bootstrap_primary_key?: string
  bootstrap_primary_label_zh?: string
  bootstrap_primary_label_en?: string
  bootstrap_secondary_keys?: string[]
  bootstrap_custom_instruction?: string
}

export function getLatestCheckpointMetadataPath(directory: string): string {
  return join(directory, OPENCODE_LABFORGE_DIR, "checkpoints", "latest.meta.json")
}

export function readLatestCheckpointMetadata(directory: string): CheckpointMetadata | null {
  const path = getLatestCheckpointMetadataPath(directory)
  if (!existsSync(path)) return null

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as CheckpointMetadata
  } catch {
    return null
  }
}
