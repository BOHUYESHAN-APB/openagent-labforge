export type { ConfigContext } from "./config-manager/config-context"
export {
  initConfigContext,
  getConfigContext,
  resetConfigContext,
} from "./config-manager/config-context"

export { fetchNpmDistTags } from "./config-manager/npm-dist-tags"
export { getPluginNameWithVersion } from "./config-manager/plugin-name-with-version"
export { addPluginToOpenCodeConfig } from "./config-manager/add-plugin-to-opencode-config"

export { generateOmoConfig } from "./config-manager/generate-omo-config"
export { writeOmoConfig } from "./config-manager/write-omo-config"
export { writeImageBusConfig } from "./config-manager/write-image-bus-config"
export { writeBootstrapSkill, cleanupManagedBootstrapSkill } from "./config-manager/write-bootstrap-skill"
export { syncStaticAgentToOpenCodeConfig } from "./config-manager/sync-static-agent-to-opencode-config"
export { syncStaticMcpToOpenCodeConfig } from "./config-manager/sync-static-mcp-to-opencode-config"
export { cleanupStaleManagedAgentsFromOpenCodeConfig } from "./config-manager/cleanup-stale-managed-agents"
export { cleanupManagedMcpFromOpenCodeConfig } from "./config-manager/cleanup-managed-mcp-from-opencode-config"

export { isOpenCodeInstalled, getOpenCodeVersion } from "./config-manager/opencode-binary"

export { detectCurrentConfig } from "./config-manager/detect-current-config"

export type { BunInstallResult } from "./config-manager/bun-install"
export { runBunInstall, runBunInstallWithDetails } from "./config-manager/bun-install"
