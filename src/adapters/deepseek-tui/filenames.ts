const MANAGED_MARKDOWN_SUFFIX = '.ol.md';
const COMMAND_PREFIX = 'ol-';

export function sanitizeAdapterFileId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function buildManagedMarkdownFileName(id: string): string {
  const sanitized = sanitizeAdapterFileId(id);

  if (!sanitized) {
    throw new Error('Adapter file id cannot be empty.');
  }

  return `${sanitized}${MANAGED_MARKDOWN_SUFFIX}`;
}

export function buildDeepSeekCommandFileName(commandName: string): string {
  const sanitized = sanitizeAdapterFileId(commandName).replace(/^\/+/, '');
  const prefixed = sanitized.startsWith(COMMAND_PREFIX)
    ? sanitized
    : `${COMMAND_PREFIX}${sanitized}`;

  if (prefixed === COMMAND_PREFIX) {
    throw new Error('DeepSeek command name cannot be empty.');
  }

  return `${prefixed}.md`;
}

export const deepSeekTuiFileNaming = {
  commandPrefix: COMMAND_PREFIX,
  managedMarkdownSuffix: MANAGED_MARKDOWN_SUFFIX,
} as const;
