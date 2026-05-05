# 仓库改名计划

当前 canonical remote 仍然是：

```text
origin-bio = git@github.com:BOHUYESHAN-APB/openagent-labforge-bio.git
```

这个仓库名现在是历史遗留。产品和 npm package 名已经是 `openagent-labforge`，未来 GitHub 仓库也应迁移到这个中性名称。

英文版本：[`repository-rename.md`](repository-rename.md)

## 不要立刻改名

GitHub 仓库改名会影响：

- release URLs；
- install examples；
- package metadata；
- 本地 git remotes；
- CI/release automation；
- 用户收藏和 issue 链接。

GitHub redirect 通常能兜底，但 release 和本地自动化仍然需要明确检查。

## 目标

```text
Current: BOHUYESHAN-APB/openagent-labforge-bio
Target:  BOHUYESHAN-APB/openagent-labforge
```

## 迁移清单

1. 在正式改名前，继续只使用 `origin-bio` 推送。
2. 把 bio 拆成文档明确的 discipline pack 边界。
3. 更新 README 安装示例，避免依赖 `-bio` 路径。
4. 更新 `package.json` repository、bugs、homepage 字段。
5. 更新 release scripts 和 GitHub CLI 命令。
6. 确认现有 tags/releases redirect 正常。
7. GitHub 改名后再更新本地 remote。
8. 发布 release note 说明仓库改名。

## 兼容措辞

迁移前统一使用这段说明：

> 当前 GitHub 仓库仍叫 `openagent-labforge-bio`，这是为了历史 release 连续性。产品/package 名是 `openagent-labforge`；bio 是第一个 discipline pack，不是产品边界。
