# TUI Context Visualization Implementation Summary

## 完成时间
2026-04-25

## 实现内容

### 1. 滚动条问题 ✅
**状态：已修复**

- 问题：OpenCode 默认隐藏滚动条
- 解决方案：在首次安装插件时自动启用滚动条
- 文件：`src/tui/index.ts` (第15-21行)

### 2. 右侧上下文可视化 ✅
**状态：已实现**

实现了 Magic Context 的 TUI 侧边栏可视化，实时显示上下文占比和统计信息。

## 新增文件

### 1. `src/tui/slots/magic-context-sidebar.tsx`
**功能：** Magic Context 侧边栏组件

**组件结构：**
- `TokenBreakdown` - Token 分段条形图
  - 使用不同颜色显示各类 token 占比
  - 紫色：System Prompt
  - 蓝色：Compartments
  - 绿色：Memories
  - 灰色：Conversation
  
- `StatRow` - 统计行组件
  - 显示标签-值对
  - 支持不同颜色主题（accent, warning, dim）

- `SectionHeader` - 区块标题组件

- `MagicContextSidebar` - 主容器组件
  - 实时监听会话更新事件
  - 自动刷新数据（150ms 防抖）
  - 显示完整的 Magic Context 统计信息

**显示内容：**
- Token 占比可视化条
- Cache TTL 信息
- Tags 统计（Active/Compacted）
- Storage 统计（Compartments/Memories）
- 待处理操作队列
- 压缩统计

### 2. 修改文件

#### `src/tui/index.ts`
- 添加 Magic Context 侧边栏 slot 注册
- 使用 `sidebar_content` slot（OpenCode 原生支持）

#### `src/tui/types.ts`
- 扩展 `TuiPluginApi` 类型定义
- 添加 `slot`, `event`, `renderer` 属性

#### `package.json`
- 更新构建命令，将 `solid-js` 和 `@opentui/solid` 标记为外部依赖
- 这些依赖由 OpenCode 运行时提供

#### `tsconfig.json`
- 添加 JSX 支持配置
- 设置 `jsxImportSource` 为 `@opentui/solid`

## 技术实现

### 数据层
使用现有的 `src/features/magic-context/tui-snapshot.ts`：
- `captureMagicContextSnapshot()` - 生成快照数据
- 从 Magic Context 存储读取数据
- 估算 token 数量

### UI 层
使用 Solid.js + OpenTUI：
- JSX 语法
- Solid.js 响应式系统
- OpenTUI 终端 UI 组件（box, text, scrollbox）

### 事件系统
监听 OpenCode 事件：
- `message.updated` - 消息更新
- `session.updated` - 会话更新
- `message.removed` - 消息删除

### 刷新机制
- 防抖刷新（150ms）
- 会话切换时自动刷新
- 事件驱动更新

## 使用方式

### 启用 Magic Context
在配置文件中启用：
```jsonc
{
  "experimental": {
    "magic_context": {
      "enabled": true,
      "cache_ttl": "5m",
      "async_compression": true
    }
  }
}
```

### 查看侧边栏
1. 启动 OpenCode TUI
2. 打开任意会话
3. 侧边栏自动显示 Magic Context 统计信息
4. 宽屏模式下自动显示，窄屏可通过快捷键切换

## 特性

### 实时更新
- 发送消息后自动更新统计
- 压缩完成后更新 compartments 数量
- TTL 倒计时实时显示

### 可视化
- Token 占比分段条形图
- 颜色编码（紫/蓝/绿/灰）
- 百分比和绝对值显示

### 性能优化
- 防抖刷新避免频繁更新
- 按需渲染
- 轻量级数据读取

## 兼容性

### OpenCode 版本
- 需要 OpenCode 支持 `sidebar_content` slot
- 需要 Solid.js 运行时环境

### Magic Context
- 仅在 Magic Context 启用时显示
- 禁用时不渲染组件

## 测试

### 构建测试
```bash
bun run build
```
✅ 构建成功

### 手动测试清单
- [ ] 启动 TUI，检查侧边栏显示
- [ ] 发送消息，观察统计更新
- [ ] 切换会话，验证数据正确
- [ ] 等待 TTL 过期，观察压缩触发
- [ ] 检查 token 占比条显示正确
- [ ] 验证颜色主题适配

## 已知限制

### Token 估算
当前使用简单估算（1 token ≈ 4 字符）：
- 不够精确
- 未来可以集成 tiktoken 或使用 OpenCode API

### 数据来源
直接从 JSON 文件读取：
- 无 RPC 服务器
- 比原版 Magic Context 简化
- 足够满足基本需求

### 实时性
150ms 防抖延迟：
- 避免频繁刷新
- 可能有轻微延迟
- 可根据需要调整

## 未来改进

### P1（重要）
- [ ] 集成 tiktoken 进行精确 token 计数
- [ ] 添加动画效果（脉冲、渐变）
- [ ] 支持自定义颜色主题

### P2（可选）
- [ ] 添加详细统计弹窗
- [ ] 支持导出统计数据
- [ ] 添加历史趋势图
- [ ] 性能监控和优化

### P3（增强）
- [ ] 支持多会话对比
- [ ] 添加告警阈值设置
- [ ] 集成 Dreamer 状态显示
- [ ] 支持自定义布局

## 参考资料

### 原版实现
- Magic Context: `Future/clone/opencode-magic-context/packages/plugin/src/tui/slots/sidebar-content.tsx`
- 数据层: `Future/clone/opencode-magic-context/packages/plugin/src/tui/data/context-db.ts`

### OpenCode 文档
- TUI Plugin API: `node_modules/@opencode-ai/plugin/dist/tui.d.ts`
- Sidebar 组件: `Future/clone/opencode/packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`

## 总结

成功实现了 Magic Context 的 TUI 可视化功能：

✅ **滚动条问题** - 已修复  
✅ **右侧上下文可视化** - 已实现  
✅ **实时更新** - 已实现  
✅ **Token 占比条** - 已实现  
✅ **统计信息** - 已实现  
✅ **构建成功** - 无错误  

系统已准备好在 OpenCode TUI 中使用！
