import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getLiteConfig, getLiteConfigJsonc } from '../cli/paths';

const DEFAULT_PLUGIN_CONFIG = {
  $schema: './openagent-labforge.schema.json',
};

export function ensureGlobalPluginConfigFile(): string {
  const jsonPath = getLiteConfig();
  const jsoncPath = getLiteConfigJsonc();

  if (existsSync(jsonPath)) return jsonPath;
  if (existsSync(jsoncPath)) return jsoncPath;

  mkdirSync(dirname(jsonPath), { recursive: true });
  const tmpPath = `${jsonPath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(DEFAULT_PLUGIN_CONFIG, null, 2)}\n`);
  renameSync(tmpPath, jsonPath);

  return jsonPath;
}
