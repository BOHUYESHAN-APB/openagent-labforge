import * as p from "@clack/prompts"
import color from "picocolors"
import { detectCurrentConfig, writeImageBusConfig } from "./config-manager"
import { promptImageBusConfig } from "./configure-image-bus-prompts"

export interface ConfigureOptions {
  imageBusOnly: boolean
}

export async function configure(options: ConfigureOptions): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("Error: configure requires a TTY. Please run in an interactive terminal.")
    return 1
  }

  p.intro(color.bgCyan(color.black(" openagent-labforge configure ")))

  const current = detectCurrentConfig()
  if (!current.isInstalled) {
    p.log.warn("Plugin does not appear installed yet. Run install first if needed.")
  }

  if (options.imageBusOnly) {
    p.log.info("Running image_bus-only wizard.")
  } else {
    p.log.info("Running unified settings wizard (image_bus + context guard + bio agent visibility).")
  }

  const imageBus = await promptImageBusConfig({ includeGeneralSettings: !options.imageBusOnly })
  if (!imageBus) return 1

  const writeResult = writeImageBusConfig(imageBus)
  if (!writeResult.success) {
    p.log.error(writeResult.error ?? "Failed to write image bus config")
    p.outro(color.red("Configuration failed."))
    return 1
  }

  p.log.success(`Image bus config saved: ${color.cyan(writeResult.configPath)}`)
  p.note(
    [
      `Routing strategy: ${imageBus.routing.strategy}`,
      `Force Google for scientific: ${imageBus.routing.force_google_for_scientific}`,
      `Allow Google for general: ${imageBus.routing.allow_google_for_general}`,
      `Subscription mode: ${imageBus.subscription.mode}`,
      ...(imageBus.context_guard_profile
        ? [`Context guard preset: ${imageBus.context_guard_profile}`]
        : []),
      ...(imageBus.bio_agents_visible !== undefined
        ? [`Bio agents visible: ${imageBus.bio_agents_visible}`]
        : []),
    ].join("\n"),
    "Applied",
  )
  p.outro(color.green("Configuration updated."))
  return 0
}