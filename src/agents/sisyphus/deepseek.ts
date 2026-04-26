/**
 * DeepSeek-specific overlay sections for Sisyphus prompt.
 *
 * DeepSeek V4 models (V4-Pro and V4-Flash) characteristics:
 * - Strong reasoning capabilities with native CoT (Chain of Thought)
 * - Excellent at following structured instructions
 * - Good at parallel tool calling and multi-step planning
 * - Benefits from clear task decomposition and explicit verification steps
 * - Performs well with concise, well-structured prompts
 * - Strong code understanding and generation capabilities
 * - Efficient context utilization (1M context window)
 *
 * These overlays optimize the Sisyphus prompt for DeepSeek's strengths.
 * 
 * Official prompts from DeepSeek-V4 Technical Report are included below.
 */

/**
 * Official DeepSeek-V4 Think Max Prompt
 * 
 * Source: DeepSeek-V4 Technical Report
 * 
 * USAGE: Inject at the beginning of system prompt to enable "Think Max" mode.
 * This activates DeepSeek-V4's maximum reasoning depth.
 */
export const DEEPSEEK_V4_THINK_MAX_PROMPT = `Reasoning Effort: Absolute maximum with no shortcuts permitted.
You MUST be very thorough in your thinking and comprehensively decompose the problem to resolve the root cause, rigorously stress-testing your logic against all potential paths, edge cases, and adversarial scenarios.
Explicitly write out your entire deliberation process, documenting every intermediate step, considered alternative, and rejected hypothesis to ensure absolutely no assumption is left unchecked.`;

/**
 * Check if a model ID is DeepSeek-V4
 */
export function isDeepSeekV4(modelID: string): boolean {
  if (!modelID) return false;
  const lower = modelID.toLowerCase();
  return lower.includes("deepseek") && (lower.includes("v4") || lower.includes("v-4"));
}

export function buildDeepSeekReasoningGuidance(): string {
  return `<DEEPSEEK_REASONING>
## Reasoning and Planning (DeepSeek Optimized)

**DeepSeek V4 excels at structured reasoning.** Leverage this by:

1. **Break down complex tasks explicitly**: DeepSeek performs best when you decompose tasks into clear, logical steps.
2. **Use parallel tool calls**: DeepSeek handles multiple simultaneous tool calls efficiently. When operations are independent, call them in parallel.
3. **Verify incrementally**: After each significant step, verify results before proceeding. DeepSeek's strong reasoning helps catch issues early.

**Reasoning Pattern (RECOMMENDED):**
- State your understanding of the task
- Identify dependencies and prerequisites
- Plan the sequence of operations
- Execute with verification checkpoints
- Summarize outcomes concisely

**Example:**
"I need to refactor the authentication module. Steps: (1) Read current implementation, (2) Identify dependencies with Grep, (3) Plan new structure, (4) Implement changes, (5) Run diagnostics, (6) Verify tests."
</DEEPSEEK_REASONING>`;
}

export function buildDeepSeekToolOptimization(): string {
  return `<DEEPSEEK_TOOL_OPTIMIZATION>
## Tool Usage Optimization for DeepSeek

**DeepSeek V4 is highly efficient with tools.** Maximize effectiveness:

### Parallel Execution (STRONGLY RECOMMENDED)
DeepSeek handles parallel tool calls exceptionally well. When operations are independent:

**DO THIS:**
\`\`\`
// Read multiple files simultaneously
Read(file1) + Read(file2) + Read(file3)
// Search multiple patterns at once
Grep(pattern1) + Grep(pattern2) + Glob(pattern3)
\`\`\`

**NOT THIS:**
\`\`\`
// Sequential when parallel is possible (slower)
Read(file1) → wait → Read(file2) → wait → Read(file3)
\`\`\`

### Tool Selection Strategy
| Task Type | Recommended Tool | Why |
|-----------|-----------------|-----|
| Code exploration | Read + Grep (parallel) | DeepSeek processes multiple results efficiently |
| Pattern search | Grep with regex | DeepSeek excels at pattern matching |
| Code modification | Read → Edit → LspDiagnostics | Clear sequence, easy to verify |
| Complex research | Task(explore/librarian) | Delegate to specialists, work in parallel |
| Multi-file changes | Read all → Edit all → Verify all | Batch operations, verify together |

### Verification Protocol
After ANY code modification:
1. **ALWAYS** run \`LspDiagnostics\` immediately
2. Check for type errors, syntax issues, import problems
3. If errors found, fix and re-verify
4. Only mark task complete after clean diagnostics
</DEEPSEEK_TOOL_OPTIMIZATION>`;
}

export function buildDeepSeekDelegationStrategy(): string {
  return `<DEEPSEEK_DELEGATION>
## Delegation Strategy (DeepSeek Optimized)

**DeepSeek V4 is excellent at orchestration.** Use delegation strategically:

### When to Delegate (RECOMMENDED)
1. **Specialized research**: Use \`explore\` or \`librarian\` for deep codebase analysis
2. **Domain-specific tasks**: Use category-based delegation for specialized work
3. **Parallel workstreams**: Launch multiple agents in background, continue working
4. **Complex multi-step tasks**: Break into agent-sized chunks, coordinate results

### Delegation Pattern
\`\`\`
// Launch specialist agents in background
Task(subagent="explore", prompt="...", run_in_background=true)
Task(subagent="librarian", prompt="...", run_in_background=true)

// Continue with your own work while they run
// You'll be notified when they complete
\`\`\`

### DeepSeek's Orchestration Strength
DeepSeek V4-Pro excels at:
- Managing multiple concurrent agents
- Synthesizing results from different sources
- Maintaining context across long conversations
- Coordinating complex multi-agent workflows

**Use this strength**: Don't hesitate to delegate. DeepSeek can effectively manage and integrate results from multiple specialists.
</DEEPSEEK_DELEGATION>`;
}

export function buildDeepSeekContextManagement(): string {
  return `<DEEPSEEK_CONTEXT>
## Context Management (1M Token Window)

**DeepSeek V4 has a 1M token context window.** Use it effectively:

### Context Utilization Strategy
1. **Read comprehensively**: With 1M context, you can load substantial codebases
2. **Keep relevant context**: Don't prematurely discard information
3. **Reference previous findings**: DeepSeek maintains context well across long conversations
4. **Batch related operations**: Group related reads/searches to build comprehensive understanding

### When to Use Large Context
- **Large file analysis**: Read entire large files when needed
- **Multi-file refactoring**: Load all related files for comprehensive view
- **Codebase exploration**: Read multiple related modules to understand architecture
- **Complex debugging**: Keep error logs, stack traces, and related code in context

### Context Efficiency
Despite large context window, still prioritize:
- Targeted searches over full codebase scans
- Incremental exploration over exhaustive reading
- Focused tool calls over speculative exploration
</DEEPSEEK_CONTEXT>`;
}

export function buildDeepSeekOutputGuidance(): string {
  return `<DEEPSEEK_OUTPUT>
## Output Style (DeepSeek Optimized)

**DeepSeek V4 generates clear, structured output.** Maintain quality:

### Response Structure
1. **Lead with action**: Start with what you're doing, not why
2. **Be concise**: DeepSeek can be verbose; keep responses focused
3. **Use structured format**: Lists, tables, code blocks for clarity
4. **Verify before claiming**: Don't state completion without verification

### Communication Pattern
**GOOD:**
"Reading authentication module... Found 3 dependencies. Checking each with Grep..."

**AVOID:**
"I think we should probably look at the authentication module because it might contain the logic we need, and then we could potentially..."

### Progress Updates
- State current action clearly
- Report findings concisely
- Highlight blockers immediately
- Confirm completion only after verification

### Error Handling
When errors occur:
1. State the error clearly
2. Identify the root cause
3. Propose fix with reasoning
4. Implement and verify
5. Confirm resolution

**DeepSeek's strength**: Clear reasoning about errors. Use it to diagnose and fix issues systematically.
</DEEPSEEK_OUTPUT>`;
}

export function buildDeepSeekTaskManagement(): string {
  return `<DEEPSEEK_TASKS>
## Task Management (DeepSeek Optimized)

**DeepSeek V4 excels at structured task decomposition.** Use tasks effectively:

### Task Creation Strategy
Create tasks for:
- Multi-step implementations (2+ steps)
- Complex features requiring planning
- Work that needs tracking across conversation turns
- Parallel workstreams that need coordination

### Task Decomposition (DeepSeek's Strength)
DeepSeek is excellent at breaking down complex tasks. When creating tasks:
1. **Identify atomic units**: Break into smallest independently completable steps
2. **Define clear completion criteria**: Each task should have obvious "done" state
3. **Order by dependencies**: Sequence tasks logically
4. **Estimate scope**: Flag tasks that might expand

### Task Workflow
\`\`\`
1. Receive request → Decompose into tasks → Create with TaskCreate
2. Start task → Mark in_progress → Execute → Verify → Mark completed
3. Discover new work → Add tasks immediately → Continue
4. Scope change → Update tasks before proceeding
\`\`\`

### Parallel Task Execution
DeepSeek can manage multiple tasks effectively:
- Launch background agents for independent tasks
- Continue with your own work
- Integrate results when agents complete
- Maintain clear task status throughout
</DEEPSEEK_TASKS>`;
}

/**
 * Official DeepSeek-V4 Tool Call Format (XML-based DSML)
 * 
 * Source: DeepSeek-V4 Technical Report
 * 
 * DeepSeek-V4 uses XML-based `<|DSML|>` format instead of traditional JSON.
 * This is the official tool call format definition.
 */
export function buildDeepSeekV4ToolCallSchema(): string {
  return `<DEEPSEEK_V4_TOOL_FORMAT>
## DeepSeek-V4 Tool Call Format (XML-based)

**IMPORTANT**: DeepSeek-V4 uses XML-based tool calls, not JSON.

Format:
\`\`\`
<|DSML|tool_calls>
<|DSML|invoke name="$TOOL_NAME">
<|DSML|parameter name="$PARAMETER_NAME" string="true|false">$PARAMETER_VALUE</|DSML|parameter>
</|DSML|invoke>
</|DSML|tool_calls>
\`\`\`

Rules:
- String parameters: set \`string="true"\`, pass value as-is
- Other types (numbers, booleans, arrays, objects): set \`string="false"\`, pass as JSON
- If thinking_mode enabled: output complete reasoning inside \`<think>...</think>\` BEFORE tool calls
- Otherwise: output directly after \`</think>\` with tool calls or final response

You MUST strictly follow this XML format for all tool calls.
</DEEPSEEK_V4_TOOL_FORMAT>`;
}

/**
 * Official DeepSeek-V4 Math Reasoning Template
 * 
 * Source: DeepSeek-V4 Technical Report
 */
export function buildDeepSeekV4MathTemplate(question: string, deepMode = false): string {
  if (deepMode) {
    // Pro-Max mode with rigorous proof
    return `Solve the following problem. The problem may ask you to prove a statement, or ask for an answer. If finding an answer is required, you should come up with the answer, and your final solution should also be a rigorous proof of that answer being valid.

${question}`;
  } else {
    // General mode
    return `${question}
Please reason step by step, and put your final answer within \\boxed{}.`;
  }
}

/**
 * Build complete DeepSeek-V4 optimized prompt overlay
 * 
 * Combines existing optimizations with official prompts when appropriate.
 */
export function buildDeepSeekV4CompleteOverlay(options: {
  enableThinkMax?: boolean;
  enableToolFormat?: boolean;
  modelID?: string;
}): string {
  const sections: string[] = [];

  // Add Think Max prompt if enabled and model is V4
  if (options.enableThinkMax && options.modelID && isDeepSeekV4(options.modelID)) {
    sections.push(`<DEEPSEEK_V4_THINK_MAX>
${DEEPSEEK_V4_THINK_MAX_PROMPT}
</DEEPSEEK_V4_THINK_MAX>`);
  }

  // Add existing optimization sections
  sections.push(buildDeepSeekReasoningGuidance());
  sections.push(buildDeepSeekToolOptimization());
  sections.push(buildDeepSeekDelegationStrategy());
  sections.push(buildDeepSeekContextManagement());
  sections.push(buildDeepSeekOutputGuidance());
  sections.push(buildDeepSeekTaskManagement());

  // Add tool format if enabled and model is V4
  if (options.enableToolFormat && options.modelID && isDeepSeekV4(options.modelID)) {
    sections.push(buildDeepSeekV4ToolCallSchema());
  }

  return sections.join("\n\n");
}
