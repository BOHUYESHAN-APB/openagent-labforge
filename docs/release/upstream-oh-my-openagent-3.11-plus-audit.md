# Upstream Audit: oh-my-openagent 3.11+

This note tracks upstream release items from `v3.11.0` onward that may need
porting into this fork. It is intentionally scoped to migration candidates,
not a full changelog mirror.

## Scope

- Upstream source: `code-yeongyu/oh-my-openagent`
- Release window: `v3.11.0` through `v3.14.0`
- Goal: identify features or fixes relevant to this fork's runtime, config,
  agent orchestration, skills, and installer behavior

## v3.11.0

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.11.0>

Candidate items:

- [ ] ULW-loop Oracle verification requirement and explicit Oracle session tracking
- [ ] GPT-5.4-first prompt routing across Sisyphus / Oracle / Momus / Metis / Sisyphus-Junior / Hephaestus
- [ ] Atlas Final Verification Wave orchestration logic
- [ ] `delegate-task` metadata improvements and configurable sync timeout
- [ ] `start-work.auto_commit` config support
- [ ] `look-at` automatic HEIC / RAW / PSD conversion
- [ ] slash-command dispatch integration for marketplace plugin commands
- [ ] plugin runtime config-context initialization parity

## v3.11.1

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.11.1>

Candidate items:

- [ ] verify whether dual-publish workflow logic or repository provenance changes matter for this fork

## v3.11.2

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.11.2>

Candidate items:

- [ ] background task polling fix for undefined session status
- [ ] session-notification grace period
- [ ] tool-config respect for `question` permission from injected OpenCode config content
- [ ] cache invalidation parity for stale plugin packages in cache dir

## v3.12.0

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.12.0>

Candidate items:

- [ ] smart circuit breaker in background-agent manager
- [ ] background-task circuit-breaker config surface
- [ ] task toast model-name display
- [ ] `run_in_background` required-path fix review
- [ ] ULW Oracle verification fallback tracking follow-up
- [ ] longer stale/session wait timeouts where still relevant
- [ ] hashline-edit tool description and line-schema improvements

## v3.12.1

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.12.1>

Candidate items:

- [ ] todo-description-override hook for atomic todo formatting
- [ ] target-aware circuit-breaker detection
- [ ] release workflow fixes only if still relevant to this fork

## v3.12.2

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.12.2>

Candidate items:

- [ ] consecutive-call circuit-breaker rewrite
- [ ] background-agent terminal-session handling fix
- [ ] performance patches across hot paths where they map cleanly

## v3.12.3

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.12.3>

Candidate items:

- [ ] no direct migration needed beyond ensuring debug-only logging is not retained

## v3.13.0

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.13.0>

Candidate items:

- [ ] background-task fallback-chain registration for background sessions
- [ ] unstable-agent config override fix
- [ ] webfetch redirect-loop guards
- [ ] null-byte sanitization in bash-command flow
- [ ] permission merge-order fix preserving explicit deny
- [ ] canonical plugin config filename precedence
- [ ] model-selection persistence fixes scoped to main session
- [ ] compaction epoch-aware guards for todo continuation
- [ ] dynamic multimodal fallback-chain / vision-capable model cache
- [ ] stagnation guard in todo-continuation-enforcer
- [ ] `git_env_prefix` support for git-master
- [ ] Claude Code alias normalization / import compatibility
- [ ] compaction checkpoint store for session agent config

## v3.13.1

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.13.1>

Candidate items:

- [ ] writable-directory fallback for data/cache paths
- [ ] MCP OAuth callback port binding robustness
- [ ] keep explicitly configured agent when model is explicit
- [ ] provider-agnostic runtime fallback selection
- [ ] Prometheus respect for agent model override
- [ ] non-Opus Claude variant clamp on fallback
- [ ] preserve default OpenCode build agent where intended

## v3.14.0

Release: <https://github.com/code-yeongyu/oh-my-openagent/releases/tag/v3.14.0>

Candidate items:

- [ ] package rename compatibility layer (`oh-my-opencode` -> `oh-my-openagent`) where still useful for this fork
- [ ] Hephaestus default-model upgrade parity
- [ ] doctor warning for legacy package names and example config guidance
- [ ] cold-cache user-config override fix in model resolution
- [ ] model-requirements alignment with provider catalog
- [ ] ancestor `.agents` / project skill discovery parity
- [ ] nested opencode command discovery and slash-name support
- [ ] support for opencode directory aliases
- [ ] session-recovery fix for invalid `prt_*` tool_use_id reconstruction

## Next pass

Recommended implementation order:

1. runtime correctness fixes
2. config and path-discovery parity
3. background-agent / continuation guard parity
4. command and skill discovery parity
5. packaging / doctor / release workflow parity
