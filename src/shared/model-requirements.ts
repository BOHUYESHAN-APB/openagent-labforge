export type FallbackEntry = {
  providers: string[];
  model: string;
  variant?: string; // Entry-specific variant (e.g., GPT→high, Opus→max)
};

export type ModelRequirement = {
  fallbackChain: FallbackEntry[];
  variant?: string; // Default variant (used when entry doesn't specify one)
  requiresModel?: string; // If set, only activates when this model is available (fuzzy match)
  requiresAnyModel?: boolean; // If true, requires at least ONE model in fallbackChain to be available (or empty availability treated as unavailable)
  requiresProvider?: string[]; // If set, only activates when any of these providers is connected
};

export const AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  sisyphus: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (best cost-performance ratio, T0-level)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "max",
      },
      // Priority 2: Claude Opus 4.6 (highest performance)
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
    requiresAnyModel: true,
  },
  hephaestus: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (best for deep coding tasks)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "medium",
      },
      {
        providers: ["openai", "venice", "opencode"],
        model: "gpt-5.3-codex",
        variant: "medium",
      },
      { providers: ["github-copilot"], model: "gpt-5.4", variant: "medium" },
    ],
    requiresProvider: ["deepseek", "openai", "github-copilot", "venice", "opencode"],
  },
  oracle: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (excellent for architecture and planning)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "high",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  librarian: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Flash (fast and cost-effective for documentation)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-flash",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
  },
  explore: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Flash (fast exploration with 1M context)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-flash",
      },
      { providers: ["github-copilot"], model: "grok-code-fast-1" },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["anthropic", "opencode"], model: "claude-haiku-4-5" },
      { providers: ["opencode"], model: "gpt-5-nano" },
    ],
  },
  wase: {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (best for autonomous engineering)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "max",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle" },
    ],
    requiresAnyModel: true,
  },
  "github-scout": {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Flash (fast GitHub exploration)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-flash",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "medium",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
    ],
  },
  "tech-scout": {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (excellent for technical research)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
    ],
  },
  "article-writer": {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (excellent for writing)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "medium",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "medium",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "scientific-writer": {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (excellent for scientific writing)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "high",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "bio-autopilot": {
    fallbackChain: [
      // Priority 1: DeepSeek V4-Pro (excellent for bioinformatics)
      {
        providers: ["deepseek", "opencode"],
        model: "deepseek-v4-pro",
        variant: "high",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
    requiresAnyModel: true,
  },
  "bio-orchestrator": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "multimodal-looker": {
    fallbackChain: [
      {
        providers: ["openai", "opencode"],
        model: "gpt-5.4",
        variant: "medium",
      },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["zai-coding-plan"], model: "glm-4.6v" },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5-nano",
      },
    ],
  },
  "bio-methodologist": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "wet-lab-designer": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "bio-pipeline-operator": {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.3-codex",
        variant: "medium",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
    ],
  },
  "paper-evidence-synthesizer": {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  prometheus: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
      },
    ],
  },
  metis: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  momus: {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "xhigh",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  atlas: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4", variant: "medium" },
    ],
  },
  /* SWARM SYSTEM - DISABLED 2026-04-23
  "swarm-coordinator": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
  },
  "swarm-worker": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-haiku-4-5",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "gpt-5-nano" },
    ],
  },
  "swarm-specialist": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-4o",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
      },
    ],
  },
  */
};

export const CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  "visual-engineering": {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  ultrabrain: {
    fallbackChain: [
      {
        providers: ["openai", "opencode"],
        model: "gpt-5.3-codex",
        variant: "xhigh",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
    ],
  },
  deep: {
    fallbackChain: [
      {
        providers: ["openai", "opencode"],
        model: "gpt-5.3-codex",
        variant: "medium",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
    ],
    requiresModel: "gpt-5.3-codex",
  },
  artistry: {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3.1-pro",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.4" },
    ],
    requiresModel: "gemini-3.1-pro",
  },
  quick: {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-haiku-4-5",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      { providers: ["opencode"], model: "gpt-5-nano" },
    ],
  },
  "unspecified-low": {
    fallbackChain: [
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
      {
        providers: ["openai", "opencode"],
        model: "gpt-5.3-codex",
        variant: "medium",
      },
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
    ],
  },
  "unspecified-high": {
    fallbackChain: [
      {
        providers: ["openai", "github-copilot", "opencode"],
        model: "gpt-5.4",
        variant: "high",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-opus-4-6",
        variant: "max",
      },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      {
        providers: [
          "opencode",
          "moonshotai",
          "moonshotai-cn",
          "firmware",
          "ollama-cloud",
          "aihubmix",
        ],
        model: "kimi-k2.5",
      },
    ],
  },
  writing: {
    fallbackChain: [
      {
        providers: ["google", "github-copilot", "opencode"],
        model: "gemini-3-flash",
      },
      {
        providers: ["anthropic", "github-copilot", "opencode"],
        model: "claude-sonnet-4-6",
      },
    ],
  },
};
