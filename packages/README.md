# Aggregate Packages

This directory defines aggregate installer packages for simplified onboarding.

## Packages

- `packages/labforge-full`
  - npm target: `@labforge/openagent-labforge`
  - intended profile: full

- `packages/labforge-paper`
  - npm target: `@labforge/openagent-labforge-paper`
  - intended profile: paper-only

## Notes

- Current manifests are release skeletons and are marked private.
- After core identity migration is complete, set `private` to `false` for publish.
