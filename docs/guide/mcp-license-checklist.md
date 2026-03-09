# MCP License Checklist

Use this checklist before integrating any third-party paper/bio MCP server.

## Allowed license policy (recommended)

- Allow by default: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.
- Conditional review: MPL-2.0, LGPL (depends on distribution model).
- Avoid for bundled distribution: GPL/AGPL unless legal review explicitly approves.

## Required repository checks

1. License file exists and is explicit.
2. Project is actively maintained.
3. Security posture is acceptable (no obvious unsafe defaults).
4. Network/data handling is documented.
5. No secret keys hardcoded in examples or source.

## Attribution requirements

- Add source + license to `THIRD_PARTY_NOTICES.md`.
- Document MCP purpose and trust boundary in plugin README.

## Runtime safety checks

- Confirm required env vars are documented.
- Confirm timeout and failure behavior.
- Confirm graceful disable path if MCP is unavailable.
- Confirm network-aware disable strategy for geo/provider-restricted paths.

## Candidate MCP intake template

```markdown
- Name:
- Repository URL:
- License:
- Last active date:
- Required secrets/env vars:
- Data sent externally:
- Risk notes:
- Decision: accept / reject / legal-review
```

## Network-aware gating requirement

For providers that may fail or be restricted in some network regions (for example Google-dependent routes):

1. Provide a default-off or auto-disable mode.
2. Enable only when user explicitly requests that provider/path.
3. Always provide a fallback route (non-Google search source or browser/manual mode).
