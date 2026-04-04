#!/usr/bin/env node
// bin/openagent-labforge.js
// Wrapper script that detects platform and spawns the correct binary

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPlatformPackageCandidates, getBinaryPath } from "./platform.js";

const require = createRequire(import.meta.url);
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function getCorePackageVersion() {
  const pkg = readJson(join(CURRENT_DIR, "..", "package.json"));
  return typeof pkg?.version === "string" ? pkg.version : null;
}

function getPlatformPackageVersion(pkg) {
  try {
    const pkgJsonPath = require.resolve(`${pkg}/package.json`);
    const parsed = readJson(pkgJsonPath);
    return typeof parsed?.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

function resolveBunCommand() {
  const envBun = process.env.BUN || process.env.BUN_PATH;
  if (envBun && existsSync(envBun)) {
    return envBun;
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA || join(process.env.USERPROFILE || "", "AppData", "Roaming");
    const localAppData = process.env.LOCALAPPDATA || join(process.env.USERPROFILE || "", "AppData", "Local");
    const candidates = [
      join(appData, "npm", "bun.cmd"),
      join(appData, "npm", "bun.exe"),
      join(localAppData, "bun", "bin", "bun.exe"),
      "bun.cmd",
      "bun.exe",
      "bun",
    ];

    for (const candidate of candidates) {
      if (!candidate.includes("\\") && !candidate.includes("/")) {
        return candidate;
      }
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return "bun";
}

function runJsCliFallback() {
  const cliPath = join(CURRENT_DIR, "..", "dist", "cli", "index.js");
  const bunCommand = resolveBunCommand();
  const result = spawnSync(bunCommand, [cliPath, ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`\nopenagent-labforge: Failed to execute JS CLI fallback.`);
    console.error(`Error: ${result.error.message}\n`);
    process.exit(2);
  }

  if (result.signal) process.exit(getSignalExitCode(result.signal));
  process.exit(result.status ?? 1);
}

function getLibcFamily() {
  if (process.platform !== "linux") return undefined;
  try {
    const detectLibc = require("detect-libc");
    return detectLibc.familySync();
  } catch {
    return null;
  }
}

function supportsAvx2() {
  if (process.arch !== "x64") return null;
  if (process.env.OPENAGENT_LABFORGE_FORCE_BASELINE === "1") return false;

  if (process.platform === "linux") {
    try {
      const cpuInfo = readFileSync("/proc/cpuinfo", "utf8").toLowerCase();
      return cpuInfo.includes("avx2");
    } catch {
      return null;
    }
  }

  if (process.platform === "darwin") {
    const probe = spawnSync("sysctl", ["-n", "machdep.cpu.leaf7_features"], { encoding: "utf8" });
    if (probe.error || probe.status !== 0) return null;
    return probe.stdout.toUpperCase().includes("AVX2");
  }

  return null;
}

function getSignalExitCode(signal) {
  const signalCodeByName = { SIGINT: 2, SIGILL: 4, SIGKILL: 9, SIGTERM: 15 };
  return 128 + (signalCodeByName[signal] ?? 1);
}

function main() {
  const { platform, arch } = process;
  const libcFamily = getLibcFamily();
  const avx2Supported = supportsAvx2();
  const coreVersion = getCorePackageVersion();

  let packageCandidates;
  try {
    packageCandidates = getPlatformPackageCandidates({
      platform,
      arch,
      libcFamily,
      preferBaseline: avx2Supported === false,
    });
  } catch (error) {
    console.error(`\nopenagent-labforge: ${error.message}\n`);
    process.exit(1);
  }

  const resolvedBinaries = packageCandidates
    .map((pkg) => {
      try {
        return {
          pkg,
          binPath: require.resolve(getBinaryPath(pkg, platform)),
          version: getPlatformPackageVersion(pkg),
        };
      } catch {
        return null;
      }
    })
    .filter((entry) => entry !== null)
    .filter((entry) => {
      if (!coreVersion || !entry.version) return true;
      if (entry.version === coreVersion) return true;

      console.error(
        `openagent-labforge: Skipping stale platform binary ${entry.pkg}@${entry.version} ` +
          `(core package is ${coreVersion}).`
      );
      return false;
    });

  if (resolvedBinaries.length === 0) {
    runJsCliFallback();
    return;
  }

  for (let index = 0; index < resolvedBinaries.length; index += 1) {
    const currentBinary = resolvedBinaries[index];
    const hasFallback = index < resolvedBinaries.length - 1;
    const result = spawnSync(currentBinary.binPath, process.argv.slice(2), { stdio: "inherit" });

    if (result.error) {
      if (hasFallback) continue;
      console.error(`\nopenagent-labforge: Failed to execute binary.`);
      console.error(`Error: ${result.error.message}\n`);
      process.exit(2);
    }

    if (result.signal === "SIGILL" && hasFallback) continue;
    if (result.signal) process.exit(getSignalExitCode(result.signal));
    process.exit(result.status ?? 1);
  }

  process.exit(1);
}

main();
