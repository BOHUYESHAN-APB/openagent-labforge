import * as z from "zod"
import { OhMyOpenCodeConfigSchema } from "../src/config/schema"

export function createOpenAgentLabforgeJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(OhMyOpenCodeConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  })

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/bohuyeshan/openagent-labforge/dev/assets/openagent-labforge.schema.json",
    title: "OpenAgent Labforge Configuration",
    description: "Configuration schema for @bohuyeshan/openagent-labforge-core",
    ...jsonSchema,
  }
}

