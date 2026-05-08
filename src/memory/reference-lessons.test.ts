import { describe, expect, test } from 'bun:test';
import {
  getMemoryReferenceLesson,
  MEMORY_REFERENCE_LESSONS,
} from './reference-lessons';

describe('memory reference lessons', () => {
  test('covers all planned reference sources', () => {
    expect(MEMORY_REFERENCE_LESSONS.map((lesson) => lesson.source)).toEqual([
      'hermes',
      'agent-harness',
      'oh-my-codex',
      'oh-my-openagent',
    ]);
  });

  test('records explicit absorb and avoid boundaries', () => {
    const hermes = getMemoryReferenceLesson('hermes');
    expect(hermes?.absorb.some((item) => item.includes('curated'))).toBe(true);
    expect(
      hermes?.avoid.some((item) => item.includes('full Hermes runtime')),
    ).toBe(true);

    const openagent = getMemoryReferenceLesson('oh-my-openagent');
    expect(
      openagent?.avoid.some((item) => item.includes('license-restricted')),
    ).toBe(true);
  });
});
