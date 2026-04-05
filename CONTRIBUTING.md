# Contributing to OpenAgent Labforge

Thank you for contributing.

This repository is a derivative fork of `code-yeongyu/oh-my-openagent`, but contributions here should follow the current OpenAgent Labforge workflow and release surface rather than the old upstream install story.

For provenance and license boundaries, see:

- `README.md`
- `LICENSE.md`
- `NOTICE`
- `THIRD_PARTY_NOTICES.md`
- `docs/licensing.md`

---

## Language Policy

English remains the primary working language for issues, pull requests, code review, and repository-facing documentation.

Clear English is more important than perfect English.

---

## Current Development Setup

### Prerequisites

- Bun
- TypeScript-compatible local toolchain
- OpenCode for runtime verification

### Local setup

```bash
git clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git
cd openagent-labforge
bun install
bun run build
```

---

## Local Runtime Verification

The practical verification workflow is local-first:

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

Then replace the local tgz used by your OpenCode config directory and run `bun install` there.

See `docs/guide/installation.md` for the exact current steps.

---

## What to Verify Before Sending Changes

At minimum:

```bash
bun run typecheck
bun run build
```

When relevant, also run focused tests for the files or subsystems you changed.

If your changes affect runtime OpenCode behavior, verify them against a real local installed plugin package instead of only trusting workspace source.

---

## Contribution Priorities

High-value contributions in the current phase usually fall into one of these buckets:

- delegation/session correctness
- MCP reliability and user-friendly setup
- docs/release-surface cleanup
- skill/agent boundary clarity
- low-risk upstream syncs that improve stability without changing product philosophy silently

Behavior-affecting changes should be easy to explain in terms of:

1. strongest hypothesis
2. falsifier
3. validating experiment

---

## Project Conventions

- Use Bun, not npm/yarn, for repo development.
- Do not suppress type errors with `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Prefer focused patches over broad speculative rewrites.
- Keep provenance explicit when replacing inherited upstream wording.
- Do not silently merge behavior changes that affect user-facing workflows without documenting the tradeoff.

---

## Pull Requests

When sending a PR:

1. explain the actual problem being fixed
2. explain the falsifier for your main hypothesis
3. list focused validation that was run
4. call out anything intentionally deferred

This repository benefits more from precise, falsifiable engineering notes than from broad marketing-style PR prose.

---

## Maintainer Merge Note

The maintainer is not especially fluent in complex multi-contributor Git merge
workflows.

As a result:

- contribution merges may sometimes take extra time
- AI-assisted review or conflict-handling may be used before merge completion
- concise PR notes, focused diffs, and explicit validation make merge handling
  much easier

---

## Publishing

Do not treat local development as equivalent to public release readiness.

Current release preparation still includes:

- local packaging checks
- runtime verification against the installed OpenCode plugin path
- release-surface cleanup
- manual token/release workflow coordination when publishing is actually requested

If publishing is requested, follow the repo’s release workflow rather than improvising a direct publish path.
