import { createSystemDirective, SystemDirectiveTypes } from "../shared/system-directive"
import { getAgentConfigKey } from "../shared/agent-display-names"

type CompressionProfile = "engineering" | "bio"

type MessageWithParts = {
  info: {
    agent?: string
    role?: string
  }
  parts: Array<Record<string, unknown>>
}

function isBioAgent(agentName: string | undefined): boolean {
  const key = getAgentConfigKey(agentName ?? "")
  return key === "bio-autopilot" ||
    key === "bio-orchestrator" ||
    key === "bio-methodologist" ||
    key === "bio-pipeline-operator" ||
    key === "paper-evidence-synthesizer" ||
    key === "wet-lab-designer"
}

export function resolveCompressionProfile(messages: MessageWithParts[]): CompressionProfile {
  for (let index = messages.length - 1; index >= 0; index--) {
    const agent = messages[index].info.agent
    if (!agent) continue
    if (isBioAgent(agent)) return "bio"
  }
  return "engineering"
}

export function buildCompressionDirectiveText(args: {
  level: number
  profile: CompressionProfile
}): string {
  const { level, profile } = args
  const header = `${createSystemDirective(SystemDirectiveTypes.CONTEXT_WINDOW_MONITOR)}
[Labforge Compression Directive]`

  if (profile === "bio") {
    if (level >= 3) {
      return `${header}
- Profile: bioinformatics / academic
- Severe context debt detected.
- Finish the current biological checkpoint only.
- Do NOT open a new modality, dataset branch, literature sweep, or wet-lab branch in this session.
- Keep only the current execution checkpoint live in chat.
- Move durable context into local memory or project outputs:
  - execution note
  - evidence note
  - writing note
  - wet-lab next
- Do not restate broad paper synthesis or long interpretation history in chat.
- If the current checkpoint closes cleanly, prepare a checkpoint and ask whether to continue in a fresh session.`
    }

    return `${header}
- Profile: bioinformatics / academic
- Context debt is rising.
- Keep the current biological checkpoint narrow and reviewable.
- Do not reopen old literature or evidence branches unless they are directly required for the active checkpoint.
- Prefer local notes and durable result files over repeating long scientific context in chat.`
  }

  if (level >= 3) {
    return `${header}
- Profile: engineering
- Severe context debt detected.
- Finish the current implementation wave only.
- Do NOT open broad new refactors, research branches, or side investigations in this session.
- Keep only the active checkpoint live in chat.
- Prefer repo-local runtime memory and durable project files over restating long chat history.
- If the current wave closes cleanly, prepare a checkpoint and ask whether to continue in a fresh session.`
  }

  return `${header}
- Profile: engineering
- Context debt is rising.
- Keep the current wave narrow and reviewable.
- Avoid reopening old branches unless they directly unblock the active checkpoint.
- Prefer runtime memory and concrete files over replaying long history in chat.`
}
