/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test';
import { createModeDetectorHook } from './index';

describe('mode-detector hook', () => {
  test('search mode injects dependency-aware blocking/background guidance', async () => {
    const hook = createModeDetectorHook();
    await hook['chat.message'](
      {
        sessionID: 's1',
        agent: 'orchestrator',
        messages: [
          {
            role: 'user',
            parts: [{ type: 'text', text: 'find where auth is implemented' }],
          },
        ],
      },
      {},
    );

    const output = { system: ['base'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 's1' },
      output,
    );

    const prompt = output.system.join('\n');
    expect(prompt).toContain('[search-mode]');
    expect(prompt).toContain('BLOCKING specialist lane');
    expect(prompt).toContain('BACKGROUND specialist lane');
    expect(prompt).toContain('background=false');
    expect(prompt).toContain('background=true');
  });

  test('analyze mode injects dependency-gated blocking guidance', async () => {
    const hook = createModeDetectorHook();
    await hook['chat.message'](
      {
        sessionID: 's2',
        agent: 'orchestrator',
        messages: [
          {
            role: 'user',
            parts: [{ type: 'text', text: 'analyze why the build hangs' }],
          },
        ],
      },
      {},
    );

    const output = { system: ['base'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 's2' },
      output,
    );

    const prompt = output.system.join('\n');
    expect(prompt).toContain('[analyze-mode]');
    expect(prompt).toContain('Dependency-gated investigation stays BLOCKING');
    expect(prompt).toContain(
      'Independent investigation can run in the BACKGROUND',
    );
    expect(prompt).toContain('oracle');
  });

  test('planning text does not inject planner mode into main agent path', async () => {
    const hook = createModeDetectorHook();
    await hook['chat.message'](
      {
        sessionID: 's3',
        agent: 'orchestrator',
        messages: [
          {
            role: 'user',
            parts: [{ type: 'text', text: 'create a plan for this refactor' }],
          },
        ],
      },
      {},
    );

    const output = { system: ['base'] };
    await hook['experimental.chat.system.transform'](
      { sessionID: 's3' },
      output,
    );

    const prompt = output.system.join('\n');
    expect(prompt).not.toContain('[plan-mode]');
    expect(prompt).not.toContain('prometheus');
  });
});
