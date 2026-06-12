import { describe, expect, test } from 'bun:test';
import { createThinkingFloorHook } from './index';

function createOutput(options: Record<string, unknown> = {}) {
  return {
    temperature: 0.7,
    topP: 1,
    topK: 0,
    maxOutputTokens: undefined,
    options,
  };
}

describe('createThinkingFloorHook', () => {
  describe('basic enforcement', () => {
    test('enforces reasoningEffort floor for GPT-5 models', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({ reasoningEffort: 'medium' });

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      // GPT-5 supports high/xhigh/max, should upgrade to high
      expect(output.options.reasoningEffort).toBe('high');
    });

    test('does not downgrade if already above floor', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({ reasoningEffort: 'xhigh' });

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      // Should keep xhigh since it's above high
      expect(output.options.reasoningEffort).toBe('xhigh');
    });

    test('sets reasoningEffort when not present', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({});

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      expect(output.options.reasoningEffort).toBe('high');
    });

    test('does nothing when disabled', () => {
      const hook = createThinkingFloorHook({ enabled: false, floor: 'high' });
      const output = createOutput({ reasoningEffort: 'low' });

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      expect(output.options.reasoningEffort).toBe('low');
    });

    test('does nothing when no model ID', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({ reasoningEffort: 'low' });

      hook['chat.params']({ sessionID: 's1' }, output);

      expect(output.options.reasoningEffort).toBe('low');
    });
  });

  describe('DeepSeek models', () => {
    test('enforces high floor for DeepSeek models', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({});

      hook['chat.params'](
        { model: { id: 'deepseek/deepseek-chat' }, sessionID: 's1' },
        output,
      );

      // DeepSeek supports high/max, floor=high should give high
      expect(output.options.reasoningEffort).toBe('high');
    });

    test('enforces max floor for DeepSeek when floor=max', () => {
      const hook = createThinkingFloorHook({ floor: 'max' });
      const output = createOutput({});

      hook['chat.params'](
        { model: { id: 'deepseek/deepseek-chat' }, sessionID: 's1' },
        output,
      );

      expect(output.options.reasoningEffort).toBe('max');
    });
  });

  describe('Anthropic models', () => {
    test('enforces thinking config for Claude models', () => {
      const hook = createThinkingFloorHook({
        floor: 'high',
        minBudgetTokens: 16000,
      });
      const output = createOutput({});

      hook['chat.params'](
        { model: { id: 'anthropic/claude-sonnet-4-6' }, sessionID: 's1' },
        output,
      );

      // Claude models use thinking config, not reasoningEffort
      expect(output.options.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 16000,
      });
      // Should NOT set reasoningEffort for Claude
      expect(output.options.reasoningEffort).toBeUndefined();
    });

    test('upgrades thinking budget when below minimum', () => {
      const hook = createThinkingFloorHook({
        floor: 'high',
        minBudgetTokens: 16000,
      });
      const output = createOutput({
        thinking: { type: 'enabled', budgetTokens: 5000 },
      });

      hook['chat.params'](
        { model: { id: 'anthropic/claude-sonnet-4-6' }, sessionID: 's1' },
        output,
      );

      expect(output.options.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 16000,
      });
    });

    test('does not downgrade thinking budget when above minimum', () => {
      const hook = createThinkingFloorHook({
        floor: 'high',
        minBudgetTokens: 10000,
      });
      const output = createOutput({
        thinking: { type: 'enabled', budgetTokens: 32000 },
      });

      hook['chat.params'](
        { model: { id: 'anthropic/claude-sonnet-4-6' }, sessionID: 's1' },
        output,
      );

      // Should keep 32000 since it's above 10000
      expect(output.options.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 32000,
      });
    });

    test('enables thinking when type is disabled', () => {
      const hook = createThinkingFloorHook({
        floor: 'high',
        minBudgetTokens: 10000,
      });
      const output = createOutput({
        thinking: { type: 'disabled' },
      });

      hook['chat.params'](
        { model: { id: 'anthropic/claude-sonnet-4-6' }, sessionID: 's1' },
        output,
      );

      expect(output.options.thinking).toEqual({
        type: 'enabled',
        budgetTokens: 10000,
      });
    });
  });

  describe('OpenAI reasoning models', () => {
    test('enforces floor for o-series models', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({ reasoningEffort: 'medium' });

      hook['chat.params'](
        { model: { id: 'openai/o3' }, sessionID: 's1' },
        output,
      );

      // o3 supports none/minimal/low/medium/high, should upgrade to high
      expect(output.options.reasoningEffort).toBe('high');
    });
  });

  describe('custom floor levels', () => {
    test('respects custom floor level', () => {
      const hook = createThinkingFloorHook({ floor: 'max' });
      const output = createOutput({ reasoningEffort: 'high' });

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      // GPT-5 supports max, should upgrade from high to max
      expect(output.options.reasoningEffort).toBe('max');
    });

    test('floor=none does nothing', () => {
      const hook = createThinkingFloorHook({ floor: 'none' });
      const output = createOutput({ reasoningEffort: 'low' });

      hook['chat.params'](
        { model: { id: 'openai/gpt-5.4' }, sessionID: 's1' },
        output,
      );

      expect(output.options.reasoningEffort).toBe('low');
    });
  });

  describe('provider ID fallback', () => {
    test('uses providerID when id is not available', () => {
      const hook = createThinkingFloorHook({ floor: 'high' });
      const output = createOutput({});

      hook['chat.params'](
        { model: { providerID: 'openai' }, sessionID: 's1' },
        output,
      );

      // Should still enforce floor using providerID
      expect(output.options.reasoningEffort).toBeDefined();
    });
  });
});
