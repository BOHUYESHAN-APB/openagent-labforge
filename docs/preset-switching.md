# Preset Switching

Switch agent model presets at runtime without restarting OpenCode using the
`/ol-preset` slash command.

`/ol-preset` is **configuration control**, not a prompt-guidance command. It changes
agent model/provider/runtime settings through OpenCode `config.update()`.

Do not confuse it with `/ol-karpathy`:

| Command | Purpose | Changes models? |
|---------|---------|-----------------|
| `/ol-preset <name>` | Switch named runtime model/provider/settings presets | Yes |
| `/ol-karpathy [task]` | Apply Karpathy coding guidelines to the current task/review | No |

`/ol-karpathy` comes from the migrated
[`karpathy-guidelines`](../src/skills/karpathy-guidelines/SKILL.md) skill and is
used to constrain behavior: think first, keep changes simple, edit surgically,
and verify against explicit goals. It does not replace or overlap `/ol-preset`.

## Controls

| Command | Description |
|---------|-------------|
| `/ol-preset` | List available presets (highlights the active one) |
| `/ol-preset <name>` | Switch to the named preset immediately |

## Built-in Presets

The following presets are available without configuration:

| Preset | Command | Description |
|--------|---------|-------------|
| `free` | `/ol-preset-free` | No binding — use current OpenCode model (default) |
| `ds-first` | `/ol-preset-ds-first` | DeepSeek V4 Pro main, Flash workers, MiMo vision |
| `openai` | `/ol-preset-openai` | GPT-5.4 daily, 5.5 for reviews only |
| `openai-go` | `/ol-preset-openai-go` | Dual sub: GPT review + DS workers |
| `mimo` | `/ol-preset-mimo` | Xiaomi MiMo V2.5 (pro + flash) |
| `mimo-ds` | `/ol-preset-mimo-ds` | MiMo + DeepSeek combined |
| `custom` | `/ol-preset-custom` | Per-agent model from config |

## How It Works

1. Define named presets in `extendai-lab.jsonc` under the `presets` field
2. Run `/ol-preset <name>` to switch. The plugin calls the OpenCode SDK's `config.update()` method, which triggers a server-side cache invalidation
3. Agents covered by the new preset get the preset's values
4. Agents that were in the *previous* preset but are *not* in the new one are reset to their config-file baseline values
5. The next LLM call uses the new models and settings

## Example Configuration

```jsonc
{
  "presets": {
    "cheap": {
      "orchestrator": { "model": "anthropic/claude-3.5-haiku" },
      "explorer": { "model": "openai/gpt-5.4-mini" },
      "oracle": { "model": "anthropic/claude-sonnet-4-6" }
    },
    "powerful": {
      "orchestrator": { "model": "openai/gpt-5.5" },
      "oracle": { "model": "anthropic/claude-opus-4-6" },
      "librarian": { "model": "anthropic/claude-sonnet-4-6" }
    },
    "thinking": {
      "oracle": {
        "model": "anthropic/claude-sonnet-4-6",
        "variant": "thinking",
        "options": { "thinking": { "type": "enabled", "budgetTokens": 10000 } }
      }
    }
  }
}
```

## Supported Fields

The following fields are forwarded to the OpenCode SDK at runtime:

| Field | Description |
|-------|-------------|
| `model` | Model ID in `provider/model` format. Array form (fallback chains) is resolved to the first entry |
| `temperature` | Inference temperature (0-2) |
| `variant` | Model variant (e.g. `"thinking"`) |
| `options` | Provider-specific options (e.g. thinking budget) |

Fields not forwarded (require restart): `prompt`, `skills`, `mcps`, `displayName`.

## Startup Preset vs Runtime Switching

There are two ways to activate a preset:

| Method | How | Persists? |
|--------|-----|-----------|
| Config file | Set `"preset": "cheap"` in `extendai-lab.jsonc` | Yes, across restarts |
| `/ol-preset` command | Run `/ol-preset cheap` during a session | Across re-inits, not restarts |

Runtime preset switches persist across plugin re-inits (triggered by config changes, etc.) within the same process, but revert on process restart. On restart, the plugin applies the preset from the config file. To make a runtime switch permanent, update the `"preset"` field in your config file.

## Example Output

```
/ol-preset
```

```
Available presets:
  cheap ← active
    orchestrator → anthropic/claude-3.5-haiku
    explorer → openai/gpt-5.4-mini
    oracle → anthropic/claude-sonnet-4-6
  powerful
    orchestrator → openai/gpt-5.5
    oracle → anthropic/claude-opus-4-6

Usage: /ol-preset <name> to switch.
```

```
/ol-preset powerful
```

```
Switched to preset "powerful":
orchestrator → model: openai/gpt-5.5
oracle → model: anthropic/claude-opus-4-6
Reset to baseline: explorer
```

The "Reset to baseline" line appears when agents from the previous preset
are not present in the new one. Those agents are reverted to their
config-file defaults.

> See [Configuration](configuration.md) for the full preset option reference.
