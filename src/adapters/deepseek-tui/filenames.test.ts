import { describe, expect, test } from 'bun:test';
import {
  buildDeepSeekCommandFileName,
  buildManagedMarkdownFileName,
  renderOwnershipMarker,
} from './index';

describe('DeepSeek-TUI adapter file naming', () => {
  test('uses .ol.md suffix for managed non-command markdown files', () => {
    expect(buildManagedMarkdownFileName('Engineer')).toBe('engineer.ol.md');
    expect(buildManagedMarkdownFileName('Visual QA')).toBe('visual-qa.ol.md');
  });

  test('uses ol- prefix for DeepSeek command files to preserve slash names', () => {
    expect(buildDeepSeekCommandFileName('engineer')).toBe('ol-engineer.md');
    expect(buildDeepSeekCommandFileName('ol-review')).toBe('ol-review.md');
  });

  test('renders ownership marker for safe uninstall checks', () => {
    const marker = renderOwnershipMarker({
      packageVersion: '1.0.8',
      adapterVersion: '0.1.0',
      fileId: 'commands/ol-engineer',
      sha256: 'abc123',
    });

    expect(marker).toContain('openagent-labforge-managed: true');
    expect(marker).toContain('adapter: deepseek-tui');
    expect(marker).toContain('fileId: commands/ol-engineer');
  });
});
