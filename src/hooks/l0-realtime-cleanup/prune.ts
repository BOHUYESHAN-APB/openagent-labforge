/**
 * L0 Realtime Cleanup - Prune Module
 * 
 * Phase 2: Modify messages based on marked tool IDs.
 * Inspired by DCP's prune.ts implementation.
 */

import type { SessionState } from "./state"
import type { MessageWithParts, PruneResult } from "./types"
import { log } from "../../shared/logger"

const PRUNED_TOOL_OUTPUT_REPLACEMENT = "[Output removed to save context - information superseded or no longer needed]"
const PRUNED_TOOL_ERROR_INPUT_REPLACEMENT = "[input removed due to failed tool call]"
const PRUNED_QUESTION_INPUT_REPLACEMENT = "[questions removed - see output for user's answers]"

/**
 * Phase 2: Modify messages based on marked tool IDs
 * 
 * This function directly modifies the messages array based on
 * tool IDs marked in state.prune.tools by Phase 1 strategies.
 */
export function pruneMessages(
  state: SessionState,
  messages: MessageWithParts[]
): PruneResult {
  let modifiedParts = 0
  let removedTokens = 0

  // Prune tool outputs
  const outputResult = pruneToolOutputs(state, messages)
  modifiedParts += outputResult.modifiedParts
  removedTokens += outputResult.removedTokens

  // Prune tool inputs (for specific tools like question)
  const inputResult = pruneToolInputs(state, messages)
  modifiedParts += inputResult.modifiedParts
  removedTokens += inputResult.removedTokens

  // Prune error tool inputs
  const errorResult = pruneToolErrors(state, messages)
  modifiedParts += errorResult.modifiedParts
  removedTokens += errorResult.removedTokens

  if (modifiedParts > 0) {
    log("[l0-prune] Modified messages", {
      modifiedParts,
      removedTokens,
      markedTools: state.prune.tools.size,
    })
  }

  return { modifiedParts, removedTokens }
}

/**
 * Prune tool outputs for completed tools
 */
function pruneToolOutputs(
  state: SessionState,
  messages: MessageWithParts[]
): PruneResult {
  let modifiedParts = 0
  let removedTokens = 0

  for (const msg of messages) {
    for (const part of msg.parts) {
      // Only process tool parts
      if (part.type !== "tool") continue
      
      // Only process marked tools
      if (!part.callID || !state.prune.tools.has(part.callID)) continue
      
      // Only process completed tools
      if (part.state?.status !== "completed") continue
      
      // Skip question, edit, write tools (preserve their outputs)
      if (part.tool === "question" || part.tool === "edit" || part.tool === "write") {
        continue
      }

      // Estimate removed tokens
      if (part.state.output && typeof part.state.output === "string") {
        removedTokens += estimateTokens(part.state.output)
      }

      // Replace output
      if (part.state) {
        part.state.output = PRUNED_TOOL_OUTPUT_REPLACEMENT
        modifiedParts++
      }
    }
  }

  return { modifiedParts, removedTokens }
}

/**
 * Prune tool inputs for question tool
 */
function pruneToolInputs(
  state: SessionState,
  messages: MessageWithParts[]
): PruneResult {
  let modifiedParts = 0
  let removedTokens = 0

  for (const msg of messages) {
    for (const part of msg.parts) {
      // Only process tool parts
      if (part.type !== "tool") continue
      
      // Only process marked tools
      if (!part.callID || !state.prune.tools.has(part.callID)) continue
      
      // Only process completed tools
      if (part.state?.status !== "completed") continue
      
      // Only process question tool
      if (part.tool !== "question") continue

      // Prune questions input
      if (part.state.input && typeof part.state.input === "object") {
        const input = part.state.input as Record<string, unknown>
        if (input.questions !== undefined) {
          // Estimate removed tokens
          if (typeof input.questions === "string") {
            removedTokens += estimateTokens(input.questions)
          } else if (Array.isArray(input.questions)) {
            removedTokens += estimateTokens(JSON.stringify(input.questions))
          }

          input.questions = PRUNED_QUESTION_INPUT_REPLACEMENT
          modifiedParts++
        }
      }
    }
  }

  return { modifiedParts, removedTokens }
}

/**
 * Prune tool inputs for error tools
 */
function pruneToolErrors(
  state: SessionState,
  messages: MessageWithParts[]
): PruneResult {
  let modifiedParts = 0
  let removedTokens = 0

  for (const msg of messages) {
    for (const part of msg.parts) {
      // Only process tool parts
      if (part.type !== "tool") continue
      
      // Only process marked tools
      if (!part.callID || !state.prune.tools.has(part.callID)) continue
      
      // Only process error tools
      if (part.state?.status !== "error") continue

      // Prune all string inputs for errored tools
      if (part.state.input && typeof part.state.input === "object") {
        const input = part.state.input as Record<string, unknown>
        for (const key of Object.keys(input)) {
          if (typeof input[key] === "string") {
            removedTokens += estimateTokens(input[key] as string)
            input[key] = PRUNED_TOOL_ERROR_INPUT_REPLACEMENT
            modifiedParts++
          }
        }
      }
    }
  }

  return { modifiedParts, removedTokens }
}

/**
 * Estimate token count from text (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}
