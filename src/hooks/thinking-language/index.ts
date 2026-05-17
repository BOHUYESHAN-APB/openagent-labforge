/**
 * Thinking Language Hook
 *
 * Injects language preference into the system prompt for all models. Optimizes
 * for token economics:
 * - Chinese models (deepseek/glm/kimi/mimo/qwen/doubao/minimax) → Chinese thinking
 * - Foreign models (claude/gpt/gemini/grok) → English thinking
 *
 * Uses two hooks in coordination:
 * 1. messages.transform → detect user language, store in session map
 * 2. system.transform → inject language instruction based on detected language
 */

// Chinese model providers
const CN_PROVIDER_PATTERNS = [
  'deepseek',
  'glm',
  'zhipu',
  'kimi',
  'moonshot',
  'mimo',
  'xiaomi',
  'qwen',
  'tongyi',
  'doubao',
  'bytedance',
  'minimax',
] as const;

// Foreign model providers
const FOREIGN_PROVIDER_PATTERNS = [
  'claude',
  'anthropic',
  'gpt',
  'openai',
  'gemini',
  'google',
  'grok',
  'xai',
  'mistral',
  'cohere',
  'llama',
  'meta',
] as const;

const THINKING_LANGUAGE_MARKER = '[THINKING_LANGUAGE_INJECTED]';

function isChineseProvider(model: string): boolean {
  return CN_PROVIDER_PATTERNS.some((p) =>
    model.toLowerCase().includes(p),
  );
}

function isForeignProvider(model: string): boolean {
  return FOREIGN_PROVIDER_PATTERNS.some((p) =>
    model.toLowerCase().includes(p),
  );
}

function isPrimarilyChinese(text: string): boolean {
  if (!text) return false;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && chineseChars / totalChars > 0.3;
}

export function createThinkingLanguageHook() {
  // Session-level language detection state
  const userLanguageBySession = new Map<string, 'zh' | 'en'>();
  const modelBySession = new Map<string, string>();

  return {
    // Hook 1: Detect user language from messages
    'experimental.chat.messages.transform': async (
      _input: Record<string, never>,
      output: { messages: unknown[] },
    ) => {
      const typed = output as {
        messages: Array<{
          info: { role: string; sessionID?: string };
          parts: Array<{ type: string; text?: string }>;
        }>;
      };

      for (const msg of typed.messages) {
        if (msg.info.role !== 'user') continue;

        const sessionID = msg.info.sessionID;
        if (!sessionID) continue;

        // Already detected for this session
        if (userLanguageBySession.has(sessionID)) continue;

        const text = msg.parts
          .filter((p) => p.type === 'text' && p.text)
          .map((p) => p.text)
          .join(' ');

        if (text) {
          userLanguageBySession.set(
            sessionID,
            isPrimarilyChinese(text) ? 'zh' : 'en',
          );
        }
      }
    },

    // Hook 2: Capture model from chat.params
    'chat.params': async (
      input: { model?: { providerID?: string; id?: string }; sessionID?: string },
      _output: unknown,
    ) => {
      const modelId =
        input.model?.id || input.model?.providerID;
      if (modelId && input.sessionID) {
        modelBySession.set(input.sessionID, modelId);
      }
    },

    // Hook 3: Inject thinking language into system prompt
    'experimental.chat.system.transform': async (
      input: { sessionID?: string },
      output: { system: string[] },
    ) => {
      const sessionID = input.sessionID;
      const combinedSystem = output.system.join('\n');

      // Already injected
      if (combinedSystem.includes(THINKING_LANGUAGE_MARKER)) return;

      // Detect language
      const userLang = sessionID
        ? userLanguageBySession.get(sessionID)
        : undefined;

      if (userLang !== 'zh') return; // Non-Chinese user → no injection

      // Chinese user → decide based on model
      const model = sessionID
        ? modelBySession.get(sessionID)
        : undefined;

      if (model && isForeignProvider(model)) {
        // Foreign model → English thinking for cost efficiency
        output.system.push(
          `${THINKING_LANGUAGE_MARKER}\n\n` +
            '<thinking_language_preference>\n' +
            'Please think and reason in English. English tokens are most cost-effective for this model.\n' +
            'Your thinking summary (reasoning_summary) shown to the user MUST also be in English.\n' +
            '</thinking_language_preference>',
        );
      } else if (!model || isChineseProvider(model)) {
        // Chinese model (or unknown) → Chinese thinking
        output.system.push(
          `${THINKING_LANGUAGE_MARKER}\n\n` +
            '<thinking_language_preference>\n' +
            '请用中文进行思考和推理。中文思考对当前模型 token 成本最低。\n' +
            '展示给用户的思考总结（reasoning_summary）也必须使用中文。\n' +
            '</thinking_language_preference>',
        );
      }
    },
  };
}
