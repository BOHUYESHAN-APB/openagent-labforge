import { afterEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getProjectImagesDir } from '../paths/plugin-paths';
import { processImageAttachments } from './image-hook';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'image-hook-'));
}

describe('processImageAttachments', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('stores stripped images under plugin-owned project state', () => {
    const workDir = makeTempDir();
    dirs.push(workDir);
    const logs: string[] = [];
    const imageData = Buffer.from('fake png bytes').toString('base64');
    const messages = [
      {
        info: { role: 'user', sessionID: 'session/with unsafe chars' },
        parts: [
          { type: 'text', text: 'inspect this figure' },
          {
            type: 'image',
            url: `data:image/png;base64,${imageData}`,
            filename: 'figure.png',
          },
        ],
      },
    ];

    processImageAttachments({
      messages,
      workDir,
      disabledAgents: new Set(),
      log: (message) => logs.push(message),
    });

    const imagesDir = getProjectImagesDir(workDir);
    const expectedSessionDir = join(imagesDir, 'session_with_unsafe_chars');
    const savedNotice = messages[0].parts.at(-1)?.text ?? '';

    expect(existsSync(imagesDir)).toBe(true);
    expect(savedNotice).toContain(expectedSessionDir);
    expect(savedNotice).toContain('Delegate to @observer');
    expect(messages[0].parts.some((part) => part.type === 'image')).toBe(false);
    expect(readFileSync(join(workDir, '.opencode', '.gitignore'), 'utf8')).toBe(
      '*\n',
    );
    expect(existsSync(join(workDir, '.opencode', 'images'))).toBe(false);
    expect(logs.some((message) => message.includes(imagesDir))).toBe(true);
  });

  test('leaves image parts untouched when observer is disabled', () => {
    const workDir = makeTempDir();
    dirs.push(workDir);
    const messages = [
      {
        info: { role: 'user', sessionID: 'session-1' },
        parts: [
          {
            type: 'image',
            url: `data:image/png;base64,${Buffer.from('png').toString('base64')}`,
            filename: 'figure.png',
          },
        ],
      },
    ];

    processImageAttachments({
      messages,
      workDir,
      disabledAgents: new Set(['observer']),
      log: () => undefined,
    });

    expect(messages[0].parts).toHaveLength(1);
    expect(messages[0].parts[0].type).toBe('image');
    expect(existsSync(getProjectImagesDir(workDir))).toBe(false);
  });
});
