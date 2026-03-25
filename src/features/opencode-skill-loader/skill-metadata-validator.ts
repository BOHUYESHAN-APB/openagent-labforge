import { basename } from "path"
import type { SkillMetadata } from "./types"

const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SKILL_NAME_MAX_LENGTH = 64
const SKILL_DESCRIPTION_MAX_LENGTH = 1024

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function validateSkillMetadata(options: {
  data: SkillMetadata
  defaultName: string
  skillPath: string
  resolvedPath: string
  parseError: boolean
}): string | null {
  if (options.parseError) {
    return "invalid frontmatter"
  }

  const expectedName = basename(options.skillPath) === "SKILL.md"
    ? basename(options.resolvedPath)
    : basename(options.skillPath, ".md")
  const baseName = options.data.name ?? options.defaultName

  if (!isNonEmptyString(baseName)) {
    return "missing skill name"
  }

  if (baseName.length > SKILL_NAME_MAX_LENGTH) {
    return "skill name too long"
  }

  if (!SKILL_NAME_PATTERN.test(baseName)) {
    return "invalid skill name"
  }

  if (expectedName !== baseName) {
    return "skill name must match filesystem entry"
  }

  if (!isNonEmptyString(options.data.description)) {
    return "missing skill description"
  }

  if (options.data.description.trim().length > SKILL_DESCRIPTION_MAX_LENGTH) {
    return "skill description too long"
  }

  return null
}
