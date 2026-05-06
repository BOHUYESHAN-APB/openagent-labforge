#!/usr/bin/env bun

import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BIO_SKILLS_CATALOG_FILE_NAME,
  buildBioSkillsCatalog,
} from '../src/bio-skills';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const bioSkillsRoot = join(rootDir, 'resources', 'bioSkills');

if (!existsSync(bioSkillsRoot)) {
  console.error(`Bio skills directory not found: ${bioSkillsRoot}`);
  process.exit(1);
}

const catalog = buildBioSkillsCatalog(bioSkillsRoot);
const outputPath = join(bioSkillsRoot, BIO_SKILLS_CATALOG_FILE_NAME);

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(
  `✅ Bio skills catalog written to ${outputPath} (${catalog.categoryCount} categories, ${catalog.skillCount} skills)`,
);
