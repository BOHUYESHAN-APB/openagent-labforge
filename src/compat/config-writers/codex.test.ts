import { describe, expect, test } from 'bun:test';
import { mergeCodexMcpServers } from './codex';

describe('mergeCodexMcpServers', () => {
  test('appends a managed block for new registry entries', () => {
    const existing = 'model = "gpt-5"\n';
    const result = mergeCodexMcpServers(existing, {
      shared_context: {
        command: 'npx',
        args: ['shared-context-server'],
        env: { MODE: 'stdio' },
        timeout: 15,
      },
      webfetch: {
        url: 'http://localhost:8787',
        type: 'http',
      },
    });

    expect(result.changed).toBe(true);
    expect(result.added).toEqual(['shared_context', 'webfetch']);
    expect(result.skipped).toEqual([]);
    expect(result.content).toContain(
      '# BEGIN EXTENDAI LAB MANAGED MCP REGISTRY',
    );
    expect(result.content).toContain('[mcp_servers.shared_context]');
    expect(result.content).toContain('command = "npx"');
    expect(result.content).toContain('args = ["shared-context-server"]');
    expect(result.content).toContain('env = { MODE = "stdio" }');
    expect(result.content).toContain('startup_timeout_sec = 15');
    expect(result.content).toContain('[mcp_servers.webfetch]');
  });

  test('skips collisions with unmanaged existing mcp server names', () => {
    const existing = [
      'model = "gpt-5"',
      '',
      '[mcp_servers.shared_context]',
      'command = "existing"',
      '',
    ].join('\n');

    const result = mergeCodexMcpServers(existing, {
      shared_context: { command: 'npx' },
      webfetch: { url: 'http://localhost:8787' },
    });

    expect(result.added).toEqual(['webfetch']);
    expect(result.skipped).toEqual(['shared_context']);
    expect(result.content).toContain('command = "existing"');
    expect(result.content).toContain('[mcp_servers.webfetch]');
    expect(result.content).not.toContain('command = "npx"');
  });

  test('replaces old managed block and can remove it entirely', () => {
    const existing = [
      'model = "gpt-5"',
      '',
      '# BEGIN EXTENDAI LAB MANAGED MCP REGISTRY',
      '',
      '[mcp_servers.old_server]',
      'command = "old"',
      '',
      '# END EXTENDAI LAB MANAGED MCP REGISTRY',
      '',
    ].join('\n');

    const replaced = mergeCodexMcpServers(existing, {
      new_server: { command: 'new' },
    });
    expect(replaced.added).toEqual(['new_server']);
    expect(replaced.content).toContain('[mcp_servers.new_server]');
    expect(replaced.content).not.toContain('[mcp_servers.old_server]');

    const removed = mergeCodexMcpServers(replaced.content, {});
    expect(removed.changed).toBe(true);
    expect(removed.added).toEqual([]);
    expect(removed.skipped).toEqual([]);
    expect(removed.content).toBe('model = "gpt-5"\n');
  });
});
