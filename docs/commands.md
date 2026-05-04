# Command System

OpenAgent LabForge has three command execution styles. The distinction matters
because some commands are sent to the model as prompt templates, while others are
handled directly by plugin hooks before the model sees them.

## Command categories

| Category | Commands | Execution path |
|----------|----------|----------------|
| Prompt-template | `/ol-checkpoint`, `/ol-handoff`, `/ol-checkpoint-resume`, `/ol-start-work`, `/ol-karpathy`, `/ol-ralph-loop`, `/ol-cancel-ralph` | The registered template is injected into the session and executed by the active AI agent. |
| Mixed template + hook | `/ol-stop-continuation` | The template asks the agent to clean up broad continuation mechanisms; the hook also hard-disables todo auto-continuation deterministically. |
| Hook-driven | `/ol-auto-continue`, `/ol-preset`, `/ol-interview`, `/ol-light`, `/ol-heavy`, `/ol-turbo` | `command.execute.before` handles the command directly and replaces or augments the template output. |

## Prefix policy

User-facing LabForge commands should use the `ol-` prefix whenever they are
registered by this plugin. This avoids collisions when users install multiple
OpenCode plugins. The important registered workflow command is:

```text
/ol-start-work [plan-name] [--worktree <path>]
```

Do **not** document new user workflows with the legacy `/start-work` spelling.
Legacy OMO / Sisyphus docs may mention `/start-work`, but LabForge’s public
command is `/ol-start-work`.

Legacy unprefixed hook commands may still be accepted for backward
compatibility, but LabForge registers and documents the prefixed forms as the
primary interface:

| Primary command | Legacy compatibility input |
|-----------------|----------------------------|
| `/ol-preset` | `/preset` |
| `/ol-auto-continue` | `/auto-continue` |
| `/ol-interview` | `/interview` |
| `/ol-stop-continuation` | `/stop-continuation` |
| `/ol-ralph-loop`, `/ol-cancel-ralph` | No default legacy registration; use the prefixed commands. |

## `/ol-preset` vs `/ol-karpathy`

These commands are intentionally different and should not be merged.

| Command | Purpose | Changes model/provider settings? | Changes task behavior? |
|---------|---------|----------------------------------|------------------------|
| `/ol-preset [name]` | Switch named agent runtime presets by calling OpenCode `config.update()` | Yes | Indirectly, through different model settings |
| `/ol-karpathy [task-or-review-target]` | Apply the migrated Andrej Karpathy coding guidelines as prompt guidance | No | Yes |

Use `/ol-preset` when you want different models, providers, temperatures, variants,
or agent overrides. Use `/ol-karpathy` when you want stricter coding behavior:
think before coding, simplicity first, surgical changes, and goal-driven
verification.

## Command hook order

`command.execute.before` handlers run in this order:

1. Todo continuation hook — `/ol-auto-continue`, `/ol-stop-continuation`
2. Interview manager — `/ol-interview`
3. Preset manager — `/ol-preset`
4. Start-work hook — `/ol-start-work`
5. Prompt mode handler — `/ol-light`, `/ol-heavy`, `/ol-turbo`

Keep command names disjoint. Hook-driven commands should clear or replace the
template output intentionally so users do not get duplicate model instructions.
