import packageJson from "../../package.json" with { type: "json" }

import { createSettingsController } from "./settings-controller"
import type { TuiPlugin, TuiPluginModule } from "./types"

const OPEN_SETTINGS_COMMAND = "openagent-labforge.settings.open"
const OPEN_IMAGE_BUS_COMMAND = "openagent-labforge.settings.image-bus"

const OpenAgentLabforgeTuiPlugin: TuiPlugin = async (api) => {
  const controller = createSettingsController(api, api.state.path.directory)

  api.command.register(() => [
    {
      title: controller.describeCommand("settings").title,
      value: OPEN_SETTINGS_COMMAND,
      description: controller.describeCommand("settings").description,
      category: "OpenAgent Labforge",
      slash: {
        name: "ol-settings",
      },
      onSelect: () => controller.openRoot("root"),
    },
    {
      title: controller.describeCommand("image-bus-settings").title,
      value: OPEN_IMAGE_BUS_COMMAND,
      description: controller.describeCommand("image-bus-settings").description,
      category: "OpenAgent Labforge",
      slash: {
        name: "ol-settings-image-bus",
      },
      onSelect: () => controller.openRoot("image-bus"),
    },
  ])
}

const plugin: TuiPluginModule = {
  id: packageJson.name,
  tui: OpenAgentLabforgeTuiPlugin,
}

export default plugin
