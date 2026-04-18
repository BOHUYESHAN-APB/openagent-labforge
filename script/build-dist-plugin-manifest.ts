#!/usr/bin/env bun

import packageJson from "../package.json" with { type: "json" }

type RootPackage = {
  name: string
  version: string
  description?: string
  license?: string
  type?: string
}

const root = packageJson as RootPackage

const manifest = {
  name: root.name,
  version: root.version,
  description: root.description,
  license: root.license,
  type: root.type ?? "module",
  main: "./index.js",
  "oc-plugin": ["server", "tui"],
  exports: {
    ".": {
      import: "./index.js",
      types: "./index.d.ts",
    },
    "./server": {
      import: "./index.js",
      types: "./index.d.ts",
    },
    "./tui": {
      import: "./tui/index.js",
      types: "./tui/index.d.ts",
    },
  },
}

await Bun.write("dist/package.json", JSON.stringify(manifest, null, 2) + "\n")
console.log("✓ dist plugin manifest generated: dist/package.json")
