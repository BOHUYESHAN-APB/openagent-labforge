# 插件安装问题修复总结

## 完成时间
2026-04-25 16:13

## 问题描述

用户报告插件安装后显示旧版本的 agent 名称，说明插件没有正确加载新版本。

## 根本原因

**OpenCode 使用本地 node_modules，而不是全局安装！**

- ❌ **错误假设**：OpenCode 使用全局安装的 npm 包（`npm install -g`）
- ✅ **实际情况**：OpenCode 使用 `.config/opencode/node_modules` 中的本地安装

## 安装位置对比

### 全局安装（不起作用）
```
C:\Users\BoHuYeShan\AppData\Roaming\npm\node_modules\@bohuyeshan\openagent-labforge-core
```
- OpenCode **不会**从这里加载插件

### 本地安装（正确方式）
```
C:\Users\BoHuYeShan\.config\opencode\node_modules\@bohuyeshan\openagent-labforge-core
```
- OpenCode **会**从这里加载插件

## 正确的安装方法

### 方法 1：本地 npm install（推荐）

```bash
# 1. 构建插件
cd /path/to/openagent-labforge
bun run build
npm pack

# 2. 在 OpenCode 配置目录安装
cd ~/.config/opencode
npm install /path/to/openagent-labforge/bohuyeshan-openagent-labforge-core-<version>.tgz
```

### 方法 2：使用 file:// 路径（开发模式）

在 `~/.config/opencode/opencode.json` 中：
```json
{
  "plugin": [
    "file:///D:/-Users-/Documents/GitHub/chat-model/openagent-labforge"
  ]
}
```

**注意**：file:// 路径可能有问题，本地 npm install 更可靠。

## 修复步骤

### 1. 升级版本号
```bash
# 修改 package.json
"version": "3.15.1" → "3.15.2"
```

### 2. 重新构建和打包
```bash
cd /path/to/openagent-labforge
bun run build
npm pack
```

### 3. 本地安装到 OpenCode 配置目录
```bash
cd C:\Users\BoHuYeShan\.config\opencode
npm install D:\-Users-\Documents\GitHub\chat-model\openagent-labforge\bohuyeshan-openagent-labforge-core-3.15.2.tgz
```

### 4. 验证安装
```bash
# 检查版本
cat C:\Users\BoHuYeShan\.config\opencode\node_modules\@bohuyeshan\openagent-labforge-core\package.json | grep version

# 应该显示：
"version": "3.15.2"
```

### 5. 更新配置文件
`C:\Users\BoHuYeShan\.config\opencode\opencode.json`：
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@3.15.2",
    "opencode-pty@0.3.2"
  ]
}
```

### 6. 重启 OpenCode
完全关闭 OpenCode 进程，然后重新启动。

## 验证清单

安装后验证：
- [ ] 能看到多个 agent（sisyphus、oracle、librarian 等）
- [ ] `/ol-settings` 命令可用
- [ ] Magic Context 侧边栏显示（如果启用）
- [ ] 不再显示旧版本的 agent 名称

## 关键教训

1. **OpenCode 插件安装位置**：
   - ✅ 本地：`~/.config/opencode/node_modules`
   - ❌ 全局：`npm global node_modules`

2. **版本号的作用**：
   - 带版本号是可以的（如 `@bohuyeshan/openagent-labforge-core@3.15.2`）
   - 升级版本号可以强制 OpenCode 重新加载

3. **package.json 的作用**：
   - OpenCode 配置目录下的 `package.json` 管理本地插件依赖
   - npm install 会自动更新这个文件

4. **为什么全局安装不起作用**：
   - OpenCode 设计为使用本地 node_modules
   - 这样可以为每个项目/配置使用不同版本的插件
   - 类似于项目级依赖而非全局依赖

## 更新文档

需要更新以下文档：
- [ ] README.md - 安装说明
- [ ] README.zh-cn.md - 安装说明（中文）
- [ ] docs/guide/installation.md - 详细安装指南
- [ ] PLUGIN_INSTALLATION_COMPLETE.md - 安装验证文档

**关键修改**：
- 移除全局安装方法（`npm install -g`）
- 添加本地安装方法（在 `~/.config/opencode` 目录）
- 说明 OpenCode 使用本地 node_modules

## 最终状态

✅ **插件已正确安装**
- 位置：`C:\Users\BoHuYeShan\.config\opencode\node_modules\@bohuyeshan\openagent-labforge-core`
- 版本：3.15.2
- 配置：opencode.json 已更新

**等待用户重启 OpenCode 验证。**
