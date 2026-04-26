# 发布指南（当前策略：Windows 优先）

本仓库当前发布策略是：

- 先发布主包 `@bohuyeshan/openagent-labforge-core`
- 同步发布 Windows 平台包（`openagent-labforge-windows-x64` / `openagent-labforge-windows-x64-baseline`）
- macOS/Linux 平台包暂不作为每次发版的硬性前置条件

如果你需要 macOS/Linux 平台包，请先走本地构建和本地安装路径，或在后续补发对应平台包。

## 1. 前置准备

### 1.1 发布身份与 token

当前仓库仍使用 npm access token 发布（Trusted Publishing 可后续切换）。

```bash
# Windows PowerShell
$env:NODE_AUTH_TOKEN = "<YOUR_NPM_TOKEN>"

# 可选校验
npm whoami --registry https://registry.npmjs.org
```

### 1.2 Bun 版本

```bash
bun --version
```

建议使用与仓库当前构建链路兼容的 Bun 版本（至少满足仓库当前最低要求）。

## 2. Windows 优先发布流程

### 2.1 版本准备

```bash
# 仅准备版本号并同步 package.json
$env:VERSION = "3.15.3"
bun run script/publish.ts --prepare-only
```

### 2.2 构建主包

```bash
bun run clean
bun run build
```

### 2.3 构建 Windows 平台二进制

```bash
bun build src/cli/index.ts --compile --minify --target=bun-windows-x64 --outfile=packages/windows-x64/bin/openagent-labforge.exe
bun build src/cli/index.ts --compile --minify --target=bun-windows-x64-baseline --outfile=packages/windows-x64-baseline/bin/openagent-labforge.exe
```

### 2.4 发布顺序

建议顺序：先平台包，再主包。

```bash
# 发布 windows-x64
npm publish --access public ./packages/windows-x64

# 发布 windows-x64-baseline
npm publish --access public ./packages/windows-x64-baseline

# 发布主包
npm publish --access public
```

说明：主包中 `optionalDependencies` 引用平台包版本。先发布平台包可降低用户安装时遇到缺包的概率。

## 3. 验证发布

```bash
npm view @bohuyeshan/openagent-labforge-core@3.15.3
npm view openagent-labforge-windows-x64@3.15.3
npm view openagent-labforge-windows-x64-baseline@3.15.3
```

## 4. 关于 macOS/Linux 平台包

当前仓库允许以下临时策略：

- 发布窗口内仅保证主包 + Windows 平台包
- 其他平台用户采用本地构建 + 本地安装
- 等 CI 或目标平台构建条件稳定后，再补发对应平台包

这不会影响 Windows 用户的安装可用性，但会影响其他平台用户自动拉取预编译平台包。

## 5. 安装补充（和发布策略配套）

由于我们覆盖了部分 OpenCode TUI 逻辑，安装时必须确保服务端与 TUI 两条插件注册链路都配置完整。

必须同时检查：

- `~/.config/opencode/opencode.json`（服务端插件注入）
- `~/.config/opencode/tui.json`（TUI 命令和界面注入）

二者都应包含：

```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@<version>"
  ]
}
```

如果只配置了 `opencode.json` 而遗漏 `tui.json`，常见现象是：

- 插件主逻辑可加载
- 但 `/ol-settings` 等 TUI 通路不可见或行为不完整

## 6. 发布后功能通路检查（最小回归）

发布并安装后，至少检查以下通路：

1. 插件已加载（非默认 plan/builder-only 视图）
2. `/ol-settings` 可用
3. `/ol-settings-image-bus` 可用
4. `task(subagent_type="explore", ...)` 可执行
5. `look_at(...)` 工具可调用

若任一项失败，先检查是否遗漏 `tui.json` 插件注册，再检查版本号与安装位置是否一致。

## 7. 后续迁移建议

后续建议把发布链路迁移到 npm Trusted Publishing（OIDC），减少长期 token 暴露风险。
