import { describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getDeepSeekAdapterPaths,
  installDeepSeekAdapter,
  uninstallDeepSeekAdapter,
} from './install';

function makeTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'extendai-dstui-'));
}

describe('DeepSeek-TUI adapter install/uninstall', () => {
  test('installs minimal command pack and manifest', async () => {
    const root = makeTempRoot();
    const result = await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
    });
    const paths = getDeepSeekAdapterPaths(root);

    expect(result.writtenFiles).toContain(join('commands', 'ol-engineer.md'));
    expect(result.writtenFiles).toContain(join('commands', 'ol-bio.md'));
    expect(result.writtenFiles).toContain(
      join('skills', 'extendai-lab-scientific-rigor', 'SKILL.md'),
    );
    expect(existsSync(paths.manifestPath)).toBe(true);
    expect(existsSync(join(paths.commandsDir, 'ol-review.md'))).toBe(true);
    expect(
      existsSync(join(paths.skillsDir, 'extendai-lab-anti-overconfidence', 'SKILL.md')),
    ).toBe(true);

    const installed = readFileSync(join(paths.commandsDir, 'ol-engineer.md'), 'utf8');
    expect(installed).toContain('extendai-lab-managed: true');
    expect(installed).toContain('# ExtendAI Engineer');
  });

  test('dry-run does not write files', async () => {
    const root = makeTempRoot();
    const result = await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
      dryRun: true,
    });
    const paths = getDeepSeekAdapterPaths(root);

    expect(result.writtenFiles.length).toBe(7);
    expect(existsSync(paths.manifestPath)).toBe(false);
    expect(existsSync(join(paths.commandsDir, 'ol-engineer.md'))).toBe(false);
    expect(
      existsSync(join(paths.skillsDir, 'extendai-lab-scientific-rigor', 'SKILL.md')),
    ).toBe(false);
  });

  test('uninstall removes owned files but preserves modified files by default', async () => {
    const root = makeTempRoot();
    const paths = getDeepSeekAdapterPaths(root);

    await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
    });

    const bioCommand = join(paths.commandsDir, 'ol-bio.md');
    const reviewCommand = join(paths.commandsDir, 'ol-review.md');
    const rigorSkill = join(
      paths.skillsDir,
      'extendai-lab-scientific-rigor',
      'SKILL.md',
    );
    const modified = `${readFileSync(bioCommand, 'utf8')}\nuser edit\n`;
    writeFileSync(bioCommand, modified, 'utf8');

    const result = await uninstallDeepSeekAdapter({ targetRoot: root });

    expect(result.removedFiles).toContain(join('commands', 'ol-engineer.md'));
    expect(result.preservedFiles).toContain(join('commands', 'ol-bio.md'));
    expect(result.manifestRetained).toBe(true);
    expect(existsSync(bioCommand)).toBe(true);
    expect(existsSync(reviewCommand)).toBe(false);
    expect(existsSync(rigorSkill)).toBe(false);
    expect(existsSync(paths.manifestPath)).toBe(true);
  });

  test('can skip skill installation explicitly', async () => {
    const root = makeTempRoot();
    const paths = getDeepSeekAdapterPaths(root);

    const result = await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
      installSkills: false,
    });

    expect(result.writtenFiles).toContain(join('commands', 'ol-engineer.md'));
    expect(result.writtenFiles).not.toContain(
      join('skills', 'extendai-lab-scientific-rigor', 'SKILL.md'),
    );
    expect(
      existsSync(join(paths.skillsDir, 'extendai-lab-scientific-rigor', 'SKILL.md')),
    ).toBe(false);
  });

  test('preserves existing tracked skill entries when reinstall skips skills', async () => {
    const root = makeTempRoot();
    const paths = getDeepSeekAdapterPaths(root);

    await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
    });

    await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
      installSkills: false,
    });

    const manifest = JSON.parse(readFileSync(paths.manifestPath, 'utf8')) as {
      files: Array<{ relativePath: string }>;
    };

    expect(manifest.files.some((file) => file.relativePath === join('skills', 'extendai-lab-scientific-rigor', 'SKILL.md'))).toBe(true);
  });

  test('force uninstall keeps backup directory instead of deleting it', async () => {
    const root = makeTempRoot();
    const paths = getDeepSeekAdapterPaths(root);

    await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
    });

    const engineerCommand = join(paths.commandsDir, 'ol-engineer.md');
    writeFileSync(engineerCommand, `${readFileSync(engineerCommand, 'utf8')}\nforced edit\n`, 'utf8');

    const result = await uninstallDeepSeekAdapter({
      targetRoot: root,
      force: true,
    });

    expect(result.backupFiles.length).toBeGreaterThan(0);
    expect(result.manifestRetained).toBe(false);
    expect(existsSync(paths.manifestPath)).toBe(false);
    expect(existsSync(paths.backupDir)).toBe(true);
  });

  test('does not track preserved unowned conflicts in the manifest', async () => {
    const root = makeTempRoot();
    const paths = getDeepSeekAdapterPaths(root);
    const conflictingCommand = join(paths.commandsDir, 'ol-engineer.md');

    mkdirSync(paths.commandsDir, { recursive: true });
    writeFileSync(conflictingCommand, '# user-owned command\n', 'utf8');

    const result = await installDeepSeekAdapter({
      targetRoot: root,
      packageVersion: '1.0.12',
    });

    expect(result.preservedFiles).toContain(join('commands', 'ol-engineer.md'));

    const manifest = JSON.parse(readFileSync(paths.manifestPath, 'utf8')) as {
      files: Array<{ relativePath: string }>;
    };

    expect(
      manifest.files.some(
        (file) => file.relativePath === join('commands', 'ol-engineer.md'),
      ),
    ).toBe(false);
  });
});
