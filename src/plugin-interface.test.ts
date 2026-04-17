import { describe, expect, test, mock } from "bun:test"
import { createPluginInterface } from "./plugin-interface"

describe("createPluginInterface", () => {
  test("handles ol-settings in command.execute.before without forwarding to autoSlashCommand", async () => {
    const commandExecuteBefore = mock(async () => {})
    const executeCommand = mock(async () => ({}))
    const showToast = mock(async () => ({}))

    const pluginInterface = createPluginInterface({
      ctx: {
        client: {
          tui: {
            executeCommand,
            showToast,
          },
        },
      } as any,
      pluginConfig: {} as any,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {
        configHandler: async () => {},
      } as any,
      hooks: {
        autoSlashCommand: {
          "command.execute.before": commandExecuteBefore,
        },
      } as any,
      tools: {},
    })

    expect(typeof pluginInterface["command.execute.before"]).toBe("function")

    await pluginInterface["command.execute.before"]?.(
      { command: "ol-settings", sessionID: "ses_1", arguments: "" } as any,
      { parts: [] } as any,
    )

    expect(executeCommand).toHaveBeenCalledTimes(1)
    expect(executeCommand).toHaveBeenCalledWith({ body: { command: "settings.open" } })
    expect(commandExecuteBefore).not.toHaveBeenCalled()
  })

  test("forwards non-settings commands to autoSlashCommand", async () => {
    const commandExecuteBefore = mock(async () => {})

    const pluginInterface = createPluginInterface({
      ctx: {
        client: {
          tui: {
            showToast: async () => ({}),
          },
        },
      } as any,
      pluginConfig: {} as any,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {
        configHandler: async () => {},
      } as any,
      hooks: {
        autoSlashCommand: {
          "command.execute.before": commandExecuteBefore,
        },
      } as any,
      tools: {},
    })

    await pluginInterface["command.execute.before"]?.(
      { command: "ralph-loop", sessionID: "ses_2", arguments: "" } as any,
      { parts: [] } as any,
    )

    expect(commandExecuteBefore).toHaveBeenCalledTimes(1)
    expect(commandExecuteBefore).toHaveBeenCalledWith(
      { command: "ralph-loop", sessionID: "ses_2", arguments: "" },
      { parts: [] },
    )
  })
})
