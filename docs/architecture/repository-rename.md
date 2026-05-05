# Repository Rename Plan

The current canonical remote is still:

```text
origin-bio = git@github.com:BOHUYESHAN-APB/openagent-labforge-bio.git
```

That repository name is now a historical artifact. The product and npm package
name are already `openagent-labforge`, and future work should move the GitHub
repository to the same neutral name.

Chinese version: [`repository-rename.zh-CN.md`](repository-rename.zh-CN.md)

## Do not rename immediately

Renaming the GitHub repository affects:

- release URLs;
- install examples;
- package metadata;
- local git remotes;
- CI/release automation;
- user bookmarks and issue links.

GitHub redirects usually help, but releases and local automation should still be
checked deliberately.

## Target

```text
Current: BOHUYESHAN-APB/openagent-labforge-bio
Target:  BOHUYESHAN-APB/openagent-labforge
```

## Migration checklist

1. Keep `origin-bio` as the only push target until the rename is scheduled.
2. Split bio into a documented discipline pack boundary.
3. Update README install examples to avoid `-bio` paths.
4. Update `package.json` repository, bugs, and homepage fields.
5. Update release scripts and GitHub CLI commands.
6. Confirm existing tags/releases redirect correctly.
7. Rename the remote locally after GitHub rename.
8. Publish a release note explaining the repository rename.

## Compatibility language

Use this wording while migration is pending:

> The current GitHub repository is still named `openagent-labforge-bio` for
> historical release continuity. The product/package name is
> `openagent-labforge`; bio is the first discipline pack, not the product
> boundary.
