/**
 * Boulder State Types
 *
 * Manages the active work plan state for Sisyphus orchestrator.
 * Named after Sisyphus's boulder - the eternal task that must be rolled.
 */

export interface BoulderState {
  /** Absolute path to the active plan file */
  active_plan: string
  /** ISO timestamp when work started */
  started_at: string
  /** Session IDs that have worked on this plan */
  session_ids: string[]
  /** Plan name derived from filename */
  plan_name: string
  /** Agent type to use when resuming (e.g., 'atlas') */
  agent?: string
  /** Absolute path to the git worktree root where work happens */
  worktree_path?: string
}

export interface PlanProgress {
  /** Total number of checkboxes */
  total: number
  /** Number of completed checkboxes */
  completed: number
  /** Whether all tasks are done */
  isComplete: boolean
}

export type RuntimeWorkflowStage = "plan" | "build" | "review"

export type RuntimeWorkflowVerdict = "approve" | "reject"

export type RuntimeWorkflowAutoModeLevel = "light" | "heavy"

export type RuntimeWorkflowInteractionMode = "batch" | "continuous"

export interface RuntimeWorkflowPaths {
  rootDir: string
  artifactsDir: string
  papersDir: string
  documentsDir: string
  assetsDir: string
  stateFile: string
  missionFile: string
  roadmapFile: string
  planFile: string
  buildFile: string
  reviewFile: string
}

export interface RuntimeWorkflowState {
  schema_version: 1
  session_id: string
  active_plan: string
  active_agent?: string
  worktree_path?: string
  current_stage: RuntimeWorkflowStage
  current_wave?: number
  auto_mode_level?: RuntimeWorkflowAutoModeLevel
  interaction_mode?: RuntimeWorkflowInteractionMode
  mode_rationale?: string
  next_stage?: RuntimeWorkflowStage
  last_review_verdict?: RuntimeWorkflowVerdict
  review_rejection_count?: number
  blocking_findings?: string[]
  last_review_signature?: string
  last_review_handled_signature?: string
  started_at: string
  updated_at: string
}

export interface DocumentWorkspacePaths {
  rootDir: string
  sourceDir: string
  sectionsDir: string
  diagramsDir: string
  figuresDir: string
  assetsDir: string
  renderedDir: string
  outputDir: string
  manifestFile: string
}

export interface PaperCachePaths {
  rootDir: string
  manifestFile: string
  pdfDir: string
  markdownDir: string
  notesDir: string
  citationsDir: string
}

export interface DocumentWorkspaceManifest {
  session_id: string
  document_id: string
  title?: string
  document_type?: string
  assets: DocumentWorkspaceAssetEntry[]
  outputs: DocumentWorkspaceOutputEntry[]
  revisions: DocumentWorkspaceRevisionEntry[]
}

export interface DocumentWorkspaceRegistryEntry {
  document_id: string
  title?: string
  document_type?: string
  root_dir: string
  manifest_file: string
  initialized_at: string
  updated_at: string
}

export interface DocumentWorkspaceRegistry {
  session_id: string
  documents: DocumentWorkspaceRegistryEntry[]
}

export interface PaperCacheEntry {
  paper_id: string
  title?: string
  source_url?: string
  publication_status?: "published" | "preprint" | "unknown"
  year?: number
  weight?: "high" | "medium" | "low"
  pdf_path?: string
  markdown_path?: string
  notes_path?: string
  citation_path?: string
  updated_at: string
}

export interface PaperCacheManifest {
  session_id: string
  entries: PaperCacheEntry[]
}

export interface DocumentWorkspaceAssetEntry {
  asset_id: string
  source_path?: string
  rendered_path?: string
  fallback_path?: string
  caption?: string
  placement?: string
  asset_type?: string
  updated_at: string
}

export interface DocumentWorkspaceOutputEntry {
  output_id: string
  format: string
  path: string
  stage?: string
  updated_at: string
}

export interface DocumentWorkspaceRevisionEntry {
  summary: string
  metadata?: Record<string, unknown>
  created_at: string
}
