import { log } from "../shared"

const DEFAULT_CAPTURE_TIMEOUT_MS = 1500
const DEFAULT_PRECOMPACT_TIMEOUT_MS = 2500
const DEFAULT_CONTEXT_MAX_CHARS = 12000

type CompactingHooks = {
  compactionTodoPreserver?: { capture: (sessionID: string) => Promise<void> }
  claudeCodeHooks?: {
    "experimental.session.compacting"?: (
      input: { sessionID: string },
      output: { context: string[] },
    ) => Promise<void>
  }
  compactionContextInjector?: (sessionID: string) => string
}

type CompactingHandlerOptions = {
  captureTimeoutMs?: number
  preCompactTimeoutMs?: number
  maxInjectedContextChars?: number
}

async function runWithTimeout(
  label: string,
  sessionID: string,
  timeoutMs: number,
  operation: () => Promise<void>,
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } catch (error) {
    log("[compacting-handler] Step skipped", {
      sessionID,
      step: label,
      error: String(error),
    })
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

function clampContext(context: string, sessionID: string, maxChars: number): string {
  if (context.length <= maxChars) {
    return context
  }

  log("[compacting-handler] Compaction context truncated", {
    sessionID,
    originalLength: context.length,
    maxChars,
  })

  return `${context.slice(0, maxChars)}\n\n[compaction-context truncated]`
}

export function createCompactingHandler(
  hooks: CompactingHooks,
  options: CompactingHandlerOptions = {},
): (
  input: { sessionID: string },
  output: { context: string[] },
) => Promise<void> {
  const captureTimeoutMs = options.captureTimeoutMs ?? DEFAULT_CAPTURE_TIMEOUT_MS
  const preCompactTimeoutMs = options.preCompactTimeoutMs ?? DEFAULT_PRECOMPACT_TIMEOUT_MS
  const maxInjectedContextChars =
    options.maxInjectedContextChars ?? DEFAULT_CONTEXT_MAX_CHARS

  return async (
    input: { sessionID: string },
    output: { context: string[] },
  ): Promise<void> => {
    if (hooks.compactionTodoPreserver?.capture) {
      await runWithTimeout(
        "compaction-todo-capture",
        input.sessionID,
        captureTimeoutMs,
        () => hooks.compactionTodoPreserver!.capture(input.sessionID),
      )
    }

    if (hooks.claudeCodeHooks?.["experimental.session.compacting"]) {
      await runWithTimeout(
        "claude-precompact",
        input.sessionID,
        preCompactTimeoutMs,
        () =>
          hooks.claudeCodeHooks!["experimental.session.compacting"]!(
            input,
            output,
          ),
      )
    }

    if (hooks.compactionContextInjector) {
      output.context.push(
        clampContext(
          hooks.compactionContextInjector(input.sessionID),
          input.sessionID,
          maxInjectedContextChars,
        ),
      )
    }
  }
}
