# Research Packaging Architecture

This document defines how bioinformatics and paper workflows are organized for maintainability and user experience.

## Final Architecture (Adopted)

Use a hybrid model:

- Split implementation into focused packages.
- Provide aggregate install packages for one-step onboarding.

## Package Roles

1. Core
   - Package: `@labforge/openagent-labforge-core`
   - Responsibilities:
     - coding-first orchestration
     - strict user model priority
     - AUTO model governance
     - built-in document/research baseline skills

2. Bio/Paper Agent Companion
   - Package: `@labforge/opencode-agent-bio-paper`
   - Responsibilities:
     - bioinformatics workflow presets
     - paper writing/reading orchestration presets
     - profile switch (`full`, `paper-only`)

3. Paper Search MCP Companion
   - Package: `@labforge/opencode-mcp-paper-search`
   - Responsibilities:
     - literature retrieval adapters
     - citation-oriented research integrations

4. Aggregate Installer (full)
   - Package: `@labforge/openagent-labforge`
   - Installs and documents full stack defaults

5. Aggregate Installer (paper-only)
   - Package: `@labforge/openagent-labforge-paper`
   - Installs and documents paper-centric stack defaults

## Why Not Fully Merge Everything Into Core

- Bio stack evolves faster and may need independent dependency cadence.
- Paper-only users should not carry full bio workflow complexity.
- Release blast radius stays smaller with companion package boundaries.

## Why Not Fully Split Without Aggregates

- Multi-package onboarding is friction for end users.
- Aggregate packages provide one-command install while preserving modular internals.

## Runtime Policy

- User-selected model always wins when explicitly pinned.
- AUTO selection is explicit and opt-in, not a hidden override path.
- Profile defaults must never bypass explicit user model choice.

## Rollout Phases

Phase 1
- Publish core under new identity (`1.0.0`).
- Publish companion packages (`0.1.0` or `1.0.0` based on readiness).

Phase 2
- Publish aggregate installers.
- Update README quick-start and migration docs.

Phase 3
- Harden profile presets for bio pipelines (R/Python tools, domain templates).
- Add benchmarked research task playbooks.
