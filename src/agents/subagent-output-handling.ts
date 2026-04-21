/**
 * Subagent Output Handling Capability
 *
 * This capability teaches agents how to handle subagent outputs efficiently
 * to avoid token waste from redundant output repetition.
 *
 * IMPORTANT: This is primarily for PLANNING scenarios where the output
 * is already saved to a file. For execution/analysis scenarios, the parent
 * agent should review and synthesize the output (that's valuable work).
 */

export const SUBAGENT_OUTPUT_HANDLING_CAPABILITY = `
## Subagent Output Handling

When you delegate tasks to subagents, their output will be wrapped in \`<subagent_output>\` tags:

\`\`\`
<subagent_output session_id="xxx" agent="bio-planner">
[Complete output from the subagent...]
</subagent_output>
\`\`\`

### Scenario 1: Planning Tasks (AVOID REPETITION)

**When the subagent has already written output to a file** (e.g., plan files):

1. **DO NOT repeat the subagent's output**
   - The output is already saved to a file
   - User can read the file directly
   - Repeating wastes tokens

2. **DO provide a brief acknowledgment** (50-100 tokens max)
   - Confirm the file was created
   - Mention the file path
   - Suggest next steps

3. **Example - Planning Task:**
   \`\`\`
   ✓ Plan generated and saved to .opencode/openagent-labforge/plans/rna-seq-analysis.md

   Next step: Run \`/ol-start-work\` to begin execution.
   \`\`\`

### Scenario 2: Execution/Analysis Tasks (REVIEW AND SYNTHESIZE)

**When the subagent returns analysis, research, or execution results:**

1. **DO review and synthesize the output**
   - This is your coordination responsibility
   - Add context and interpretation
   - Combine with other information
   - Make recommendations

2. **DO provide comprehensive output**
   - Summarize key findings
   - Highlight important points
   - Connect to the user's goal
   - Suggest next actions

3. **Example - Analysis Task:**
   \`\`\`
   Based on Oracle's architecture analysis:

   **Current State:**
   - Monolithic architecture with 3 main modules
   - Database layer tightly coupled to business logic
   - No clear API boundaries

   **Recommendations:**
   1. Extract database layer into separate service
   2. Define clear API contracts
   3. Implement dependency injection

   **Next Steps:**
   - Review the proposed refactoring plan
   - Identify high-risk areas
   - Plan incremental migration
   \`\`\`

### How to Decide

**Ask yourself:**
- Is the output already saved to a file? → Brief acknowledgment only
- Am I adding value through review/synthesis? → Full output with analysis
- Is this coordination work or just forwarding? → Coordination = full output

**File-based outputs (brief acknowledgment):**
- Plans (.opencode/openagent-labforge/plans/*.md)
- Reports saved to files
- Generated documentation

**In-memory outputs (review and synthesize):**
- Architecture analysis
- Code exploration results
- Research findings
- Error diagnostics
`
