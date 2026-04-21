# OpenAgent Labforge 完整配置指南

**适用于所有 OpenCode 环境**: CLI、Desktop、Web

---

## 问题根源

OpenCode 将插件分为两部分：
- **Server 部分**: agents、命令、工具、hooks（在 `opencode.json` 中注册）
- **TUI 部分**: TUI 界面、设置页面（在 `tui.json` 中注册）

**必须在两个文件中都注册插件**，否则只有部分功能可用。

---

## 正确的配置方法

### 1. 配置文件位置

**Windows**:
- `C:\Users\<用户名>\.config\opencode\opencode.json` (或 `.jsonc`)
- `C:\Users\<用户名>\.config\opencode\tui.json` (或 `.jsonc`)
- `C:\Users\<用户名>\.config\opencode\openagent-labforge.jsonc`

**macOS/Linux**:
- `~/.config/opencode/opencode.json` (或 `.jsonc`)
- `~/.config/opencode/tui.json` (或 `.jsonc`)
- `~/.config/opencode/openagent-labforge.jsonc`

### 2. opencode.json 配置

**用于**: Server 部分（agents、命令、工具）

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "file:///D:/-Users-/Documents/GitHub/chat-model/openagent-labforge"
  ],
  "provider": {
    // 你的 provider 配置
  }
}
```

**注意**: 
- 使用 `file:///` 协议
- 路径必须是绝对路径
- 指向项目根目录，不是 dist 目录

### 3. tui.json 配置

**用于**: TUI 部分（设置界面、TUI 命令）

```json
{
  "plugin": [
    "file:///D:/-Users-/Documents/GitHub/chat-model/openagent-labforge"
  ]
}
```

**必须与 opencode.json 中的路径完全一致！**

### 4. openagent-labforge.jsonc 配置

**用于**: 插件自身的配置

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/BOHUYESHAN-APB/openagent-labforge/dev/assets/openagent-labforge.schema.json",
  "i18n": {
    "enabled": true,
    "language": "zh-CN"
  },
  "skills": {
    "bundle": "full"
  },
  "mcp_policy": {
    "search_english_fallback": true
  }
}
```

---

## 本地开发配置

### 方式 1: file:// 协议（推荐）

**opencode.json**:
```json
{
  "plugin": [
    "file:///ABSOLUTE/PATH/TO/openagent-labforge"
  ]
}
```

**tui.json**:
```json
{
  "plugin": [
    "file:///ABSOLUTE/PATH/TO/openagent-labforge"
  ]
}
```

### 方式 2: npm link（备选）

```bash
cd /path/to/openagent-labforge
npm link

cd ~/.config/opencode
npm link @bohuyeshan/openagent-labforge-core
```

然后在配置文件中：
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core"
  ]
}
```

---

## 生产环境配置

### 使用 npm 包

**package.json**:
```json
{
  "dependencies": {
    "@bohuyeshan/openagent-labforge-core": "^3.13.4",
    "@opencode-ai/plugin": "1.2.16"
  }
}
```

**opencode.json**:
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core"
  ]
}
```

**tui.json**:
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core"
  ]
}
```

---

## 不同环境的配置

### OpenCode CLI

只需要 `opencode.json` 和 `openagent-labforge.jsonc`

### OpenCode Desktop

需要 `opencode.json`、`tui.json` 和 `openagent-labforge.jsonc`

### OpenCode Web

需要 `opencode.json`、`tui.json` 和 `openagent-labforge.jsonc`

---

## 常见问题排查

### 问题 1: 只能看到 TUI 设置，看不到 agents

**原因**: 只在 `tui.json` 中注册了插件，没有在 `opencode.json` 中注册

**解决**: 在 `opencode.json` 中添加相同的插件注册

### 问题 2: 完全看不到插件

**原因**: 
1. 插件路径错误
2. 插件没有构建
3. OpenCode 版本不兼容

**解决**:
1. 检查路径是否正确（使用绝对路径）
2. 运行 `bun run build`
3. 检查 `@opencode-ai/plugin` 版本（应该是 1.2.16）

### 问题 3: 插件加载后没有 agents

**原因**: 
1. 配置文件语法错误
2. 插件代码有错误
3. OpenCode 缓存问题

**解决**:
1. 验证 JSON 语法
2. 查看 OpenCode 日志
3. 删除 `node_modules` 并重新安装

---

## 验证配置是否正确

### 1. 检查文件存在

```bash
ls ~/.config/opencode/opencode.json
ls ~/.config/opencode/tui.json
ls ~/.config/opencode/openagent-labforge.jsonc
```

### 2. 检查插件注册

```bash
cat ~/.config/opencode/opencode.json | grep plugin
cat ~/.config/opencode/tui.json | grep plugin
```

两个文件中的 `plugin` 数组应该包含相同的插件路径。

### 3. 检查插件构建

```bash
cd /path/to/openagent-labforge
ls dist/index.js
ls dist/tui/index.js
```

两个文件都应该存在。

### 4. 重启 OpenCode

**完全关闭** OpenCode（不是最小化），然后重新启动。

### 5. 验证功能

启动后应该能看到：
- **Agents**: sisyphus, wase, atlas, prometheus, orchestrator, bio-autopilot 等
- **命令**: `/ol-settings`, `/ol-compress-context`, `/ol-checkpoint` 等
- **TUI 设置**: Agent Display Settings 页面

---

## 推荐的开发工作流

### 1. 初始设置

```bash
# 克隆项目
git clone https://github.com/BOHUYESHAN-APB/openagent-labforge.git
cd openagent-labforge

# 构建
bun install
bun run build
```

### 2. 配置 OpenCode

创建或编辑 `~/.config/opencode/opencode.json`:
```json
{
  "plugin": [
    "file:///ABSOLUTE/PATH/TO/openagent-labforge"
  ]
}
```

创建或编辑 `~/.config/opencode/tui.json`:
```json
{
  "plugin": [
    "file:///ABSOLUTE/PATH/TO/openagent-labforge"
  ]
}
```

### 3. 开发循环

```bash
# 修改代码
vim src/agents/orchestrator.ts

# 重新构建
bun run build

# 重启 OpenCode
# (完全关闭并重新打开)
```

---

## 版本兼容性

### OpenCode 版本

- **推荐**: 与 oh-my-opencode 3.16.0 兼容的版本
- **最低**: 支持 `@opencode-ai/plugin` 1.2.16 的版本

### 依赖版本

```json
{
  "@opencode-ai/plugin": "1.2.16",
  "@bohuyeshan/openagent-labforge-core": "^3.13.4"
}
```

**重要**: 不要使用 `@opencode-ai/plugin` 1.14.x，API 不兼容。

---

## 参考资源

- [OpenAgent Labforge README](../README.md)
- [安装指南](./installation.md)
- [OpenCode 官方文档](https://opencode.ai/docs/)
- [OpenCode 插件文档](https://opencode.ai/docs/plugins/)

---

## 总结

**关键点**:
1. ✅ 必须在 `opencode.json` 和 `tui.json` 中都注册插件
2. ✅ 使用 `file:///` 协议和绝对路径
3. ✅ 确保插件已构建（dist 目录存在）
4. ✅ 使用正确的 `@opencode-ai/plugin` 版本（1.2.16）
5. ✅ 完全重启 OpenCode 以加载更改

**如果遇到问题**:
1. 检查两个配置文件中的插件路径是否一致
2. 查看 OpenCode 日志
3. 删除 `node_modules` 并重新安装
4. 确认插件已正确构建
