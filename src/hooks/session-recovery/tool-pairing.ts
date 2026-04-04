interface ToolUseLikePart {
  type: "tool_use"
  id: string
  name?: string
}

interface ToolResultLikePart {
  type: "tool_result"
  tool_use_id: string
}

interface MessagePartLike {
  type: string
  id?: string
  name?: string
  tool_use_id?: string
}

function normalizeToolType(type: string): string {
  return type === "tool" ? "tool_use" : type
}

export function collectToolUseParts(parts: MessagePartLike[]): ToolUseLikePart[] {
  return parts
    .map((part) => ({ ...part, type: normalizeToolType(part.type) }))
    .filter((part): part is ToolUseLikePart => {
      return part.type === "tool_use" && typeof part.id === "string" && part.id.length > 0
    })
}

export function collectToolResultUseIds(parts: MessagePartLike[]): Set<string> {
  const ids = new Set<string>()

  for (const part of parts) {
    if (normalizeToolType(part.type) !== "tool_result") continue
    if (typeof part.tool_use_id !== "string" || part.tool_use_id.length === 0) continue
    ids.add(part.tool_use_id)
  }

  return ids
}

export function collectMissingToolUseIds(parts: MessagePartLike[]): string[] {
  const toolUseParts = collectToolUseParts(parts)
  const resultUseIds = collectToolResultUseIds(parts)

  return toolUseParts
    .map((part) => part.id)
    .filter((id) => !resultUseIds.has(id))
}

export function collectMissingToolUses(parts: MessagePartLike[]): ToolUseLikePart[] {
  const toolUseParts = collectToolUseParts(parts)
  const missingIds = new Set(collectMissingToolUseIds(parts))
  return toolUseParts.filter((part) => missingIds.has(part.id))
}
