# Aggregate Packages

This directory defines aggregate installer package skeletons for later release
work.

## Packages

- `packages/labforge-full`
  - intended profile: full
  - current status: release scaffold only

- `packages/labforge-paper`
  - intended profile: paper-only
  - current status: release scaffold only

## Notes

- Current manifests are private and are not the main supported install path.
- The current real install flow is still local build + local tgz replacement of
  `@bohuyeshan/openagent-labforge-core`.
