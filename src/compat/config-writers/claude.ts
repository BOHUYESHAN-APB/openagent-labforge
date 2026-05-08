export interface ClaudeMcpServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  timeout?: number;
  enabled?: boolean;
  approval_mode?: string;
}

export interface ClaudeMcpMergeResult {
  content: string;
  changed: boolean;
  added: string[];
  updated: string[];
  removed: string[];
  warnings: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function mergeClaudeMcpServers(
  existingContent: string | undefined,
  nextServers: Record<string, ClaudeMcpServerEntry>,
  managedNames: string[] = [],
): ClaudeMcpMergeResult {
  const warnings: string[] = [];
  const added: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const baseContent = existingContent ?? '';
  const trimmed = baseContent.trim();

  let parsed: Record<string, unknown> = {};
  if (trimmed.length > 0) {
    try {
      const raw = JSON.parse(baseContent) as unknown;
      if (isRecord(raw)) {
        parsed = { ...raw };
      } else {
        warnings.push('Claude config must contain a JSON object.');
      }
    } catch (error) {
      return {
        content: baseContent,
        changed: false,
        added,
        updated,
        removed,
        warnings: [`Failed to parse Claude config JSON: ${String(error)}`],
      };
    }
  }

  const existingMcpServers = isRecord(parsed.mcpServers)
    ? { ...(parsed.mcpServers as Record<string, unknown>) }
    : {};

  const managed = new Set(managedNames);
  for (const name of Object.keys(nextServers)) {
    managed.add(name);
  }

  const nextMcpServers: Record<string, unknown> = {
    ...existingMcpServers,
  };

  for (const name of managed) {
    if (Object.hasOwn(nextServers, name)) {
      const nextValue = nextServers[name];
      if (Object.hasOwn(existingMcpServers, name)) {
        if (!deepEqual(existingMcpServers[name], nextValue)) {
          updated.push(name);
        }
      } else {
        added.push(name);
      }
      nextMcpServers[name] = nextValue;
    } else if (Object.hasOwn(nextMcpServers, name)) {
      delete nextMcpServers[name];
      removed.push(name);
    }
  }

  if (Object.keys(nextMcpServers).length > 0) {
    parsed.mcpServers = nextMcpServers;
  } else {
    delete parsed.mcpServers;
  }

  const nextContent = `${JSON.stringify(parsed, null, 2)}\n`;
  return {
    content: nextContent,
    changed: nextContent !== baseContent,
    added,
    updated,
    removed,
    warnings,
  };
}
