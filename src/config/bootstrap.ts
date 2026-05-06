import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  getExistingLiteConfigPath,
  getLiteConfig,
  getLiteConfigJsonc,
} from '../cli/paths';
import { SCHEMA_FILE_NAME } from './product';

const DEFAULT_PLUGIN_CONFIG = {
  $schema: `./${SCHEMA_FILE_NAME}`,
};

export function ensureGlobalPluginConfigFile(): string {
  const existingPath = getExistingLiteConfigPath();
  const jsonPath = getLiteConfig();
  const jsoncPath = getLiteConfigJsonc();

  if (existsSync(existingPath)) return existingPath;
  if (existsSync(jsonPath)) return jsonPath;
  if (existsSync(jsoncPath)) return jsoncPath;

  mkdirSync(dirname(jsonPath), { recursive: true });
  const tmpPath = `${jsonPath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(DEFAULT_PLUGIN_CONFIG, null, 2)}\n`);
  renameSync(tmpPath, jsonPath);

  return jsonPath;
}
