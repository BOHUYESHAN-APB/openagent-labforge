#!/usr/bin/env bun
import { createOpenAgentLabforgeJsonSchema } from "./build-schema-document"

const LABFORGE_SCHEMA_OUTPUT_PATH = "assets/openagent-labforge.schema.json"
const LABFORGE_DIST_SCHEMA_OUTPUT_PATH = "dist/openagent-labforge.schema.json"

async function main() {
  console.log("Generating JSON Schema...")

  const baseSchema = createOpenAgentLabforgeJsonSchema()

  // openagent-labforge schema (primary)
  await Bun.write(LABFORGE_SCHEMA_OUTPUT_PATH, JSON.stringify(baseSchema, null, 2))
  await Bun.write(LABFORGE_DIST_SCHEMA_OUTPUT_PATH, JSON.stringify(baseSchema, null, 2))

  console.log(`✓ JSON Schema generated: ${LABFORGE_SCHEMA_OUTPUT_PATH}`)
  console.log(`✓ JSON Schema generated: ${LABFORGE_DIST_SCHEMA_OUTPUT_PATH}`)
}

main()

