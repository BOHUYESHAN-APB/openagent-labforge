// postinstall.mjs
// Runs after npm install to verify platform binary is available
// and auto-configure bio skills bundle

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { getPlatformPackageCandidates, getBinaryPath } from "./bin/platform.js";

const require = createRequire(import.meta.url);

/**
 * Detect libc family on Linux
 */
function getLibcFamily() {
  if (process.platform !== "linux") {
    return undefined;
  }

  try {
    const detectLibc = require("detect-libc");
    return detectLibc.familySync();
  } catch {
    return null;
  }
}

/**
 * Get OpenCode config directory (cross-platform)
 */
function getOpenCodeConfigDir() {
  const envConfigDir = process.env.OPENCODE_CONFIG_DIR?.trim();
  if (envConfigDir) {
    return envConfigDir;
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(appData, "opencode");
  }

  const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdgConfig, "opencode");
}

/**
 * Auto-configure bio skills bundle in OpenCode config
 */
function autoConfigureBioSkills() {
  try {
    const configDir = getOpenCodeConfigDir();
    const pluginConfigPath = join(configDir, "openagent-labforge.json");

    // Create config directory if it doesn't exist
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    let config = {};
    let needsUpdate = false;

    // Read existing config if it exists
    if (existsSync(pluginConfigPath)) {
      try {
        const content = readFileSync(pluginConfigPath, "utf-8");
        config = JSON.parse(content);
      } catch (error) {
        console.warn(`⚠ Could not parse existing config at ${pluginConfigPath}`);
        return;
      }
    }

    // Check if skills.bundle is already configured
    if (!config.skills || !config.skills.bundle) {
      needsUpdate = true;
      config.skills = config.skills || {};
      config.skills.bundle = "bio";
    }

    // Write config if needed
    if (needsUpdate) {
      writeFileSync(
        pluginConfigPath,
        JSON.stringify(config, null, 2) + "\n",
        "utf-8"
      );
      console.log(`✓ Auto-configured bio skills bundle in ${pluginConfigPath}`);
      console.log(`  This enables 469 bioinformatics skills from the plugin`);
    }
  } catch (error) {
    console.warn(`⚠ Could not auto-configure bio skills: ${error.message}`);
    console.warn(`  You can manually add "skills": { "bundle": "bio" } to your config`);
  }
}

function main() {
  const { platform, arch } = process;
  const libcFamily = getLibcFamily();

  try {
    const packageCandidates = getPlatformPackageCandidates({
      platform,
      arch,
      libcFamily,
    });

    const resolvedPackage = packageCandidates.find((pkg) => {
      try {
        require.resolve(getBinaryPath(pkg, platform));
        return true;
      } catch {
        return false;
      }
    });

    if (!resolvedPackage) {
      throw new Error(
        `No platform binary package installed. Tried: ${packageCandidates.join(", ")}`
      );
    }

    console.log(`✓ openagent-labforge binary installed for ${platform}-${arch} (${resolvedPackage})`);
  } catch (error) {
    console.warn(`⚠ openagent-labforge: ${error.message}`);
    console.warn(`  The CLI may not work on this platform.`);
    // Don't fail installation - let user try anyway
  }

  // Auto-configure bio skills
  autoConfigureBioSkills();
}

main();
