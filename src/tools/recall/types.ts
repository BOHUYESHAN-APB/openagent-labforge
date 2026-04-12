export type RecallSection =
  | "state"
  | "session-origin"
  | "mission"
  | "roadmap"
  | "stage-anchor"
  | "stage-capsule"
  | "stage-file"
  | "structured-todos"
  | "manual-boundaries"
  | "review"
  | "artifact-policy"

export interface RecallArgs {
  session_id?: string
  sections?: RecallSection[]
}
