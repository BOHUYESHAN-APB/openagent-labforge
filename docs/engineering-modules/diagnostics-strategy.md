# Diagnostics Strategy

## Purpose

Prevent validation policy from collapsing into a single host-specific or
language-specific assumption such as “LSP is always available” or “typecheck is
enough for every language”.

## When to inject

- implementation verification
- refactoring verification
- bug-fix verification
- code review and release-readiness checks
- any workflow that claims code correctness or readiness

## Required behaviors

- Prefer LSP diagnostics when a reliable LSP path exists for the changed files.
- If LSP is unavailable or incomplete for the language/toolchain, use the
  language's own diagnostics instead.
- Accept multiple valid diagnostics paths, for example:
  - TypeScript: `tsc --noEmit`
  - Python: `ruff`, `pyright`, `pytest`
  - R: `Rscript`, `lintr`, package-specific checks
  - Rust: `cargo check`, `clippy`
  - Go: `go test`, `go vet`
- State which diagnostic path was actually used.
- Distinguish diagnostics from broader verification such as tests, builds,
  runtime checks, and scientific validation.

## What it must reject or push back on

- claiming “validated” when only one narrow checker ran and the language needs more
- assuming LSP coverage exists for all languages in OpenCode workflows
- treating type diagnostics as a substitute for tests or runtime verification
- treating missing diagnostics support as permission to skip verification entirely

## Output expectations

Outputs should make clear:

- which diagnostics path was used;
- whether it was LSP-based or language-native;
- what additional verification still remains.

## Related modules / related skills

- [`scientific-rigor.md`](scientific-rigor.md)
- [`anti-overconfidence.md`](anti-overconfidence.md)

## Notes for contributors

- Keep this module host-neutral. It should work for OpenCode now and other hosts later.
- Do not hardcode one language ecosystem as the universal default.
- CI/GitHub Actions are a higher validation layer, not a replacement for local diagnostics.
