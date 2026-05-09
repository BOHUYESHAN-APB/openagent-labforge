# Command System

ExtendAI Lab has three command execution styles. The distinction matters
because some commands are sent to the model as prompt templates, while others are
handled directly by plugin hooks before the model sees them.

## Command categories

| Category | Commands | Execution path |
|----------|----------|----------------|
| Prompt-template | `/ol-checkpoint`, `/ol-checkpoint-light`, `/ol-checkpoint-heavy`, `/ol-handoff`, `/ol-checkpoint-resume`, `/ol-checkpoint-resume-latest`, `/ol-start-work`, `/ol-karpathy`, `/ol-ralph-loop`, `/ol-cancel-ralph` | The registered template is injected into the session and executed by the active AI agent. Complete checkpoint variants map back to the same checkpoint handlers. |
| Mixed template + hook | `/ol-stop-continuation` | The template asks the agent to clean up broad continuation mechanisms; the hook also hard-disables todo auto-continuation deterministically. |
| Hook-driven | `/ol-auto-continue`, `/ol-auto-continue-on`, `/ol-auto-continue-off`, `/ol-subagents*`, `/ol-preset`, `/ol-interview`, `/ol-light`, `/ol-heavy`, `/ol-turbo`, `/ol-memory-*` | `command.execute.before` handles the command directly and replaces or augments the template output. |
| CLI host-side | `extendai-lab doctor`, `extendai-lab status`, `extendai-lab install --runtime=<id>`, `extendai-lab rollback --runtime=<id>` | Node CLI reports runtime detection, compat SDK availability, install/apply and rollback/restore behavior, supports `--runtime-root=<path>` for isolated runtime targets, and prints phase-1 capability summaries without starting model work. |

## Complete commands for finite arguments

OpenCode currently tends to complete the command name, not later positional
parameters. For finite choices, LabForge registers complete command names so the
choice is visible in command completion. The older parameterized forms remain
accepted for compatibility.

| Complete command | Equivalent legacy form | Purpose |
|------------------|------------------------|---------|
| `/ol-subagents-UM` | `/ol-subagents UM` | Show loaded `ultra-minimal` subagent policy guidance |
| `/ol-subagents-M` | `/ol-subagents M` | Show loaded legacy `minimal` subagent policy guidance |
| `/ol-subagents-F` | `/ol-subagents F` | Show loaded `full` subagent policy guidance |
| `/ol-subagents-C` | `/ol-subagents C` | Show loaded `custom` subagent policy guidance |
| `/ol-subagents-MO` | `/ol-subagents MO` | Show loaded `main-only` subagent policy guidance |
| `/ol-auto-continue-on` | `/ol-auto-continue on` | Enable todo auto-continuation |
| `/ol-auto-continue-off` | `/ol-auto-continue off` | Disable todo auto-continuation |
| `/ol-checkpoint-light [goal]` | `/ol-checkpoint light [goal]` | Create light same-session checkpoint |
| `/ol-checkpoint-heavy [goal]` | `/ol-checkpoint heavy [goal]` | Create heavy cross-session handoff checkpoint |
| `/ol-checkpoint-resume-latest` | `/ol-checkpoint-resume latest` | Resume the latest checkpoint |

Subagent policy commands are informational for the currently loaded plugin
instance. To actually change which child agents are registered, update
`subagentPolicy.mode` in config and reload/restart the plugin. The current
default is `ultra-minimal`, which keeps the main agent in the foreground and
avoids child-session waiting unless the work is genuinely parallel or requires
independent judgment and child-session use has been explicitly allowed.

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
| `/ol-auto-continue`, `/ol-auto-continue-on`, `/ol-auto-continue-off` | `/auto-continue` |
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

1. Complete command normalization — maps finite-choice commands such as
   `/ol-auto-continue-on`, `/ol-checkpoint-light`, and
   `/ol-checkpoint-resume-latest` back to their canonical handlers.
2. Todo continuation hook — `/ol-auto-continue`, `/ol-stop-continuation`
3. Interview manager — `/ol-interview`
4. Preset manager — `/ol-preset`
5. Memory commands — `/ol-memory-write`, `/ol-memory-list`,
   `/ol-memory-delete`
6. Start-work hook — `/ol-start-work`
7. Prompt mode handler — `/ol-light`, `/ol-heavy`, `/ol-turbo`
8. Subagent policy status — `/ol-subagents`, `/ol-subagents-UM`,
   `/ol-subagents-M`, `/ol-subagents-F`, `/ol-subagents-C`, `/ol-subagents-MO`

Keep command names disjoint. Hook-driven commands should clear or replace the
template output intentionally so users do not get duplicate model instructions.
