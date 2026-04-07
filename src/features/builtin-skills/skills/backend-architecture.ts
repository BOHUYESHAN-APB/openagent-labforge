import type { BuiltinSkill } from "../types"

export const backendArchitectureSkill: BuiltinSkill = {
  name: "backend-architecture",
  description: "Service and API architecture discipline for contracts, persistence, migrations, observability, and rollout-safe backend work",
  metadata: {
    category: "engineering/backend-architecture",
    domain: "backend-architecture",
  },
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(*)"],
  template: `# Backend Architecture

Use this skill when the task touches APIs, services, background jobs, persistence, auth flows, eventing, queues, or integration boundaries.

## Mission

- Turn backend work into a reviewable system change, not just a pile of handlers.
- Keep contracts, state transitions, schema changes, and runtime behavior explicit.
- Default to production-safe decisions unless the user clearly asks for a prototype.

## When to load this skill

- new endpoint, RPC, webhook, or internal service
- auth, permissions, sessions, or tokens
- DB schema or migration work
- queue, cron, workflow, or background processing
- third-party integration or callback handling
- backend refactor that changes ownership boundaries or data flow
- MCP server or MCP-facing backend boundary design

## Architecture checklist

1. Boundary
- what owns this behavior
- where the contract starts and ends
- what other modules depend on it

2. Contract
- request shape
- response shape
- validation and coercion
- error taxonomy
- auth and permission assumptions

3. State
- persistence model
- migration or backfill implications
- idempotency and retry behavior
- concurrency hazards

4. Operations
- logging and traceability
- metrics or health signals
- timeout, retry, and circuit-breaker expectations
- rollout and rollback posture

## Implementation standards

- prefer narrow modules over growing central god files
- keep DTOs, validators, handlers, and persistence concerns readable and traceable
- if the API contract changes, update docs, schemas, examples, and clients in the same pass when they are repo-owned
- if the change introduces durable state, think through migration and rollback before coding
- if the workflow is asynchronous, make retry semantics and failure visibility explicit

## Verification checklist

- validation rejects bad inputs with predictable error shapes
- auth and permission checks are covered by real tests or executable checks
- changed routes/jobs/webhooks are exercised end-to-end, not only typechecked
- migration or schema assumptions are recorded when relevant
- logs or structured error evidence exist for new failure paths

## Anti-patterns

- adding endpoints without explicit contract validation
- changing persistence shape without considering migration or compatibility
- hiding architecture changes inside a "small fix"
- relying on happy-path tests for jobs, retries, or integrations
- growing a central module because it is convenient right now

## Companion skills

- load \`mcp-builder\` when the backend work includes MCP server design, tool schema, transport, or LLM-facing tool discoverability

## Output contract

- boundary and ownership decision
- contract and validation notes
- persistence or migration impact
- runtime/observability considerations
- verification commands and remaining risk`,
}
