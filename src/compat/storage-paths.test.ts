import { describe, expect, test } from 'bun:test';
import { getCompatStoragePaths } from './storage-paths';

describe('compat storage paths', () => {
  test('builds isolated project and global paths per runtime', () => {
    const opencode = getCompatStoragePaths('D:/work/project', 'opencode');
    const codex = getCompatStoragePaths('D:/work/project', 'codex');

    expect(opencode.projectStateDir).toContain('.opencode');
    expect(opencode.runtimeStateDir).not.toBe(codex.runtimeStateDir);
    expect(opencode.runtimeLogDir).toContain('compat');
    expect(opencode.globalRuntimeDir).not.toBe(codex.globalRuntimeDir);
    expect(codex.globalRuntimeMemoryDir).toContain('codex');
  });
});
