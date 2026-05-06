import packageJson from "../../package.json" with { type: "json" }

import { createSettingsController } from "./settings-controller"
import type { TuiPlugin, TuiPluginModule } from "./types"
import { createMagicContextSidebarSlot } from "./slots/magic-context-sidebar"
import { loadPluginConfig } from "../plugin-config"
import { captureMagicContextSnapshot, formatMagicContextSidebar } from "../features/magic-context/tui-snapshot"
import { getSessionPendingOps, executePendingOps } from "../features/magic-context/storage/pending-ops-storage"
import { getSessionTags } from "../features/magic-context/storage/tags-storage"
import { getSessionCompartments } from "../features/magic-context/storage/compartments-storage"

const OPEN_SETTINGS_COMMAND = "openagent-labforge.settings.open"
const OPEN_IMAGE_BUS_COMMAND = "openagent-labforge.settings.image-bus"
const OL_CTX_STATUS_COMMAND = "openagent-labforge.magic-context.status"
const OL_CTX_FLUSH_COMMAND = "openagent-labforge.magic-context.flush"

const OpenAgentLabforgeTuiPlugin: TuiPlugin = async (api, _options, meta) => {
  // defensive: if settings controller fails, still register other features
  let controller: ReturnType<typeof createSettingsController> | null = null
  try {
    controller = createSettingsController(api, api.state.path.directory)
  } catch (err) {
    console.error("[openagent-labforge] Failed to create settings controller:", err)
  }

  // Enable scrollbar by default (always check and enable if disabled)
  try {
    const currentScrollbarSetting = api.kv.get<boolean>("scrollbar_visible", false)
    if (!currentScrollbarSetting) {
      api.kv.set("scrollbar_visible", true)
    }
  } catch (err) {
    console.error("[openagent-labforge] Failed to enable scrollbar:", err)
  }

  // Register Magic Context sidebar slot (if slot API is available)
  try {
    if (api.slot && typeof api.slot.register === "function") {
      api.slot.register(createMagicContextSidebarSlot(api))
    }
  } catch (err) {
    console.error("[openagent-labforge] Failed to register Magic Context slot:", err)
  }

  // Register slash commands - defensive: if settings controller failed, register fallback commands
  try {
    api.command.register(() => {
      const commands: any[] = []

      // ol-settings
      if (controller) {
        commands.push({
          title: controller.describeCommand("settings").title,
          value: OPEN_SETTINGS_COMMAND,
          description: controller.describeCommand("settings").description,
          category: "OpenAgent Labforge",
          slash: { name: "ol-settings" },
          onSelect: () => controller.openRoot("root"),
        })
      } else {
        // Fallback: register settings command even if controller failed
        commands.push({
          title: "OpenAgent Settings",
          value: OPEN_SETTINGS_COMMAND,
          description: "Open the native OpenAgent Labforge settings dialog.",
          category: "OpenAgent Labforge",
          slash: { name: "ol-settings" },
          onSelect: () => {
            api.ui.toast({
              variant: "warning",
              message: "Settings controller initialization failed. Please check the plugin logs.",
            })
          },
        })
      }

      // ol-settings-image-bus
      if (controller) {
        commands.push({
          title: controller.describeCommand("image-bus-settings").title,
          value: OPEN_IMAGE_BUS_COMMAND,
          description: controller.describeCommand("image-bus-settings").description,
          category: "OpenAgent Labforge",
          slash: { name: "ol-settings-image-bus" },
          onSelect: () => controller!.openRoot("image-bus"),
        })
      } else {
        commands.push({
          title: "OpenAgent Image Bus Settings",
          value: OPEN_IMAGE_BUS_COMMAND,
          description: "Open the Image Bus page inside OpenAgent Labforge settings.",
          category: "OpenAgent Labforge",
          slash: { name: "ol-settings-image-bus" },
          onSelect: () => {
            api.ui.toast({
              variant: "warning",
              message: "Settings controller initialization failed. Please check the plugin logs.",
            })
          },
        })
      }

      // Magic Context Status
      commands.push({
        title: "Magic Context Status",
        value: OL_CTX_STATUS_COMMAND,
        description: "Show detailed Magic Context status and debug information",
        category: "OpenAgent Labforge",
        slash: { name: "ol-ctx-status" },
        onSelect: async () => {
          try {
            const pluginConfig = loadPluginConfig(api.state.path.directory, undefined)
            const sessionId = ""

            const snapshot = captureMagicContextSnapshot(
              { directory: api.state.path.directory } as any,
              pluginConfig,
              sessionId,
            )

            if (!snapshot) {
              api.ui.toast({
                variant: "warning",
                message: "Magic Context is not enabled. Set experimental.magic_context.enabled = true in config.",
              })
              return
            }

            const tags = getSessionTags(api.state.path.directory, sessionId)
            const pendingOps = getSessionPendingOps(api.state.path.directory, sessionId)
            const compartments = getSessionCompartments(api.state.path.directory, sessionId)

            const lines = [
              "# Magic Context Status",
              "",
              formatMagicContextSidebar(snapshot),
              "",
              "## Tags Breakdown",
              `- Active: ${snapshot.activeTagCount}`,
              `- Dropped: ${snapshot.droppedTagCount}`,
              `- Compacted: ${snapshot.compactedTagCount}`,
              `- Total: ${tags.length}`,
              "",
              "## Pending Operations",
            ]

            if (pendingOps.length === 0) {
              lines.push("- None")
            } else {
              for (const op of pendingOps) {
                const age = Math.floor((Date.now() - op.timestamp) / 1000)
                lines.push(`- [${op.type}] ${op.reason} (${age}s ago)`)
              }
            }

            lines.push("", "## Compartments", `- Total: ${compartments.length}`)

            if (compartments.length > 0) {
              for (const c of compartments.slice(0, 5)) {
                lines.push(`- #${c.sequence}: §${c.startTag}§-§${c.endTag}§ "${c.title}"`)
              }
              if (compartments.length > 5) {
                lines.push(`- ... and ${compartments.length - 5} more`)
              }
            }

            api.ui.toast({
              variant: "info",
              title: "Magic Context Status",
              message: lines.join("\n"),
              duration: 10000,
            })
          } catch (err) {
            api.ui.toast({
              variant: "error",
              message: `Magic Context status failed: ${err instanceof Error ? err.message : String(err)}`,
            })
          }
        },
      })

      // Magic Context Flush
      commands.push({
        title: "Magic Context Flush",
        value: OL_CTX_FLUSH_COMMAND,
        description: "Force execute all pending Magic Context operations",
        category: "OpenAgent Labforge",
        slash: { name: "ol-ctx-flush" },
        onSelect: async () => {
          try {
            const sessionId = ""
            const pendingOps = getSessionPendingOps(api.state.path.directory, sessionId)

            if (pendingOps.length === 0) {
              api.ui.toast({ variant: "info", message: "No pending operations to flush." })
              return
            }

            const executed = executePendingOps(api.state.path.directory, sessionId)
            api.ui.toast({
              variant: "success",
              title: "Magic Context Flush",
              message: `Flushed ${executed} pending operations.`,
            })
          } catch (err) {
            api.ui.toast({
              variant: "error",
              message: `Flush failed: ${err instanceof Error ? err.message : String(err)}`,
            })
          }
        },
      })

      return commands
    })
  } catch (err) {
    console.error("[openagent-labforge] Failed to register TUI commands:", err)
  }
}

const plugin: TuiPluginModule = {
  id: packageJson.name,
  tui: OpenAgentLabforgeTuiPlugin,
}

export default plugin
