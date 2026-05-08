export type ConfigSourcePriority =
  | 'defaults'
  | 'user-global'
  | 'project'
  | 'runtime-profile'
  | 'cli';

export interface ConfigSource<T extends Record<string, unknown>> {
  priority: ConfigSourcePriority;
  label: string;
  config: Partial<T>;
}

export interface ConfigMergeConflict {
  path: string;
  previousSource: string;
  nextSource: string;
  previousValue: unknown;
  nextValue: unknown;
}

export interface ConfigMergeResult<T extends Record<string, unknown>> {
  config: Partial<T>;
  conflicts: ConfigMergeConflict[];
  sources: string[];
}

const PRIORITY_ORDER: ConfigSourcePriority[] = [
  'defaults',
  'user-global',
  'project',
  'runtime-profile',
  'cli',
];

const PRIORITY_WEIGHT = new Map(
  PRIORITY_ORDER.map((priority, index) => [priority, index]),
);

export function mergeConfigWithPriority<T extends Record<string, unknown>>(
  sources: readonly ConfigSource<T>[],
): ConfigMergeResult<T> {
  const ordered = [...sources].sort(
    (a, b) => getPriorityWeight(a.priority) - getPriorityWeight(b.priority),
  );
  const config: Record<string, unknown> = {};
  const sourceByPath = new Map<string, { label: string; value: unknown }>();
  const conflicts: ConfigMergeConflict[] = [];

  for (const source of ordered) {
    mergeInto(config, source.config, source.label, [], sourceByPath, conflicts);
  }

  return {
    config: config as Partial<T>,
    conflicts,
    sources: ordered.map((source) => source.label),
  };
}

function getPriorityWeight(priority: ConfigSourcePriority): number {
  return PRIORITY_WEIGHT.get(priority) ?? -1;
}

function mergeInto(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  label: string,
  path: string[],
  sourceByPath: Map<string, { label: string; value: unknown }>,
  conflicts: ConfigMergeConflict[],
): void {
  for (const [key, nextValue] of Object.entries(source)) {
    const nextPath = [...path, key];
    const pathKey = nextPath.join('.');
    const previousValue = target[key];

    if (isPlainObject(previousValue) && isPlainObject(nextValue)) {
      mergeInto(
        previousValue,
        nextValue,
        label,
        nextPath,
        sourceByPath,
        conflicts,
      );
      sourceByPath.set(pathKey, {
        label,
        value: cloneConfigValue(target[key]),
      });
      continue;
    }

    const previousSource = sourceByPath.get(pathKey);
    if (
      previousSource &&
      previousSource.label !== label &&
      !deepEqual(previousSource.value, nextValue)
    ) {
      conflicts.push({
        path: pathKey,
        previousSource: previousSource.label,
        nextSource: label,
        previousValue: previousSource.value,
        nextValue,
      });
    }

    target[key] = cloneConfigValue(nextValue);
    sourceByPath.set(pathKey, {
      label,
      value: cloneConfigValue(nextValue),
    });
    indexSourcePaths(pathKey, target[key], label, sourceByPath);
  }
}

function indexSourcePaths(
  path: string,
  value: unknown,
  label: string,
  sourceByPath: Map<string, { label: string; value: unknown }>,
): void {
  if (Array.isArray(value)) {
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    sourceByPath.set(nestedPath, {
      label,
      value: cloneConfigValue(nestedValue),
    });
    indexSourcePaths(nestedPath, nestedValue, label, sourceByPath);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function cloneConfigValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneConfigValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneConfigValue(item)]),
    );
  }
  return value;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
