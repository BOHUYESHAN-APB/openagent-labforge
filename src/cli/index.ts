#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { PACKAGE_NAME, PRODUCT_DISPLAY_NAME } from '../config/product';
import {
  installDeepSeekAdapter,
  uninstallDeepSeekAdapter,
} from '../adapters/deepseek-tui';
import { install } from './install';
import { getGeneratedPresetNames, isGeneratedPresetName } from './providers';
import type { BooleanArg, InstallArgs } from './types';

function parseArgs(args: string[]): InstallArgs {
  const result: InstallArgs = {
    target: 'opencode',
    tui: true,
    skills: 'yes',
  };

  for (const arg of args) {
    if (arg === 'dstui' || arg === 'deepseek-tui') {
      result.target = 'dstui';
    } else if (arg === '--no-tui') {
      result.tui = false;
    } else if (arg.startsWith('--skills=')) {
      result.skills = arg.split('=')[1] as BooleanArg;
    } else if (arg.startsWith('--preset=')) {
      const preset = arg.split('=')[1];
      if (!isGeneratedPresetName(preset)) {
        console.error(
          `Unsupported preset: ${preset}. Available presets: ${getGeneratedPresetNames().join(', ')}`,
        );
        process.exit(1);
      }
      result.preset = preset;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--reset') {
      result.reset = true;
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg.startsWith('--target-root=')) {
      result.targetRoot = arg.split('=')[1];
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
${PRODUCT_DISPLAY_NAME} installer

Usage: bunx ${PACKAGE_NAME} install [OPTIONS]
       bunx ${PACKAGE_NAME} install dstui [OPTIONS]
       bunx ${PACKAGE_NAME} uninstall dstui [OPTIONS]

Options:
  --skills=yes|no        Install recommended and bundled skills (default: yes)
  --preset=<name>        Active generated config preset (default: openai)
  --no-tui               Non-interactive mode
  --dry-run              Simulate install without writing files
  --reset                Force overwrite of existing configuration
  --force                Force replacement/removal of managed adapter files
  --target-root=<path>   Override DeepSeek-TUI root (default: ~/.deepseek)
  -h, --help             Show this help message

Available presets: ${getGeneratedPresetNames().join(', ')}

The installer generates OpenAI and OpenCode Go presets by default.
OpenAI is active unless --preset selects another generated preset.
For the full config reference, see docs/configuration.md.

Examples:
  bunx ${PACKAGE_NAME} install
  bunx ${PACKAGE_NAME} install --no-tui --skills=yes
  bunx ${PACKAGE_NAME} install --preset=opencode-go
  bunx ${PACKAGE_NAME} install dstui --dry-run
  bunx ${PACKAGE_NAME} uninstall dstui
  bunx ${PACKAGE_NAME} install --reset
`);
}

async function readCurrentPackageVersion(): Promise<string> {
  try {
    const raw = await readFile(new URL('../../package.json', import.meta.url), 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || '0.0.0-dev';
  } catch {
    return '0.0.0-dev';
  }
}

function printDeepSeekActionSummary(
  action: 'install' | 'uninstall',
  result: Awaited<ReturnType<typeof installDeepSeekAdapter>>,
): void {
  console.log();
  console.log(
    `${PRODUCT_DISPLAY_NAME} DeepSeek-TUI ${action === 'install' ? 'Install' : 'Uninstall'}`,
  );
  console.log('='.repeat(38));
  console.log(`Target root: ${result.targetRoot}`);
  console.log(`Manifest: ${result.manifestPath}`);
  console.log(`Manifest retained: ${result.manifestRetained ? 'yes' : 'no'}`);
  console.log(`Dry run: ${result.dryRun ? 'yes' : 'no'}`);
  console.log();

  const sections: Array<[string, string[]]> = [
    ['Written', result.writtenFiles],
    ['Removed', result.removedFiles],
    ['Preserved', result.preservedFiles],
    ['Skipped', result.skippedFiles],
    ['Backups', result.backupFiles],
  ];

  for (const [label, entries] of sections) {
    console.log(`${label}: ${entries.length}`);
    for (const entry of entries) {
      console.log(`  - ${entry}`);
    }
  }

  console.log();
  console.log(
    'Current scope: minimal command pack plus a small rigor/research-design skill pack. MCP/hooks/runtime integration are planned later.',
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'install') {
    const hasSubcommand = args[0] === 'install';
    const installArgs = parseArgs(args.slice(hasSubcommand ? 1 : 0));

    if (installArgs.target === 'dstui') {
      const packageVersion = await readCurrentPackageVersion();
      const result = await installDeepSeekAdapter({
        targetRoot: installArgs.targetRoot,
        packageVersion,
        installSkills: installArgs.skills !== 'no',
        dryRun: installArgs.dryRun,
        force: installArgs.force,
      });
      printDeepSeekActionSummary('install', result);
      process.exit(0);
    }

    const exitCode = await install(installArgs);
    process.exit(exitCode);
  } else if (args[0] === 'uninstall') {
    const uninstallArgs = parseArgs(args.slice(1));

    if (uninstallArgs.target !== 'dstui') {
      console.error('Only `uninstall dstui` is currently supported.');
      process.exit(1);
    }

    const result = await uninstallDeepSeekAdapter({
      targetRoot: uninstallArgs.targetRoot,
      dryRun: uninstallArgs.dryRun,
      force: uninstallArgs.force,
    });
    printDeepSeekActionSummary('uninstall', result);
    process.exit(0);
  } else if (args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(0);
  } else {
    console.error(`Unknown command: ${args[0]}`);
    console.error('Run with --help for usage information');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
