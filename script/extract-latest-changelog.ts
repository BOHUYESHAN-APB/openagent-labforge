#!/usr/bin/env bun

import { readFileSync } from "node:fs"
import { join } from "node:path"

function main() {
  const changelogPath = join(process.cwd(), "CHANGELOG.md")
  const content = readFileSync(changelogPath, "utf8")
  const lines = content.split(/\r?\n/)
  const start = lines.findIndex((line) => line.startsWith("## "))

  if (start === -1) {
    throw new Error("Could not find latest changelog entry in CHANGELOG.md")
  }

  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i
      break
    }
  }

  process.stdout.write(lines.slice(start, end).join("\n").trim() + "\n")
}

main()
