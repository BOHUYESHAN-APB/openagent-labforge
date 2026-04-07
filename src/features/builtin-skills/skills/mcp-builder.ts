import type { BuiltinSkill } from "../types"

export const mcpBuilderSkill: BuiltinSkill = {
  name: "mcp-builder",
  description:
    "Build production-grade MCP servers with clear tool schemas, transport decisions, evaluation tasks, and operational review",
  metadata: {
    category: "engineering/mcp-builder",
    domain: "mcp-builder",
  },
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(*)"],
  template: `# MCP Builder

Use this skill when the task is to:
- build an MCP server
- refactor an MCP server
- add tools/resources/prompts to an MCP server
- review MCP transport, schema, or discoverability design

## Mission

Build MCP servers that are usable by real agents, not just technically functional.

## Four-stage workflow

1. Research
- understand the user workflow the MCP should support
- decide whether the server is exposing:
  - tools
  - resources
  - prompts
  - or a mix
- choose transport deliberately:
  - stdio
  - http
  - streamable http

2. Implement
- define tool names for discoverability
- define strict input/output schema
- centralize API clients, auth, pagination, and error handling
- make destructive operations explicit

3. Review
- test with realistic requests
- inspect error messages for agent usability
- review idempotency, retry behavior, and timeout handling
- verify tool descriptions actually help an LLM choose correctly

4. Evaluate
- create 5-10 realistic evaluation tasks
- verify a model can discover the right MCP tool and use it correctly
- note failure modes: wrong tool selection, missing params, vague outputs

## Design checklist

- tool names are action-oriented and easy to pick from a list
- descriptions tell the model when to use the tool
- schema is strict enough to prevent sloppy calls
- outputs are structured and agent-usable
- auth and configuration requirements are explicit
- error messages are actionable rather than generic

## Anti-patterns

- exporting raw backend APIs without LLM-friendly tool boundaries
- vague tool names like "run" or "execute"
- schema that allows too many malformed inputs
- errors that explain nothing about how to recover
- zero evaluation beyond "the server starts"

## When to load companion skills

- load \`backend-architecture\` when the MCP server sits on top of complex service boundaries
- load \`skill-creator\` when the MCP needs matching usage skills or operator guidance

## Output contract

- transport choice and why
- tool/resource/prompt inventory
- schema and naming review
- operational risks
- evaluation plan`,
}
