import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getDocumentRelativePath,
  normalizeDocumentName,
  resolveDocumentPath,
  saveDocument,
} from './service';

describe('document output service', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'extendai-doc-output-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  test('saves markdown documents under kind-specific directories', () => {
    const result = saveDocument({
      workspaceRoot,
      kind: 'spec',
      name: 'Runtime Compatibility Spec',
      content: '# Spec\n',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.name).toBe('runtime-compatibility-spec');
    expect(result.relativePath).toBe(
      '.opencode/extendai-lab/specs/runtime-compatibility-spec.md',
    );
    expect(result.format).toBe('markdown');
    expect(existsSync(result.path)).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toBe('# Spec\n');
  });

  test('uses json extension for rollback manifests', () => {
    const result = saveDocument({
      workspaceRoot,
      kind: 'rollback-manifest',
      name: 'install rollback',
      content: '{"ok":true}',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.relativePath).toBe(
      '.opencode/extendai-lab/rollback-manifests/install-rollback.json',
    );
    expect(result.format).toBe('json');
  });

  test('rejects unsafe names and duplicate writes', () => {
    const unsafe = saveDocument({
      workspaceRoot,
      kind: 'handoff',
      name: '...',
      content: 'x',
    });
    const first = saveDocument({
      workspaceRoot,
      kind: 'handoff',
      name: 'same',
      content: 'first',
    });
    const duplicate = saveDocument({
      workspaceRoot,
      kind: 'handoff',
      name: 'same',
      content: 'second',
    });

    expect(unsafe.ok).toBe(false);
    if (!unsafe.ok) expect(unsafe.code).toBe('invalid-name');
    expect(first.ok).toBe(true);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.code).toBe('already-exists');
  });

  test('normalizes and resolves canonical document paths', () => {
    expect(normalizeDocumentName('Review Report.md')).toBe('review-report');
    expect(
      getDocumentRelativePath(
        workspaceRoot,
        'review-report',
        'Review Report.md',
      ),
    ).toBe('.opencode/extendai-lab/reviews/review-report.md');
    expect(
      resolveDocumentPath(workspaceRoot, 'review-report', 'report'),
    ).toEndWith(join('.opencode', 'extendai-lab', 'reviews', 'report.md'));
  });
});
