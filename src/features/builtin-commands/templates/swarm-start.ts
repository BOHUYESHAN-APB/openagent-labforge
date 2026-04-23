/*
 * SWARM SYSTEM - TEMPORARILY DISABLED
 *
 * This file is part of the swarm parallel coordination system.
 * Disabled because OpenCode doesn't officially support execution-type parallel agents yet.
 *
 * Preserved for future use when OpenCode adds official parallel support.
 * Date disabled: 2026-04-23
 */

export const SWARM_START_TEMPLATE = `You are launching a Swarm coordination session.

## ARGUMENTS

- \`/ol-swarm-start "<task-description>" [--workers=N] [--strategy=batch|dynamic]\`
  - \`task-description\` (required): The task to be executed by the swarm
  - \`--workers=N\` (optional): Number of workers (1-20), overrides config max_workers
  - \`--strategy=batch|dynamic\` (optional): Scheduling strategy (default: dynamic)

## STEP 1: Parse Arguments

Extract from $ARGUMENTS:
- Task description (required, can be quoted)
- --workers=N (optional, range: 1-20)
- --strategy=batch|dynamic (optional, default: dynamic)

Examples:
- "Build auth system" --workers=5 --strategy=dynamic
- "Analyze security vulnerabilities" --workers=3
- "Implement user management: frontend, backend, database"

## STEP 2: Read Configuration

Read \`.opencode/openagent-labforge.json\`:

\`\`\`typescript
const config = JSON.parse(read(".opencode/openagent-labforge.json"))
const swarmConfig = config.experimental?.swarm || {}

// Check if enabled
if (!swarmConfig.enabled) {
  throw new Error("Swarm mode is not enabled. Run /ol-settings-swarm to enable it.")
}

// Get settings
const maxWorkers = Math.min(
  parsedArgs.workers || swarmConfig.max_workers || 5,
  20
)
const strategy = parsedArgs.strategy || swarmConfig.strategy || "dynamic"
const coordinatorModel = swarmConfig.coordinator_model  // undefined = auto
const workerModel = swarmConfig.worker_model            // undefined = auto
const specialistModel = swarmConfig.specialist_model    // undefined = auto
\`\`\`

## STEP 3: Initialize Swarm

Generate swarm ID: \`swarm-\${Date.now()}-\${randomString()}\`

Create directory structure:

\`\`\`bash
mkdir -p .opencode/openagent-labforge/swarm/{swarm-id}/{heartbeats,results,messages}
\`\`\`

Write \`state.json\`:
\`\`\`json
{
  "swarm_id": "{swarm-id}",
  "task": "{task-description}",
  "status": "initializing",
  "max_workers": N,
  "strategy": "{strategy}",
  "models": {
    "coordinator": "{coordinatorModel || 'auto'}",
    "worker": "{workerModel || 'auto'}",
    "specialist": "{specialistModel || 'auto'}"
  },
  "created_at": "{ISO_TIMESTAMP}",
  "workers": []
}
\`\`\`

## STEP 4: Task Decomposition

Analyze the task and break into parallel subtasks:
- Identify independent modules/components
- Create clear deliverables for each
- Determine actual worker count: min(subtasks.length, maxWorkers)

Output format:
\`\`\`
📋 Task Decomposition:
1. [Worker-1] Frontend authentication UI
2. [Worker-2] Backend API endpoints
3. [Worker-3] Database schema and migrations
4. [Worker-4] Unit tests
5. [Worker-5] Integration tests

🔧 Configuration:
- Max workers: 5
- Strategy: dynamic
- Coordinator model: claude-opus-4-6 (auto)
- Worker model: claude-haiku-4-5 (auto)
\`\`\`

## STEP 5: Launch Workers

For each subtask, launch a worker with appropriate model:

\`\`\`typescript
task(
  subagent_type="swarm-worker",
  run_in_background=true,
  model=workerModel,  // Pass model if configured, omit if undefined
  prompt=\`Worker-{name} in swarm {swarm-id}

TASK: {detailed-task-description}

DELIVERABLES:
- {file-1}
- {file-2}
- {verification-command}

SWARM COORDINATION:
- Swarm ID: {swarm-id}
- Heartbeat file: .opencode/openagent-labforge/swarm/{swarm-id}/heartbeats/worker-{name}.json
- Result file: .opencode/openagent-labforge/swarm/{swarm-id}/results/worker-{name}.json

INSTRUCTIONS:
1. Update heartbeat every 10-15 seconds
2. Write result file when complete
3. Include all modified files in result
4. Provide verification commands\`
)
\`\`\`

**Important**: If \`workerModel\` is undefined, omit the \`model\` parameter to use default fallback chain.

## STEP 6: Monitor Progress

Poll every 15-30 seconds:

\`\`\`typescript
// Check heartbeats
const heartbeats = glob(".opencode/openagent-labforge/swarm/{swarm-id}/heartbeats/*.json")
for (const hb of heartbeats) {
  const data = JSON.parse(read(hb))
  const age = Date.now() - new Date(data.last_heartbeat).getTime()
  if (age > 30000) {
    console.log(\`⚠️  Worker \${data.agent} timeout (\${age}ms)\`)
    // Retry logic
  }
}

// Check results
const results = glob(".opencode/openagent-labforge/swarm/{swarm-id}/results/*.json")
console.log(\`✓ \${results.length}/\${totalWorkers} workers completed\`)
\`\`\`

## STEP 7: Aggregate Results

When all workers complete:

1. Read all result files
2. Provide **comprehensive analysis** (not simple concatenation):
   - Summary of completed work
   - Integration points between modules
   - Potential conflicts or issues
   - Verification steps
   - Next steps

Output format:
\`\`\`markdown
## 🎉 Swarm Execution Complete

### Completed Modules
1. **Frontend UI** (worker-1)
   - Files: src/components/Login.tsx, src/components/Register.tsx
   - Tests: 15 passing

2. **Backend API** (worker-2)
   - Files: src/api/auth.ts, src/api/routes.ts
   - Tests: 23 passing

### Integration Points
- Frontend calls \`/api/auth/login\` endpoint
- Backend expects JWT in Authorization header
- Database schema matches API models

### Potential Issues
⚠️  Frontend uses 1-hour token expiry, backend uses 24-hour
⚠️  Error response format differs between modules

### Verification
\`\`\`bash
npm run test
npm run build
npm run lint
\`\`\`

### Next Steps
1. Align token expiry times
2. Standardize error response format
3. Run integration tests
4. Deploy to staging
\`\`\`

## CRITICAL RULES

- You are the coordinator - delegate work, don't execute it yourself
- Use swarm state files to track progress
- Detect worker failures and retry
- Final output must be comprehensive analysis, not simple concatenation
- Respect configured models from user's OpenCode configuration
- Monitor heartbeats to detect stale workers
- Clean up swarm state after completion (if auto_cleanup enabled)`

/*
 * END OF SWARM SYSTEM - TEMPORARILY DISABLED
 */
