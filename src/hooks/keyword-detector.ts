/**
 * Keyword Detector Hook
 *
 * Detects keywords in user input and injects system prompts.
 * Supports: ultrawork/ulw, search, analyze
 *
 * Key feature: System prompts are injected as SEPARATE messages,
 * not appended to user message. This prevents undo from bringing
 * system prompts back into the dialog box.
 */

import type { PluginInput } from "@opencode-ai/plugin"

const HOOK_NAME = "keyword-detector"

// ==========================================
// Keyword Patterns
// ==========================================

const KEYWORD_PATTERNS = {
  ultrawork: /\b(ultrawork|ulw)\b/i,
  search: /\b(search|搜索|查找)\b/i,
  analyze: /\b(analyze|分析|审查)\b/i,
} as const

type KeywordType = keyof typeof KEYWORD_PATTERNS

// ==========================================
// System Prompts
// ==========================================

const SYSTEM_PROMPTS: Record<KeywordType, string> = {
  ultrawork: `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - ULTRAWORK MODE]

You are in ULTRAWORK mode. This means:
1. Plan obsessively before acting
2. Delegate strategically to specialists
3. Verify completion of every task
4. Never stop until all work is done
5. Use todos to track progress

Available specialists:
- deep-worker: autonomous deep engineering tasks
- bio-worker: bioinformatics pipelines
- prometheus: strategic planning
- atlas: task execution coordination
- oracle: architecture consultation
- librarian: documentation search
- explore: codebase search
- reviewer: code review
- multimodal-looker: media analysis

Delegation pattern:
task(category="[category]", load_skills=[...], prompt="[detailed prompt]")
task(subagent_type="[agent]", load_skills=[], prompt="[detailed prompt]")`,

  search: `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - SEARCH MODE]

You are in SEARCH MODE. This means:
1. Use websearch, context7, grep_app for research
2. Fire multiple searches in parallel
3. Return evidence with sources
4. Be thorough but focused

Available tools:
- websearch: web search via Exa
- context7: library documentation
- grep_app: GitHub code search
- librarian: external documentation expert
- explore: codebase grep`,

  analyze: `[SYSTEM DIRECTIVE: OPENAGENT-LABFORGE - ANALYZE MODE]

You are in ANALYZE MODE. This means:
1. Read files thoroughly before answering
2. Use explore agent for codebase patterns
3. Use oracle for architecture questions
4. Provide detailed, evidence-based analysis
5. Support findings with file paths and line numbers

Available tools:
- explore: codebase grep (parallel friendly)
- oracle: architecture consultation
- multimodal-looker: PDF/image analysis
- lsp_diagnostics: type checking
- ast_grep_search: AST-aware search`,
}

// ==========================================
// State Management
// ==========================================

/**
 * Track processed messages to prevent duplicate injection on undo/replay.
 * Map<sessionID, messageFingerprint>
 */
const processedMessages = new Map<string, string>()

/**
 * Track which sessions have active keyword modes.
 * Map<sessionID, Set<KeywordType>>
 */
const activeKeywordModes = new Map<string, Set<KeywordType>>()

// ==========================================
// Helper Functions
// ==========================================

function extractPromptText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text ?? "")
    .join("\n")
    .trim()
}

function isSystemDirective(text: string): boolean {
  return text.includes("[SYSTEM DIRECTIVE:")
}

function detectKeywords(text: string): KeywordType[] {
  const detected: KeywordType[] = []

  for (const [type, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(type as KeywordType)
    }
  }

  return detected
}

function createMessageFingerprint(text: string): string {
  // Simple hash for deduplication
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

// ==========================================
// Hook Factory
// ==========================================

export function createKeywordDetectorHook(ctx: PluginInput) {
  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
        model?: { providerID: string; modelID: string }
        messageID?: string
      },
      output: {
        message: Record<string, unknown>
        parts: Array<{ type: string; text?: string; [key: string]: unknown }>
      }
    ): Promise<void> => {
      const promptText = extractPromptText(output.parts)

      // Skip system directives
      if (isSystemDirective(promptText)) {
        return
      }

      // Check for duplicate processing (undo/replay)
      const fingerprint = createMessageFingerprint(promptText)
      const lastProcessed = processedMessages.get(input.sessionID)

      if (lastProcessed === fingerprint) {
        return // Skip duplicate
      }

      // Detect keywords
      const detected = detectKeywords(promptText)

      if (detected.length === 0) {
        // No keywords detected, clear active modes
        activeKeywordModes.delete(input.sessionID)
        return
      }

      // Update fingerprint
      processedMessages.set(input.sessionID, fingerprint)

      // Update active modes
      activeKeywordModes.set(input.sessionID, new Set(detected))

      // Build combined system prompt
      const systemParts = detected.map((type) => SYSTEM_PROMPTS[type])
      const combinedPrompt = systemParts.join("\n\n---\n\n")

      // Inject as SEPARATE system message (not appended to user message)
      // This is the key design: undo won't bring system prompt back
      output.parts.unshift({
        type: "text",
        text: combinedPrompt,
        // Mark as system message for OpenCode
        role: "system",
      } as any)

      // Show toast notification
      const modeNames = detected.map((t) => t.toUpperCase()).join(", ")
      ctx.client.tui
        .showToast({
          body: {
            title: `${modeNames} Mode Activated`,
            message: `Detected keywords: ${detected.join(", ")}`,
            variant: "success" as const,
            duration: 3000,
          },
        })
        .catch(() => {})

      // Log
      console.log(`[${HOOK_NAME}] Detected ${detected.length} keywords`, {
        sessionID: input.sessionID,
        types: detected,
      })
    },

    // Cleanup on session delete
    event: async ({ event }: { event: { type: string; properties?: unknown } }) => {
      if (event.type === "session.deleted") {
        const props = event.properties as { info?: { id?: string } } | undefined
        const sessionId = props?.info?.id
        if (sessionId) {
          processedMessages.delete(sessionId)
          activeKeywordModes.delete(sessionId)
        }
      }
    },
  }
}

// ==========================================
// Exports
// ==========================================

export function getActiveKeywordModes(sessionID: string): Set<KeywordType> {
  return activeKeywordModes.get(sessionID) ?? new Set()
}

export function isUltraworkActive(sessionID: string): boolean {
  return getActiveKeywordModes(sessionID).has("ultrawork")
}
