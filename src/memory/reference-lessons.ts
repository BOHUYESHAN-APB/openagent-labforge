export type MemoryReferenceSource =
  | 'hermes'
  | 'agent-harness'
  | 'oh-my-codex'
  | 'oh-my-openagent';

export interface MemoryReferenceLesson {
  source: MemoryReferenceSource;
  themes: string[];
  absorb: string[];
  avoid: string[];
}

export const MEMORY_REFERENCE_LESSONS: MemoryReferenceLesson[] = [
  {
    source: 'hermes',
    themes: ['curated memory', 'searchable history', 'cache stability'],
    absorb: [
      'Keep durable memory small and curated instead of replaying full history.',
      'Separate persistent memory snapshots from long-tail searchable session history.',
      'Prefer cache-stable prompt prefixes and avoid rewriting frozen memory mid-session.',
    ],
    avoid: [
      'Do not clone the full Hermes runtime or gateway as a dependency.',
      'Do not let memory grow without review, bounds, or delete/rollback controls.',
    ],
  },
  {
    source: 'agent-harness',
    themes: ['instincts', 'evaluation', 'lifecycle persistence'],
    absorb: [
      'Use lifecycle checkpoints like SessionStart, PreCompact, and Stop as memory boundaries.',
      'Track confidence, provenance, and scope before promoting durable behavior.',
      'Pair learning with eval/baseline concepts instead of silent self-modification.',
    ],
    avoid: [
      'Do not copy a monolithic harness wholesale into ExtendAI Lab.',
      'Do not auto-promote project-local lessons into global behavior without evidence.',
    ],
  },
  {
    source: 'oh-my-codex',
    themes: ['codex plugin layout', 'local helpers', 'conservative setup'],
    absorb: [
      'Use Codex plugin manifest plus skills/MCP/app layout as the first renderer target.',
      'Treat native helpers as optional leaf accelerators, not the main orchestration path.',
      'Keep native Codex setup behind explicit install plans and backups.',
    ],
    avoid: [
      'Do not move durable state into native helper binaries.',
      'Do not bypass TypeScript install/rollback flow with unmanaged native setup.',
    ],
  },
  {
    source: 'oh-my-openagent',
    themes: ['architecture reference', 'license boundary'],
    absorb: [
      'Study installer/doctor/config patterns as architectural references only.',
      'Keep host-neutral memory and compatibility layers explicit instead of tightly coupling to one runtime.',
    ],
    avoid: [
      'Do not copy license-restricted implementation or prompt text.',
      'Do not treat OpenAgent-specific runtime internals as portable defaults.',
    ],
  },
];

export function getMemoryReferenceLesson(
  source: MemoryReferenceSource,
): MemoryReferenceLesson | undefined {
  return MEMORY_REFERENCE_LESSONS.find((lesson) => lesson.source === source);
}
