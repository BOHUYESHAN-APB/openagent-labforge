export interface StructuredExecutionStatus {
  currentWave?: "complete" | "incomplete"
  agentOwnedRemaining?: "none" | "present"
  userOwnedPending?: "none" | "present"
  autoAction?: "stop" | "continue" | "ask-user"
}

function matchField(
  text: string,
  pattern: RegExp,
): string | undefined {
  const match = text.match(pattern)
  return match?.[1]?.trim().toLowerCase()
}

export function parseStructuredExecutionStatus(text: string): StructuredExecutionStatus | null {
  const currentWave = matchField(text, /current wave:\s*(complete|incomplete)/i)
  const agentOwnedRemaining = matchField(text, /agent-owned remaining work:\s*(none|present)/i)
  const userOwnedPending = matchField(text, /user-owned\/external pending:\s*(none|present)/i)
  const autoAction = matchField(text, /auto action:\s*(stop|continue|ask-user)/i)

  if (!currentWave && !agentOwnedRemaining && !userOwnedPending && !autoAction) {
    return null
  }

  return {
    ...(currentWave === "complete" || currentWave === "incomplete"
      ? { currentWave }
      : {}),
    ...(agentOwnedRemaining === "none" || agentOwnedRemaining === "present"
      ? { agentOwnedRemaining }
      : {}),
    ...(userOwnedPending === "none" || userOwnedPending === "present"
      ? { userOwnedPending }
      : {}),
    ...(autoAction === "stop" || autoAction === "continue" || autoAction === "ask-user"
      ? { autoAction }
      : {}),
  }
}
