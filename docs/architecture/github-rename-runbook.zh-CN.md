# GitHub 改名运行手册

这个运行手册用于将当前历史 GitHub 仓库路径：

```text
BOHUYESHAN-APB/openagent-labforge-bio
```

改为目标中性产品路径：

```text
BOHUYESHAN-APB/extendai-lab
```

这里的目标是**先改云端仓库路径**，暂时**不改本地工作目录名**。

英文版本：[`github-rename-runbook.md`](github-rename-runbook.md)

## 为什么这样相对安全

- 本地 OpenCode plugin 加载主要依赖本地文件系统路径。
- 当前 worktrees 和 sessions 不会因为 GitHub 仓库 URL 改变就直接消失。
- GitHub 一般会为旧仓库 URL 提供 redirect。

真正风险更大的是：

- `git push` / `gh` 使用的 remotes；
- release 自动化和 package metadata；
- 文档与安装示例；
- 仍然假定旧仓库路径的脚本或测试。

## 前置条件

只有在迁移版 release 准备好后再做：

1. `extendai-lab` 命名已经在 package/schema/config/docs 中落地；
2. 旧 config/state fallback 已经就位，并明确文档到 `v1.0.16` 移除；
3. `master` 工作树干净；
4. 已知所有活跃 worktrees；
5. release/tag 状态已验证。

## 推荐顺序

### 1. 冻结 release 工作

- 确保 `master` 干净；
- 确保没有写到一半的 hotfix；
- 记录所有活跃 worktrees 和 branches。

### 2. 改 GitHub 仓库名

通过 GitHub 网页或 `gh repo rename` 改当前正确仓库。

目标：

```text
BOHUYESHAN-APB/openagent-labforge-bio -> BOHUYESHAN-APB/extendai-lab
```

### 3. 验证 redirect

检查：

- 旧 repo URL 是否跳到新 repo；
- 现有 release URL 是否仍能打开；
- 现有 tags 是否仍可见；
- issue / PR 链接是否仍可访问。

### 4. 更新本地 remotes

当前仓库通常有：

```text
origin      = 旧个人 repo 或历史 stale remote（默认不要信）
origin-bio  = 当前正确 push remote
upstream    = 上游源仓库
```

改名后，先更新正确 remote：

```bash
git remote set-url origin-bio git@github.com:BOHUYESHAN-APB/extendai-lab.git
```

如果后续想统一 remote 名，再等验证 push 正常之后做：

```bash
git remote rename origin-bio origin
```

不要在没有验证 push 的情况下，一步同时改 remote 名和 repo 路径。

### 5. 验证 GitHub CLI 绑定

运行：

```bash
gh repo view BOHUYESHAN-APB/extendai-lab
git remote -v
git ls-remote --heads origin-bio
```

确保之后 `gh release` / `gh issue` / `gh pr` 都指向新仓库。

### 6. 验证 worktrees

列出 worktrees，确认它们仍指向相同的本地目录：

```bash
git worktree list
```

仅修改 GitHub remote 不应该破坏本地 worktrees。真正需要改 OpenCode plugin 路径的是以后如果你还要改本地文件夹名。

### 7. 更新 metadata 和 docs

确认 remote 正常后，更新：

- `package.json` 的 repository / bugs / homepage；
- 安装示例；
- issue template links；
- 仍提到 `origin-bio` 或旧仓库路径的 release scripts / docs。

### 8. 发布迁移 release note

仓库改名后的第一个 release 要明确写：

- 旧 GitHub 路径；
- 新 GitHub 路径；
- **本地文件夹暂时不需要改名**；
- 旧 config/state fallback 保留到 `v1.0.16`。

## 现在不要同时改的内容

暂时不要在同一个步骤里一起改：

- 本地文件夹路径；
- repo URL；
- 所有 remote 名；
- worktree 路径；
- OpenCode config 里的 plugin 本地安装路径。

先改云端 repo 路径。本地文件夹/path 统一可以以后再做，等用户明确要处理时再改。
