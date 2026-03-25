import { existsSync } from "fs"
import { dirname, join, resolve } from "path"

function hasGitRootMarker(directory: string): boolean {
  return existsSync(join(directory, ".git"))
}

export function discoverProjectSkillDirectories(startDirectory: string, skillDirectoryName: string): string[] {
  const directories: string[] = []
  let current = resolve(startDirectory)

  while (true) {
    directories.push(join(current, skillDirectoryName))

    if (hasGitRootMarker(current)) {
      return directories
    }

    const parent = dirname(current)
    if (parent === current) {
      return directories
    }

    current = parent
  }
}
