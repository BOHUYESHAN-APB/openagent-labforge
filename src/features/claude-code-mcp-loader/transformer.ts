import type {
  ClaudeCodeMcpServer,
  McpLocalConfig,
  McpRemoteConfig,
  McpServerConfig,
} from "./types"
import { expandEnvVarsInObject } from "./env-expander"
import { normalizeLocalMcpCommand } from "../../shared"

export function transformMcpServer(
  name: string,
  server: ClaudeCodeMcpServer
): McpServerConfig {
  const expanded = expandEnvVarsInObject(server)
  const serverType = expanded.type ?? "stdio"

  // Respect the disabled field from the original config
  // Default to enabled if not explicitly disabled
  const enabled = expanded.disabled !== true

  if (serverType === "http" || serverType === "sse") {
    if (!expanded.url) {
      throw new Error(
        `MCP server "${name}" requires url for type "${serverType}"`
      )
    }

    const config: McpRemoteConfig = {
      type: "remote",
      url: expanded.url,
      enabled,
    }

    if (expanded.headers && Object.keys(expanded.headers).length > 0) {
      config.headers = expanded.headers
    }

    if (typeof expanded.timeout === "number") {
      config.timeout = expanded.timeout
    }

    return config
  }

  if (!expanded.command) {
    throw new Error(`MCP server "${name}" requires command for stdio type`)
  }

  const commandArray = normalizeLocalMcpCommand([
    expanded.command,
    ...(expanded.args ?? []),
  ])

  const config: McpLocalConfig = {
    type: "local",
    command: commandArray,
    enabled,
  }

  if (expanded.env && Object.keys(expanded.env).length > 0) {
    config.environment = expanded.env
  }

  if (typeof expanded.timeout === "number") {
    config.timeout = expanded.timeout
  }

  return config
}
