import type { PluginInput } from "@opencode-ai/plugin"
import { isGptModel } from "../../agents/types"
import {
  getSessionAgent,
  resolveRegisteredAgentName,
  updateSessionAgent,
} from "../../features/claude-code-session-state"
import { log } from "../../shared"
import { getAgentConfigKey, getAgentDisplayName } from "../../shared/agent-display-names"

const TOAST_TITLE = "NEVER Use Hephaestus with Non-GPT"
const TOAST_MESSAGE = [
  "Hephaestus is designed exclusively for GPT models.",
  "Hephaestus with non-GPT models may be less stable depending on provider limits.",
  "Recommendation: for Claude/Kimi/GLM models, consider Sisyphus.",
].join("\n")
const SISYPHUS_DISPLAY = getAgentDisplayName("sisyphus")

type NoHephaestusNonGptHookOptions = {
  allowNonGptModel?: boolean
}

function showToast(ctx: PluginInput, sessionID: string): void {
  ctx.client.tui.showToast({
    body: {
      title: TOAST_TITLE,
      message: TOAST_MESSAGE,
      variant: "warning",
      duration: 10000,
    },
  }).catch((error) => {
    log("[no-hephaestus-non-gpt] Failed to show toast", {
      sessionID,
      error,
    })
  })
}

export function createNoHephaestusNonGptHook(
  ctx: PluginInput,
  options?: NoHephaestusNonGptHookOptions,
) {
  return {
    "chat.message": async (input: {
      sessionID: string
      agent?: string
      model?: { providerID: string; modelID: string }
      forceAgentModelRouting?: boolean
    }, output?: {
      message?: { agent?: string; [key: string]: unknown }
    }): Promise<void> => {
      const rawAgent = input.agent ?? getSessionAgent(input.sessionID) ?? ""
      const agentKey = getAgentConfigKey(rawAgent)
      const modelID = input.model?.modelID
      const allowNonGptModel = options?.allowNonGptModel === true

      if (agentKey === "hephaestus" && modelID && !isGptModel(modelID)) {
        showToast(ctx, input.sessionID)
        if (allowNonGptModel || !input.forceAgentModelRouting) {
          return
        }
        const sisyphusName = resolveRegisteredAgentName("sisyphus") ?? SISYPHUS_DISPLAY
        input.agent = sisyphusName
        if (output?.message) {
          output.message.agent = sisyphusName
        }
        updateSessionAgent(input.sessionID, sisyphusName)
      }
    },
  }
}
