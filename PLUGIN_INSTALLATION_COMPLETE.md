# 插件安装完成验证

## 安装时间
2026-04-25 15:05

## ✅ 安装状态

### 全局安装
```bash
npm list -g @bohuyeshan/openagent-labforge-core
```
**结果:** `@bohuyeshan/openagent-labforge-core@3.15.1` ✅

### 配置文件
**路径:** `C:\Users\BoHuYeShan\.config\opencode\opencode.json`

**配置内容:**
```json
{
  "plugin": [
    "@bohuyeshan/openagent-labforge-core@3.15.1",
    "opencode-pty@0.3.2"
  ]
}
```

### 安装位置
```
C:\Users\BoHuYeShan\AppData\Roaming\npm\node_modules\@bohuyeshan\openagent-labforge-core\
```

## ✅ 文件验证

### 核心文件
- ✅ `dist/index.js` (4.50 MB) - 主插件文件
- ✅ `dist/tui/index.js` (1.0 MB) - TUI 插件文件
- ✅ `dist/openagent-labforge.schema.json` - 配置 Schema

### Agents
- ✅ `dist/agents/` - 所有 agent 定义
- ✅ `dist/agents/historian/` - Historian agent（用于异步压缩）

### Magic Context
- ✅ `dist/features/magic-context/async-compression.d.ts` - 异步压缩
- ✅ `dist/features/magic-context/tui-snapshot.d.ts` - TUI 快照
- ✅ `dist/features/magic-context/storage/` - 存储层

### TUI 组件
- ✅ `dist/tui/index.js` - TUI 主文件
- ✅ `dist/tui/settings-controller.d.ts` - 设置控制器
- ✅ `dist/tui/slots/magic-context-sidebar.d.ts` - Magic Context 侧边栏

## 🚀 启动测试

### 1. 重启 OpenCode
```bash
# 如果 OpenCode 正在运行，先退出
# 然后重新启动
opencode
```

### 2. 验证插件加载
在 OpenCode TUI 中，应该能看到：
- ✅ 右侧 Magic Context 侧边栏（如果启用）
- ✅ 更多的 agent 选项（不只是 plan 和 builder）
- ✅ `/ol-` 开头的命令

### 3. 测试命令
```bash
/ol-settings          # 打开 OpenAgent 设置
/ol-ctx-status        # 查看 Magic Context 状态
/ol-ctx-flush         # 强制执行操作
```

### 4. 检查 Agents
按 `Ctrl+A`（或相应快捷键）切换 agent，应该能看到：
- ✅ sisyphus（默认）
- ✅ oracle
- ✅ librarian
- ✅ atlas
- ✅ historian
- ✅ 以及其他自定义 agents

## 🔍 故障排查

### 问题：插件未加载
**症状：** 只能看到 plan 和 builder，没有其他 agents

**解决方案：**
1. 检查配置文件：
   ```bash
   cat "C:\Users\BoHuYeShan\.config\opencode\opencode.json"
   ```
   确认 plugin 数组包含 `@bohuyeshan/openagent-labforge-core@3.15.1`

2. 验证全局安装：
   ```bash
   npm list -g @bohuyeshan/openagent-labforge-core
   ```

3. 重新安装：
   ```bash
   cd "D:\-Users-\Documents\GitHub\chat-model\openagent-labforge"
   npm pack
   npm install -g ./bohuyeshan-openagent-labforge-core-3.15.1.tgz --force
   ```

4. 完全重启 OpenCode（不只是退出 TUI，而是关闭整个进程）

### 问题：Magic Context 侧边栏不显示
**解决方案：**
1. 启用 Magic Context：
   ```bash
   /ol-settings
   # 选择 "Magic Context Settings"
   # 启用 "Toggle Magic Context"
   ```

2. 或者在项目配置文件中：
   ```jsonc
   // .opencode/openagent-labforge.json
   {
     "experimental": {
       "magic_context": {
         "enabled": true,
         "tui_sidebar": true
       }
     }
   }
   ```

### 问题：命令不可用
**症状：** `/ol-settings` 等命令无法识别

**解决方案：**
1. 确认插件已加载（检查启动日志）
2. 尝试重启 OpenCode
3. 检查是否有错误日志

## 📋 快速配置

### 启用所有功能
在项目目录创建 `.opencode/openagent-labforge.json`：

```jsonc
{
  "experimental": {
    "magic_context": {
      "enabled": true,
      "async_compression": true,
      "cache_ttl": "5m",
      "execute_threshold_percentage": 65,
      "tag_system_enabled": true,
      "cross_session_memories": true,
      "tui_sidebar": true
    }
  }
}
```

## ✅ 验证清单

安装后验证以下内容：

- [ ] OpenCode 启动无错误
- [ ] 可以看到多个 agent 选项（不只是 plan/builder）
- [ ] `/ol-settings` 命令可用
- [ ] `/ol-ctx-status` 命令可用
- [ ] 设置面板中有 "Magic Context Settings" 选项
- [ ] 启用 Magic Context 后右侧显示侧边栏
- [ ] 可以切换异步/同步压缩方式

## 🎉 总结

**插件已成功安装！**

- ✅ 包版本：3.15.1
- ✅ 安装方式：全局 npm 包
- ✅ 配置文件：已更新
- ✅ 所有文件：已验证

**下一步：**
1. 重启 OpenCode
2. 测试命令和功能
3. 配置 Magic Context
4. 开始使用！

如果遇到问题，请参考上面的故障排查部分。
