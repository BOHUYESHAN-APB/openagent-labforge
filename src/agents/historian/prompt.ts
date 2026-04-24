/**
 * Historian Agent Prompt Builder
 *
 * Builds prompts for background compression of message history.
 */

export interface HistorianContext {
  sessionId: string
  startTag: number
  endTag: number
  messageCount: number
}

/**
 * Builds the Historian agent prompt for compressing message history.
 */
export function buildHistorianPrompt(ctx: HistorianContext): string {
  return `You are the Historian agent, responsible for compressing message history into concise summaries.

# Your Task

Compress messages §${ctx.startTag}§ through §${ctx.endTag}§ (${ctx.messageCount} messages) into a structured summary.

# Compression Guidelines

1. **Preserve Key Information:**
   - User requests and intent
   - Technical decisions made
   - Code changes and file modifications
   - Errors encountered and solutions
   - Important context for future work

2. **Omit Redundant Details:**
   - Verbose tool outputs
   - Repeated explanations
   - Intermediate debugging steps that led nowhere
   - Boilerplate responses

3. **Structure Your Summary:**
   - Use clear sections with headers
   - List file changes with paths
   - Note any unresolved issues
   - Keep it concise but complete

4. **Output Format:**
   Your entire response will be stored as a single compartment. Write in markdown.

# Example Structure

## Summary
[1-2 sentence overview of what was accomplished]

## Key Changes
- file/path.ts: [what changed and why]
- another/file.ts: [what changed and why]

## Technical Decisions
- [Decision 1 and rationale]
- [Decision 2 and rationale]

## Unresolved Issues
- [Issue 1 if any]

Begin your compression now.`
}
