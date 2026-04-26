/**
 * Stage Completion and Plan Tracking Capability
 * 
 * Shared capability for all executors (Executor, Atlas, WASE, Bio-Autopilot)
 * to track plan progress and mark stage/plan completion.
 */

export const STAGE_COMPLETION_CAPABILITY = `## Stage Completion and Plan Tracking

### Plan Status Management

**At the start of execution:**

1. Check boulder.json for current status:
   \`\`\`typescript
   const boulderState = JSON.parse(read(".opencode/openagent-labforge/boulder.json"))
   
   // Update status to in_progress if not already
   if (boulderState.status !== "in_progress") {
     boulderState.status = "in_progress"
     boulderState.started_at = new Date().toISOString()
     write(".opencode/openagent-labforge/boulder.json", JSON.stringify(boulderState, null, 2))
   }
   
   // Update stage start time if this is a new stage
   const currentStage = boulderState.current_stage || "stage_1"
   if (!boulderState[\`\${currentStage}_started\`]) {
     boulderState[\`\${currentStage}_started\`] = new Date().toISOString()
     write(".opencode/openagent-labforge/boulder.json", JSON.stringify(boulderState, null, 2))
   }
   \`\`\`

2. Update plan file stage status to "In Progress":
   - Find the stage execution status section
   - Update Status to "🟡 In Progress"
   - Fill in Started timestamp

### Stage Completion Detection

**After completing tasks, check if a stage is complete:**

\`\`\`typescript
// For multi-stage plans
const planContent = read(boulderState.active_plan)
const currentStage = boulderState.current_stage || "stage_1"
const stageNumber = currentStage.replace("stage_", "")

// Extract stage section
const stagePattern = new RegExp(\`## Stage \${stageNumber}[\\\\s\\\\S]*?(?=## Stage|## Final|$)\`)
const stageMatch = planContent.match(stagePattern)

if (stageMatch) {
  const stageSection = stageMatch[0]
  const uncheckedInStage = stageSection.match(/^[-*]\\s*\\[\\s*\\]\\s*\\d+\\./gm)
  
  if (!uncheckedInStage || uncheckedInStage.length === 0) {
    // Stage is complete, proceed to stage completion
    completeStage(stageNumber)
  }
}
\`\`\`

### Stage Completion Process

**When a stage is complete:**

1. **Generate stage summary**:
   - Count completed tasks in this stage
   - List 3-5 key achievements (what was built/fixed/improved)
   - Note any known issues or limitations
   - Suggest next steps for the following stage

2. **Update plan file**:
   - Find "Stage N Execution Status" section
   - Update Status to "✅ Completed"
   - Fill in Completed timestamp
   - Fill in Stage Summary with:
     - Completed Tasks count
     - Key Achievements list
     - Known Issues (if any)
     - Next Steps recommendations
   - Set User Confirmation to "⏸️ Awaiting user confirmation to proceed to Stage N+1"

3. **Update boulder.json**:
   \`\`\`typescript
   boulderState[\`stage_\${stageNumber}_completed\`] = new Date().toISOString()
   boulderState[\`stage_\${stageNumber}_status\`] = "completed"
   boulderState[\`stage_\${stageNumber}_tasks_completed\`] = completedCount
   boulderState[\`stage_\${stageNumber}_tasks_total\`] = totalCount
   write(".opencode/openagent-labforge/boulder.json", JSON.stringify(boulderState, null, 2))
   \`\`\`

4. **Present stage completion to user**:
   \`\`\`
   ✅ Stage N completed!
   
   Summary:
   - Completed: X/Y tasks
   - Key achievements:
     • Achievement 1
     • Achievement 2
     • Achievement 3
   - Known issues: [list if any, or "None"]
   
   Next stage: Stage N+1 - [Stage Name]
   
   Ready to proceed? Please confirm to continue, or provide feedback for adjustments.
   \`\`\`

5. **Wait for user confirmation** before proceeding to next stage

6. **After user confirmation**:
   - Update boulder.json: \`current_stage\` to next stage (e.g., "stage_2")
   - Update plan file: mark user confirmation as "✅ Confirmed"
   - Continue to next stage execution

### Plan Completion Detection

**After completing all tasks, check if the entire plan is complete:**

\`\`\`typescript
const planContent = read(boulderState.active_plan)
const uncheckedTasks = planContent.match(/^[-*]\\s*\\[\\s*\\]\\s*\\d+\\./gm)

if (!uncheckedTasks || uncheckedTasks.length === 0) {
  // All tasks complete, proceed to plan completion
  completePlan()
}
\`\`\`

### Plan Completion Process

**When all tasks are complete:**

1. **Generate final summary**:
   - Count total completed tasks
   - List major achievements across all stages
   - Note any remaining known issues
   - Provide follow-up recommendations

2. **Update plan file**:
   - Find "Final Execution Status" or "Project Execution Status" section
   - Update Status to "✅ Completed"
   - Fill in Completed timestamp
   - Fill in Final Summary

3. **Update boulder.json**:
   \`\`\`typescript
   boulderState.status = "completed"
   boulderState.completed_at = new Date().toISOString()
   write(".opencode/openagent-labforge/boulder.json", JSON.stringify(boulderState, null, 2))
   \`\`\`

4. **Present completion to user**:
   \`\`\`
   🎉 All tasks completed!
   
   Final Summary:
   - Total tasks: X
   - Stages completed: N
   - Key achievements:
     • Major achievement 1
     • Major achievement 2
     • Major achievement 3
   - Known issues: [list if any, or "None"]
   
   Follow-up recommendations:
   - Recommendation 1
   - Recommendation 2
   
   ✓ Plan status updated to completed
   ✓ Plan file preserved for reference
   \`\`\`

### Important Notes

- **Stage boundaries**: Only applicable for multi-stage plans. Single-stage plans skip directly to plan completion.
- **User confirmation**: Required between stages to allow for course correction.
- **Status tracking**: Both boulder.json and plan file must be kept in sync.
- **Summary quality**: Summaries should be concrete and specific, not generic.
- **Known issues**: Always list known issues honestly, even if minor.
`
