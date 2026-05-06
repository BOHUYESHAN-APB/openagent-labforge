export const PRODUCT_DISPLAY_NAME = 'ExtendAI Lab' as const;
export const PACKAGE_NAME = 'extendai-lab' as const;
export const LEGACY_PACKAGE_NAMES = ['openagent-labforge'] as const;

export const CONFIG_BASENAME = 'extendai-lab' as const;
export const LEGACY_CONFIG_BASENAMES = ['openagent-labforge'] as const;

export const PLUGIN_STATE_DIR = 'extendai-lab' as const;
export const LEGACY_PLUGIN_STATE_DIRS = ['openagent-labforge'] as const;

export const SCHEMA_FILE_NAME = 'extendai-lab.schema.json' as const;
export const LEGACY_SCHEMA_FILE_NAMES = [
  'openagent-labforge.schema.json',
] as const;

export const LEGACY_NAME_FALLBACK_REMOVAL_TARGET = '1.0.16' as const;

export const SUPPORTED_PACKAGE_NAMES = [
  PACKAGE_NAME,
  ...LEGACY_PACKAGE_NAMES,
] as const;

export const SUPPORTED_CONFIG_BASENAMES = [
  CONFIG_BASENAME,
  ...LEGACY_CONFIG_BASENAMES,
] as const;

export const SUPPORTED_PLUGIN_STATE_DIRS = [
  PLUGIN_STATE_DIR,
  ...LEGACY_PLUGIN_STATE_DIRS,
] as const;

export function isSupportedPackageName(name: unknown): name is string {
  return (
    typeof name === 'string' && SUPPORTED_PACKAGE_NAMES.includes(name as never)
  );
}
