import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { type BioSkillMetadata, loadCategorySkills } from './loader';

export interface BioSkillCategory {
  name: string;
  path: string;
  skillCount: number;
  sampleSkills?: string[];
  toolTypes?: string[];
  primaryTools?: string[];
}

export interface BioSkillCatalogSkillSummary {
  name: string;
  description: string;
  filePath: string;
  toolType?: string;
  primaryTool?: string;
}

export interface BioSkillCatalogRecord extends BioSkillCategory {
  skills: BioSkillCatalogSkillSummary[];
}

export interface BioSkillCatalogFile {
  generatedAt: string;
  categoryCount: number;
  skillCount: number;
  categories: BioSkillCatalogRecord[];
}

export const BIO_SKILLS_CATALOG_FILE_NAME = 'catalog.json';

/**
 * Scans bioSkills repository and returns category catalog (not full skills)
 */
export function scanBioSkillsCatalog(repoPath: string): BioSkillCategory[] {
  const generatedCatalog = readGeneratedBioSkillsCatalog(repoPath);
  if (generatedCatalog) {
    return generatedCatalog.categories.map((category) => ({
      name: category.name,
      path: category.path,
      skillCount: category.skillCount,
      sampleSkills: category.sampleSkills,
      toolTypes: category.toolTypes,
      primaryTools: category.primaryTools,
    }));
  }

  if (!existsSync(repoPath)) {
    return [];
  }

  const categories: BioSkillCategory[] = [];

  try {
    const entries = readdirSync(repoPath);

    for (const entry of entries) {
      const fullPath = join(repoPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Count SKILL.md files in this category
        const skillCount = countSkillFiles(fullPath);
        if (skillCount > 0) {
          const metadata = loadCategorySkills(fullPath, entry);
          categories.push({
            name: entry,
            path: fullPath,
            skillCount,
            sampleSkills: metadata
              .map((skill) => skill.name)
              .sort((a, b) => a.localeCompare(b))
              .slice(0, 5),
            toolTypes: Array.from(
              new Set(
                metadata
                  .map((skill) => skill.toolType)
                  .filter((value): value is string => Boolean(value)),
              ),
            ).sort(),
            primaryTools: Array.from(
              new Set(
                metadata
                  .map((skill) => skill.primaryTool)
                  .filter((value): value is string => Boolean(value)),
              ),
            ).sort(),
          });
        }
      }
    }
  } catch {
    // Ignore scan errors
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildBioSkillsCatalog(repoPath: string): BioSkillCatalogFile {
  if (!existsSync(repoPath)) {
    return {
      generatedAt: new Date().toISOString(),
      categoryCount: 0,
      skillCount: 0,
      categories: [],
    };
  }

  const categories: BioSkillCatalogRecord[] = [];

  try {
    for (const entry of readdirSync(repoPath)) {
      const fullPath = join(repoPath, entry);
      const stat = statSync(fullPath);
      if (!stat.isDirectory()) {
        continue;
      }

      const metadata = loadCategorySkills(fullPath, entry);
      if (metadata.length === 0) {
        continue;
      }

      categories.push(buildCategoryRecord(entry, fullPath, metadata));
    }
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      categoryCount: 0,
      skillCount: 0,
      categories: [],
    };
  }

  categories.sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    categoryCount: categories.length,
    skillCount: categories.reduce(
      (sum, category) => sum + category.skillCount,
      0,
    ),
    categories,
  };
}

export function readGeneratedBioSkillsCatalog(
  repoPath: string,
): BioSkillCatalogFile | null {
  const catalogPath = join(repoPath, BIO_SKILLS_CATALOG_FILE_NAME);
  if (!existsSync(catalogPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      readFileSync(catalogPath, 'utf8'),
    ) as Partial<BioSkillCatalogFile>;
    if (!Array.isArray(parsed.categories)) {
      return null;
    }

    const categories = parsed.categories
      .filter(isCatalogRecord)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      generatedAt:
        typeof parsed.generatedAt === 'string'
          ? parsed.generatedAt
          : new Date(0).toISOString(),
      categoryCount:
        typeof parsed.categoryCount === 'number'
          ? parsed.categoryCount
          : categories.length,
      skillCount:
        typeof parsed.skillCount === 'number'
          ? parsed.skillCount
          : categories.reduce((sum, category) => sum + category.skillCount, 0),
      categories,
    };
  } catch {
    return null;
  }
}

function buildCategoryRecord(
  categoryName: string,
  categoryPath: string,
  metadata: BioSkillMetadata[],
): BioSkillCatalogRecord {
  const sortedMetadata = [...metadata].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    name: categoryName,
    path: categoryPath,
    skillCount: sortedMetadata.length,
    sampleSkills: sortedMetadata.map((skill) => skill.name).slice(0, 5),
    toolTypes: Array.from(
      new Set(
        sortedMetadata
          .map((skill) => skill.toolType)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort(),
    primaryTools: Array.from(
      new Set(
        sortedMetadata
          .map((skill) => skill.primaryTool)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort(),
    skills: sortedMetadata.map((skill) => ({
      name: skill.name,
      description: skill.description,
      filePath: skill.filePath,
      toolType: skill.toolType,
      primaryTool: skill.primaryTool,
    })),
  };
}

function isCatalogRecord(value: unknown): value is BioSkillCatalogRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<BioSkillCatalogRecord>;
  return (
    typeof record.name === 'string' &&
    typeof record.path === 'string' &&
    typeof record.skillCount === 'number' &&
    Array.isArray(record.skills)
  );
}

function countSkillFiles(dirPath: string): number {
  let count = 0;

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        count += countSkillFiles(fullPath);
      } else if (entry === 'SKILL.md') {
        count++;
      }
    }
  } catch {
    // Ignore errors
  }

  return count;
}
