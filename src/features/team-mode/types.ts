import { z } from "zod"

// Message kinds
export const MESSAGE_KINDS = [
  "message",
  "shutdown_request",
  "shutdown_approved",
  "shutdown_rejected",
  "announcement",
] as const

// Member kinds
export const MEMBER_KINDS = ["category", "subagent_type"] as const

// Task statuses
export const TASK_STATUSES = ["pending", "claimed", "in_progress", "completed", "deleted"] as const

// Runtime statuses
export const RUNTIME_STATUSES = [
  "creating",
  "active",
  "shutdown_requested",
  "deleting",
  "deleted",
  "failed",
  "orphaned",
] as const

// Member base schema
const MemberBaseSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  cwd: z.string().optional(),
  worktreePath: z.string().optional(),
  subscriptions: z.array(z.string()).optional(),
  backendType: z.enum(["in-process", "tmux"]).default("in-process"),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
}).strict()

// Category member schema
export const CategoryMemberSchema = MemberBaseSchema.extend({
  kind: z.literal("category"),
  category: z.string().min(1),
  prompt: z.string().min(1),
})

// Subagent member schema
export const SubagentMemberSchema = MemberBaseSchema.extend({
  kind: z.literal("subagent_type"),
  subagent_type: z.string().min(1),
  prompt: z.string().optional(),
})

// Member schema (discriminated union)
export const MemberSchema = z.discriminatedUnion("kind", [CategoryMemberSchema, SubagentMemberSchema])

// Team reference schema
const TeamReferenceSchema = z.object({
  path: z.string(),
  description: z.string().optional(),
}).strict()

// Team spec schema
export const TeamSpecSchema = z.object({
  version: z.literal(1).default(1),
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  createdAt: z.number().int().positive().default(() => Date.now()),
  leadAgentId: z.string().optional(),
  teamAllowedPaths: z.array(z.string()).optional(),
  sessionPermission: z.string().optional(),
  members: z.array(MemberSchema).min(1).max(8),
}).transform((teamSpec) => {
  if (teamSpec.leadAgentId !== undefined) {
    return teamSpec
  }
  const firstMember = teamSpec.members[0]
  if (!firstMember) {
    throw new Error("leadAgentId required")
  }
  return {
    ...teamSpec,
    leadAgentId: firstMember.name,
  }
})

// Message schema
export const MessageSchema = z.object({
  version: z.literal(1),
  messageId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  kind: z.enum(MESSAGE_KINDS),
  body: z.string().max(32 * 1024),
  summary: z.string().optional(),
  references: z.array(TeamReferenceSchema).optional(),
  timestamp: z.number().int().positive(),
  correlationId: z.string().uuid().optional(),
  color: z.string().optional(),
})

// Task schema
export const TaskSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  subject: z.string(),
  description: z.string(),
  activeForm: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  owner: z.string().optional(),
  blocks: z.array(z.string()).default([]),
  blockedBy: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  claimedAt: z.number().int().positive().optional(),
})

// Runtime state member model schema
const RuntimeStateMemberModelSchema = z.object({
  providerID: z.string(),
  modelID: z.string(),
  variant: z.string().optional(),
  reasoningEffort: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  maxTokens: z.number().optional(),
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budgetTokens: z.number().int().positive().optional(),
  }).optional(),
}).strict()

// Runtime state member schema
const RuntimeStateMemberSchema = z.object({
  name: z.string(),
  sessionId: z.string().optional(),
  tmuxPaneId: z.string().optional(),
  tmuxGridPaneId: z.string().optional(),
  agentType: z.enum(["leader", "general-purpose"]),
  subagent_type: z.string().optional(),
  category: z.string().optional(),
  model: RuntimeStateMemberModelSchema.optional(),
  status: z.enum(["pending", "running", "idle", "errored", "completed", "shutdown_approved"]),
  color: z.string().optional(),
  worktreePath: z.string().optional(),
  lastInjectedTurnMarker: z.string().optional(),
  pendingInjectedMessageIds: z.array(z.string()).default([]),
}).strict()

// Runtime bounds schema
const RuntimeBoundsSchema = z.object({
  maxMembers: z.number().int().default(8),
  maxParallelMembers: z.number().int().default(4),
  maxMessagesPerRun: z.number().int().default(10000),
  maxWallClockMinutes: z.number().int().default(120),
  maxMemberTurns: z.number().int().default(500),
}).strict()

// Shutdown request schema
const ShutdownRequestSchema = z.object({
  memberId: z.string(),
  requesterName: z.string(),
  requestedAt: z.number().int().positive(),
  approvedAt: z.number().int().positive().optional(),
  rejectedReason: z.string().optional(),
  rejectedAt: z.number().int().positive().optional(),
}).strict()

// Runtime state tmux layout schema
const RuntimeStateTmuxLayoutSchema = z.object({
  ownedSession: z.boolean(),
  targetSessionId: z.string(),
  focusWindowId: z.string().optional(),
  gridWindowId: z.string().optional(),
}).strict()

// Runtime state schema
export const RuntimeStateSchema = z.object({
  version: z.literal(1),
  teamRunId: z.string().uuid(),
  teamName: z.string(),
  specSource: z.enum(["project", "user"]),
  createdAt: z.number().int().positive(),
  status: z.enum(RUNTIME_STATUSES),
  leadSessionId: z.string().optional(),
  tmuxLayout: RuntimeStateTmuxLayoutSchema.optional(),
  members: z.array(RuntimeStateMemberSchema),
  shutdownRequests: z.array(ShutdownRequestSchema).default([]),
  bounds: RuntimeBoundsSchema,
})

// Agent eligibility registry
export const AGENT_ELIGIBILITY_REGISTRY: Readonly<Record<string, {
  verdict: "eligible" | "conditional" | "hard-reject"
  rejectionMessage?: string
}>> = {
  sisyphus: { verdict: "eligible" },
  hephaestus: {
    verdict: "conditional",
    rejectionMessage: "Agent 'hephaestus' lacks teammate permission.",
  },
  oracle: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'oracle' is read-only. Use delegate-task instead.",
  },
  librarian: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'librarian' is read-only. Use delegate-task instead.",
  },
  explore: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'explore' is read-only. Use delegate-task instead.",
  },
  "multimodal-looker": {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'multimodal-looker' is read-only. Use delegate-task instead.",
  },
  metis: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'metis' is read-only. Use delegate-task instead.",
  },
  momus: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'momus' is read-only. Use delegate-task instead.",
  },
  atlas: { verdict: "eligible" },
  prometheus: {
    verdict: "hard-reject",
    rejectionMessage: "Agent 'prometheus' is plan-mode-only. Use delegate-task instead.",
  },
  "sisyphus-junior": { verdict: "eligible" },
} as const

// Parse member function
export function parseMember(input: unknown): Member {
  const result = MemberSchema.safeParse(input)
  if (!result.success) {
    throw new Error(`Invalid member: ${result.error.message}`)
  }
  
  const member = result.data
  if (member.kind === "subagent_type") {
    const entry = AGENT_ELIGIBILITY_REGISTRY[member.subagent_type]
    if (entry && entry.verdict === "hard-reject") {
      throw new Error(entry.rejectionMessage)
    }
  }
  
  return member
}

// Export types
export type TeamSpec = z.infer<typeof TeamSpecSchema>
export type Member = z.infer<typeof MemberSchema>
export type CategoryMember = z.infer<typeof CategoryMemberSchema>
export type SubagentMember = z.infer<typeof SubagentMemberSchema>
export type Message = z.infer<typeof MessageSchema>
export type Task = z.infer<typeof TaskSchema>
export type RuntimeStateMember = z.infer<typeof RuntimeStateMemberSchema>
export type RuntimeState = z.infer<typeof RuntimeStateSchema>
