/**
 * Compatibility stub for claude-code-agent-loader.
 * Replaces the full Claude model mapper with a pass-through.
 */
export function mapClaudeModelToOpenCode(
  model: string | undefined,
): { providerID: string; modelID: string } | undefined {
  if (!model) return undefined;
  const slashIndex = model.indexOf('/');
  if (slashIndex === -1) {
    return { providerID: 'openai', modelID: model };
  }
  return {
    providerID: model.slice(0, slashIndex),
    modelID: model.slice(slashIndex + 1),
  };
}
