import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { PACKAGE_NAME, PRODUCT_DISPLAY_NAME } from '../../config/product';
import {
  buildDeepSeekCommandFileName,
  sanitizeAdapterFileId,
} from './filenames';
import {
  createEmptyDeepSeekManifest,
  type DeepSeekInstalledFile,
  type DeepSeekInstallManifest,
  renderOwnershipMarker,
} from './manifest';

const ADAPTER_NAME = 'deepseek-tui' as const;
const ADAPTER_VERSION = '0.1.0' as const;
const MANIFEST_FILE_NAME = 'install-manifest.json' as const;

type ManagedCommandId = 'engineer' | 'bio' | 'plan' | 'review';
type ManagedSkillId =
  | 'extendai-lab-scientific-rigor'
  | 'extendai-lab-anti-overconfidence'
  | 'extendai-lab-bio-research-design';

interface ManagedCommandTemplate {
  id: ManagedCommandId;
  title: string;
  body: string;
}

interface ManagedSkillTemplate {
  id: ManagedSkillId;
  description: string;
  body: string;
}

export interface DeepSeekAdapterPaths {
  root: string;
  commandsDir: string;
  skillsDir: string;
  dataDir: string;
  backupDir: string;
  manifestPath: string;
}

export interface DeepSeekInstallOptions {
  targetRoot?: string;
  packageVersion: string;
  installSkills?: boolean;
  dryRun?: boolean;
  force?: boolean;
  installedAt?: string;
}

export interface DeepSeekUninstallOptions {
  targetRoot?: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface DeepSeekAdapterActionResult {
  targetRoot: string;
  manifestPath: string;
  writtenFiles: string[];
  removedFiles: string[];
  preservedFiles: string[];
  skippedFiles: string[];
  backupFiles: string[];
  dryRun: boolean;
  manifestRetained: boolean;
}

interface ResolvedManagedFile {
  kind: DeepSeekInstalledFile['kind'];
  fileId: string;
  relativePath: string;
  absolutePath: string;
  content: string;
  sha256: string;
}

function getDefaultDeepSeekRoot(): string {
  const home = process.env.HOME || process.env.USERPROFILE;

  if (!home) {
    throw new Error(
      'Unable to determine home directory for DeepSeek-TUI root.',
    );
  }

  return join(home, '.deepseek');
}

export function getDeepSeekAdapterPaths(
  targetRoot?: string,
): DeepSeekAdapterPaths {
  const root = targetRoot ?? getDefaultDeepSeekRoot();
  const dataDir = join(root, PACKAGE_NAME);

  return {
    root,
    commandsDir: join(root, 'commands'),
    skillsDir: join(root, 'skills'),
    dataDir,
    backupDir: join(dataDir, 'backups'),
    manifestPath: join(dataDir, MANIFEST_FILE_NAME),
  };
}

function computeSha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function buildCommandTemplates(): ManagedCommandTemplate[] {
  return [
    {
      id: 'engineer',
      title: 'ExtendAI Engineer',
      body: [
        `You are using ${PRODUCT_DISPLAY_NAME} on DeepSeek-TUI through a minimal command adapter.`,
        '',
        'Default stance:',
        '- behave like the engineering main expert;',
        '- keep changes surgical;',
        '- ask when the request is ambiguous;',
        '- define success criteria before implementation;',
        '- if the task is mainly biological science, say so and recommend the bio command.',
        '',
        'Operational notes:',
        '- DeepSeek-TUI is not running a first-class runtime plugin here;',
        '- use locally available tools/skills/MCP only;',
        '- do not assume visual inspection unless a real vision path exists.',
      ].join('\n'),
    },
    {
      id: 'bio',
      title: 'ExtendAI Bio Analyst',
      body: [
        `You are using ${PRODUCT_DISPLAY_NAME} bio workflow on DeepSeek-TUI through a minimal command adapter.`,
        '',
        'Default stance:',
        '- use a biology-first lens, but avoid tunnel vision;',
        '- separate observation, interpretation, hypothesis, and speculation;',
        '- propose validation and next-step experiments when appropriate;',
        '- if the problem is mainly engineering, say so and recommend the engineer command.',
        '',
        'Current scope:',
        '- prefer existing bioinformatics / experimental-design / clinical-biostatistics skills;',
        '- chemistry-heavy work should currently stay in chemoinformatics-style reasoning, not a separate exposed chemistry agent.',
      ].join('\n'),
    },
    {
      id: 'plan',
      title: 'ExtendAI Planner',
      body: [
        `You are using ${PRODUCT_DISPLAY_NAME} planning workflow on DeepSeek-TUI through a minimal command adapter.`,
        '',
        'Default stance:',
        '- plan first, do not rush into execution;',
        '- make assumptions explicit;',
        '- keep plans concrete and verifiable;',
        '- if requirements are unclear, ask targeted questions.',
      ].join('\n'),
    },
    {
      id: 'review',
      title: 'ExtendAI Review',
      body: [
        `You are using ${PRODUCT_DISPLAY_NAME} review workflow on DeepSeek-TUI through a minimal command adapter.`,
        '',
        'Default stance:',
        '- review for correctness, scope fidelity, maintainability, and confidence calibration;',
        '- do not rubber-stamp;',
        '- explicitly call out uncertainty and missing validation.',
      ].join('\n'),
    },
  ];
}

function buildSkillTemplates(): ManagedSkillTemplate[] {
  return [
    {
      id: 'extendai-lab-scientific-rigor',
      description:
        'Reusable scientific rigor discipline for separating facts, interpretations, hypotheses, uncertainty, and validation steps.',
      body: [
        '---',
        'name: extendai-lab-scientific-rigor',
        'description: Apply scientific rigor by separating observation, interpretation, hypothesis, speculation, and validation planning.',
        '---',
        '',
        `This skill is installed by ${PRODUCT_DISPLAY_NAME}'s minimal DeepSeek-TUI adapter.`,
        '',
        'Use it when a task involves biological reasoning, chemistry overlap, experimental design, result interpretation, or scientific review.',
        '',
        'Core rules:',
        '- separate observation, interpretation, hypothesis, and speculation;',
        '- state the evidence basis for meaningful claims;',
        '- name the main uncertainty source;',
        '- propose the next validation step when claims are not directly established;',
        '- distinguish exploratory findings from supported conclusions.',
      ].join('\n'),
    },
    {
      id: 'extendai-lab-anti-overconfidence',
      description:
        'Reusable anti-overconfidence discipline for calibrated claims and explicit pushback on scientific overreach.',
      body: [
        '---',
        'name: extendai-lab-anti-overconfidence',
        'description: Reduce false certainty, calibrate claims, and push back on scientific overreach from either the model or the user framing.',
        '---',
        '',
        `This skill is installed by ${PRODUCT_DISPLAY_NAME}'s minimal DeepSeek-TUI adapter.`,
        '',
        'Use it when a task risks overstating evidence, certainty, mechanism, or validation strength.',
        '',
        'Core rules:',
        '- do not present uncertain interpretation as settled fact;',
        '- explicitly identify when the user framing is scientifically incomplete or overstated;',
        '- calibrate claim strength to the evidence actually shown;',
        '- explain what stronger evidence would raise confidence.',
      ].join('\n'),
    },
    {
      id: 'extendai-lab-bio-research-design',
      description:
        'Small research-design helper for bio-analyst style work: research questions, hypotheses, and validation ladders.',
      body: [
        '---',
        'name: extendai-lab-bio-research-design',
        'description: Frame biological questions, structure hypotheses, and design validation ladders without rigid expert tunnel vision.',
        '---',
        '',
        `This skill is installed by ${PRODUCT_DISPLAY_NAME}'s minimal DeepSeek-TUI adapter.`,
        '',
        'Use it for biological study design, question framing, hypothesis structuring, and validation planning.',
        '',
        'Checklist:',
        '- define the biological question and primary objective;',
        '- separate observation from working hypothesis;',
        '- identify controls, confounders, and likely failure modes;',
        '- define a validation ladder: sanity check, replication, orthogonal validation, scope test;',
        '- recommend the shortest next experiment or analysis that would most improve confidence.',
      ].join('\n'),
    },
  ];
}

function renderCommandFile(
  template: ManagedCommandTemplate,
  packageVersion: string,
): ResolvedManagedFile {
  const commandFileName = buildDeepSeekCommandFileName(template.id);
  const fileId = `commands/${sanitizeAdapterFileId(template.id)}`;
  const provisionalContent = [template.title, '', template.body].join('\n');
  const provisionalHash = computeSha256(provisionalContent);
  const marker = renderOwnershipMarker({
    packageVersion,
    adapterVersion: ADAPTER_VERSION,
    fileId,
    sha256: provisionalHash,
  });
  const finalContent = `${marker}# ${template.title}\n\n${template.body}\n`;

  return {
    kind: 'command',
    fileId,
    relativePath: join('commands', commandFileName),
    absolutePath: '',
    content: finalContent,
    sha256: computeSha256(finalContent),
  };
}

function renderSkillFile(
  template: ManagedSkillTemplate,
  packageVersion: string,
): ResolvedManagedFile {
  const skillDirName = sanitizeAdapterFileId(template.id);
  const fileId = `skills/${skillDirName}`;
  const provisionalHash = computeSha256(template.body);
  const marker = renderOwnershipMarker({
    packageVersion,
    adapterVersion: ADAPTER_VERSION,
    fileId,
    sha256: provisionalHash,
  });
  const finalContent = `${marker}${template.body}\n`;

  return {
    kind: 'skill',
    fileId,
    relativePath: join('skills', skillDirName, 'SKILL.md'),
    absolutePath: '',
    content: finalContent,
    sha256: computeSha256(finalContent),
  };
}

function mergeTrackedFiles(
  existingManifest: DeepSeekInstallManifest | null,
  nextEntries: DeepSeekInstalledFile[],
): DeepSeekInstalledFile[] {
  const nextByPath = new Map(
    nextEntries.map((entry) => [entry.relativePath, entry]),
  );
  const merged: DeepSeekInstalledFile[] = [];
  const seen = new Set<string>();

  for (const existing of existingManifest?.files ?? []) {
    const replacement = nextByPath.get(existing.relativePath);
    if (replacement) {
      merged.push(replacement);
      seen.add(existing.relativePath);
      continue;
    }

    merged.push(existing);
    seen.add(existing.relativePath);
  }

  for (const entry of nextEntries) {
    if (seen.has(entry.relativePath)) continue;
    merged.push(entry);
  }

  return merged;
}

function hasOwnershipMarker(content: string, fileId: string): boolean {
  return (
    content.includes(`${PACKAGE_NAME}-managed: true`) &&
    content.includes(`adapter: ${ADAPTER_NAME}`) &&
    content.includes(`fileId: ${fileId}`)
  );
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function ensureParentDir(filePath: string, dryRun: boolean): void {
  if (dryRun) return;
  mkdirSync(dirname(filePath), { recursive: true });
}

function backupExistingFile(
  sourcePath: string,
  backupDir: string,
  relativePath: string,
  dryRun: boolean,
): string {
  const safeRelative = relativePath.replace(/[\\/]+/g, '__');
  const backupPath = join(backupDir, `${safeRelative}.bak`);

  if (!dryRun) {
    mkdirSync(dirname(backupPath), { recursive: true });
    writeFileSync(backupPath, readFileSync(sourcePath));
  }

  return backupPath;
}

function buildManifestFileEntry(
  file: ResolvedManagedFile,
): DeepSeekInstalledFile {
  return {
    kind: file.kind,
    relativePath: file.relativePath,
    source: `deepseek-tui:${file.fileId}`,
    sha256: file.sha256,
    previousSha256: null,
    owned: true,
    conflictPolicy: 'replace-if-owned',
  };
}

export async function installDeepSeekAdapter(
  options: DeepSeekInstallOptions,
): Promise<DeepSeekAdapterActionResult> {
  const paths = getDeepSeekAdapterPaths(options.targetRoot);
  const commandFiles = buildCommandTemplates().map((template) => {
    const rendered = renderCommandFile(template, options.packageVersion);

    return {
      ...rendered,
      absolutePath: join(paths.root, rendered.relativePath),
    };
  });
  const skillFiles =
    options.installSkills !== false
      ? buildSkillTemplates().map((template) => {
          const rendered = renderSkillFile(template, options.packageVersion);

          return {
            ...rendered,
            absolutePath: join(paths.root, rendered.relativePath),
          };
        })
      : [];
  const files = [...commandFiles, ...skillFiles];

  const result: DeepSeekAdapterActionResult = {
    targetRoot: paths.root,
    manifestPath: paths.manifestPath,
    writtenFiles: [],
    removedFiles: [],
    preservedFiles: [],
    skippedFiles: [],
    backupFiles: [],
    dryRun: options.dryRun ?? false,
    manifestRetained: false,
  };

  const existingManifest = readJsonFile<DeepSeekInstallManifest>(
    paths.manifestPath,
  );
  const nextManifestEntries: DeepSeekInstalledFile[] = [];

  const manifest = createEmptyDeepSeekManifest({
    packageVersion: options.packageVersion,
    adapterVersion: ADAPTER_VERSION,
    targetRoot: paths.root,
    installedAt: options.installedAt,
  });

  for (const file of files) {
    const existing = (() => {
      try {
        return readFileSync(file.absolutePath, 'utf8');
      } catch {
        return null;
      }
    })();

    if (existing !== null) {
      const existingHash = computeSha256(existing);

      if (existingHash === file.sha256) {
        nextManifestEntries.push(buildManifestFileEntry(file));
        result.skippedFiles.push(file.relativePath);
        continue;
      }

      const owned = hasOwnershipMarker(existing, file.fileId);

      if (!owned && !options.force) {
        result.preservedFiles.push(file.relativePath);
        continue;
      }

      if (!owned || options.force) {
        const backupPath = backupExistingFile(
          file.absolutePath,
          paths.backupDir,
          file.relativePath,
          result.dryRun,
        );
        result.backupFiles.push(backupPath);
      }
    }

    ensureParentDir(file.absolutePath, result.dryRun);
    if (!result.dryRun) {
      writeFileSync(file.absolutePath, file.content, 'utf8');
    }
    nextManifestEntries.push(buildManifestFileEntry(file));
    result.writtenFiles.push(file.relativePath);
  }

  manifest.files = mergeTrackedFiles(existingManifest, nextManifestEntries);

  if (!result.dryRun) {
    mkdirSync(dirname(paths.manifestPath), { recursive: true });
    writeFileSync(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return result;
}

export async function uninstallDeepSeekAdapter(
  options: DeepSeekUninstallOptions,
): Promise<DeepSeekAdapterActionResult> {
  const paths = getDeepSeekAdapterPaths(options.targetRoot);
  const manifest = readJsonFile<DeepSeekInstallManifest>(paths.manifestPath);
  const result: DeepSeekAdapterActionResult = {
    targetRoot: paths.root,
    manifestPath: paths.manifestPath,
    writtenFiles: [],
    removedFiles: [],
    preservedFiles: [],
    skippedFiles: [],
    backupFiles: [],
    dryRun: options.dryRun ?? false,
    manifestRetained: false,
  };

  if (!manifest) {
    return result;
  }

  for (const file of manifest.files) {
    const absolutePath = join(paths.root, file.relativePath);
    const existing = (() => {
      try {
        return readFileSync(absolutePath, 'utf8');
      } catch {
        return null;
      }
    })();

    if (existing === null) {
      result.skippedFiles.push(file.relativePath);
      continue;
    }

    const currentHash = computeSha256(existing);
    const owned = hasOwnershipMarker(
      existing,
      file.source.replace('deepseek-tui:', ''),
    );

    if (owned && currentHash === file.sha256) {
      if (!result.dryRun) {
        unlinkSync(absolutePath);
      }
      result.removedFiles.push(file.relativePath);
      continue;
    }

    if (options.force) {
      const backupPath = backupExistingFile(
        absolutePath,
        paths.backupDir,
        file.relativePath,
        result.dryRun,
      );
      result.backupFiles.push(backupPath);
      if (!result.dryRun) {
        unlinkSync(absolutePath);
      }
      result.removedFiles.push(file.relativePath);
      continue;
    }

    result.preservedFiles.push(file.relativePath);
  }

  const shouldRetainManifest = result.preservedFiles.length > 0;
  result.manifestRetained = shouldRetainManifest;

  if (!result.dryRun && !shouldRetainManifest) {
    unlinkSync(paths.manifestPath);
    if (result.backupFiles.length === 0) {
      try {
        rmSync(paths.dataDir, { recursive: true, force: false });
      } catch {
        // keep data dir if backups remain or directory is not empty
      }
    }
  }

  return result;
}
