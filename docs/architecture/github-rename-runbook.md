# GitHub Rename Runbook

This runbook covers the planned repository rename from the current historical
GitHub path:

```text
BOHUYESHAN-APB/openagent-labforge-bio
```

to the target neutral product path:

```text
BOHUYESHAN-APB/extendai-lab
```

The intent is to rename the **cloud repository path first**, without renaming the
local working directory yet.

Chinese version: [`github-rename-runbook.zh-CN.md`](github-rename-runbook.zh-CN.md)

## Why this is safe enough

- Local OpenCode plugin loading primarily depends on the local filesystem path.
- Current worktrees and sessions should not disappear just because the GitHub
  repository URL changes.
- GitHub provides redirects for the old repository URL in most cases.

The risky parts are not the local files; they are:

- remotes used by `git push` / `gh`;
- release automation and package metadata;
- documentation and install examples;
- any scripts or tests that still assume the old repository path.

## Preconditions

Do this only after the migration release is ready:

1. `extendai-lab` naming is already live in package/schema/config/docs.
2. legacy fallbacks are in place for config/state and documented for removal in
   `v1.0.16`.
3. the working tree is clean on `master`.
4. all active worktrees are known.
5. release/tag state is verified.

## Recommended sequence

### 1. Freeze release work

- Ensure `master` is clean.
- Ensure no local hotfix is half-written.
- Note all active worktrees and branches.

### 2. Rename the GitHub repository

Use the GitHub web UI or `gh repo rename` on the correct repository.

Target:

```text
BOHUYESHAN-APB/openagent-labforge-bio -> BOHUYESHAN-APB/extendai-lab
```

### 3. Verify redirect behavior

Check:

- old repo URL redirects to the new repo;
- existing release URLs still resolve;
- existing tags remain visible;
- issue and pull request URLs still resolve.

### 4. Update local remotes

Current repository typically uses:

```text
origin      = old personal repo or stale remote (do not trust by default)
origin-bio  = correct current push remote
upstream    = upstream source repo
```

After rename, update the correct remote first:

```bash
git remote set-url origin-bio git@github.com:BOHUYESHAN-APB/extendai-lab.git
```

If you later want to normalize names, do that only after verifying pushes:

```bash
git remote rename origin-bio origin
```

Do **not** rename remotes and repository path in the same blind step without a
verification push.

### 5. Verify GitHub CLI binding

Run checks such as:

```bash
gh repo view BOHUYESHAN-APB/extendai-lab
git remote -v
git ls-remote --heads origin-bio
```

Make sure future `gh release` / `gh issue` / `gh pr` commands target the renamed
repository.

### 6. Verify worktrees

List worktrees and ensure they still point at the same local directory roots:

```bash
git worktree list
```

Renaming the GitHub remote should not break local worktrees. Only a local folder
rename would require plugin path updates.

### 7. Update metadata and docs

After remote verification, update:

- `package.json` repository / bugs / homepage fields;
- installation snippets;
- issue template links;
- release scripts or docs that still mention `origin-bio` or the old repo path.

### 8. Publish a migration release note

The first release after repo rename should explicitly say:

- old GitHub path;
- new GitHub path;
- local folder rename is **not** required yet;
- legacy config/state fallback remains until `v1.0.16`.

## What not to rename yet

Do **not** simultaneously rename:

- the local folder path;
- the repo URL;
- all remotes;
- worktree paths;
- plugin install path in OpenCode config.

Do the cloud repo path first. Local folder/path changes can come later, when the
user explicitly wants to normalize the checkout path.
