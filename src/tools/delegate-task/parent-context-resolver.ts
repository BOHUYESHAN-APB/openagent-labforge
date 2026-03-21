import type { ToolContextWithMetadata } from "./types"
import type { OpencodeClient } from "./types"
import type { ParentContext } from "./executor-types"
import { resolveMessageContext } from "../../features/hook-message-injector"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { log } from "../../shared/logger"
import { getMessageDir } from "../../shared/opencode-message-dir"
import {
  getSessionModel,
  getSessionModelLock,
  isSessionAutoModelRoutingEnabled,
} from "../../shared/session-model-state"

function normalizeParentModel(model?: {
  providerID?: string
  modelID?: string
  variant?: string
}): { providerID: string; modelID: string; variant?: string } | undefined {
  if (!model?.providerID || !model?.modelID) {
    return undefined
  }

  return {
    providerID: model.providerID,
    modelID: model.modelID,
    ...(model.variant ? { variant: model.variant } : {}),
  }
}

export function resolveInheritedParentModel(options: {
  lockedSessionModel?: { providerID?: string; modelID?: string; variant?: string }
  currentSessionModel?: { providerID?: string; modelID?: string; variant?: string }
  prevMessageModel?: { providerID?: string; modelID?: string; variant?: string }
  autoModelRoutingEnabled: boolean
}): { providerID: string; modelID: string; variant?: string } | undefined {
  if (options.autoModelRoutingEnabled) {
    return undefined
  }

  return normalizeParentModel(options.lockedSessionModel)
    ?? normalizeParentModel(options.currentSessionModel)
    ?? normalizeParentModel(options.prevMessageModel)
}

export async function resolveParentContext(
  ctx: ToolContextWithMetadata,
  client: OpencodeClient
): Promise<ParentContext> {
  const messageDir = getMessageDir(ctx.sessionID)
  const { prevMessage, firstMessageAgent } = await resolveMessageContext(
    ctx.sessionID,
    client,
    messageDir
  )

  const sessionAgent = getSessionAgent(ctx.sessionID)
  const lockedSessionModel = normalizeParentModel(getSessionModelLock(ctx.sessionID))
  const currentSessionModel = normalizeParentModel(getSessionModel(ctx.sessionID))
  const autoModelRoutingEnabled = isSessionAutoModelRoutingEnabled(ctx.sessionID)
  const parentAgent = ctx.agent ?? sessionAgent ?? firstMessageAgent ?? prevMessage?.agent
  const prevMessageModel = normalizeParentModel(prevMessage?.model)
  const parentModel = resolveInheritedParentModel({
    lockedSessionModel,
    currentSessionModel,
    prevMessageModel,
    autoModelRoutingEnabled,
  })

  log("[task] parentAgent resolution", {
    sessionID: ctx.sessionID,
    messageDir,
    ctxAgent: ctx.agent,
    sessionAgent,
    firstMessageAgent,
    prevMessageAgent: prevMessage?.agent,
    resolvedParentAgent: parentAgent,
    autoModelRoutingEnabled,
    lockedSessionModel,
    currentSessionModel,
    prevMessageModel,
    resolvedParentModel: parentModel,
  })

  return {
    sessionID: ctx.sessionID,
    messageID: ctx.messageID,
    agent: parentAgent,
    model: parentModel,
  }
}
