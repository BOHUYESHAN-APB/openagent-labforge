# TUI Context Visualization Implementation Plan

## 目标

在 OpenAgent Labforge 的 TUI 中添加右侧边栏，实时显示上下文占比的可视化 UI。

## 参考实现

Magic Context 原版实现：
- 文件：`Future/clone/opencode-magic-context/packages/plugin/src/tui/slots/sidebar-content.tsx`
- 数据层：`Future/clone/opencode-magic-context/packages/plugin/src/tui/data/context-db.ts`

## 核心功能

### 1. 可视化组件

**Token Breakdown Bar（上下文占比条）**
- 分段显示不同组件的 token 占比
- 使用不同颜色区分：
  - System Prompt（紫色）
  - Compartments（蓝色）
  - Facts（黄色/橙色）
  - Memories（绿色）
  - Conversation（灰色）
  - Tool Calls（深灰）
  - Tool Definitions（浅灰）

**统计信息**
- Historian 状态（运行中/空闲）
- Compartments 数量
- Facts 数量
- Memories 数量
- 待处理操作队列
- 最后运行时间

### 2. 数据结构

```typescript
interface SidebarSnapshot {
  sessionId: string
  usagePercentage: number
  inputTokens: number
  systemPromptTokens: number
  compartmentTokens: number
  factTokens: number
  memoryTokens: number
  conversationTokens: number
  toolCallTokens: number
  toolDefinitionTokens: number
  compartmentCount: number
  factCount: number
  memoryCount: number
  memoryBlockCount: number
  pendingOpsCount: number
  historianRunning: boolean
  lastDreamerRunAt: number | null
}
```

## 实现步骤

### Phase 1: 数据层（简化版）

由于我们没有 RPC 服务器，需要直接从存储读取数据：

**文件：`src/features/magic-context/tui-snapshot.ts`**
```typescript
// 从 Magic Context 存储读取数据并生成快照
export async function generateSidebarSnapshot(
  sessionId: string,
  directory: string
): Promise<SidebarSnapshot>
```

需要读取：
- `tags.json` - 获取 tag 统计
- `compartments/{sessionId}.json` - 获取 compartments
- `memories/{projectHash}.json` - 获取 memories
- `pending-ops.json` - 获取待处理操作
- `session-meta/{sessionId}.json` - 获取会话元数据

### Phase 2: TUI 组件

**文件：`src/tui/slots/magic-context-sidebar.tsx`**

使用 Solid.js + OpenTUI 创建组件：
- `TokenBreakdown` - 分段条形图
- `StatRow` - 统计行
- `SectionHeader` - 区块标题
- `SidebarContent` - 主容器

### Phase 3: 集成到 TUI 插件

**文件：`src/tui/index.ts`**

注册 sidebar slot：
```typescript
api.slot.register({
  order: 150,
  slots: {
    sidebar_content: (ctx, value) => {
      return <MagicContextSidebar sessionID={value.session_id} />
    }
  }
})
```

### Phase 4: 实时更新

监听事件并刷新数据：
- `message.updated` - 消息更新
- `session.updated` - 会话更新
- `message.removed` - 消息删除

使用防抖（150ms）避免频繁刷新。

## 技术栈

- **UI 框架**：Solid.js（OpenCode TUI 使用）
- **渲染**：OpenTUI（基于 Ink/React-Ink 的终端 UI）
- **数据源**：直接读取 JSON 文件（简化版，无 RPC）
- **样式**：使用 theme 颜色系统

## 简化方案（MVP）

由于我们的实现比原版简单（无 RPC 服务器），可以先实现核心功能：

1. **基础可视化**
   - Token 占比条（简化版，只显示主要类别）
   - 基本统计信息

2. **数据来源**
   - 直接从 Magic Context 存储读取
   - 使用现有的 storage 模块

3. **更新机制**
   - 监听 OpenCode 事件
   - 定时刷新（可选）

## 文件清单

### 新建文件
1. `src/features/magic-context/tui-snapshot.ts` - 数据快照生成
2. `src/tui/slots/magic-context-sidebar.tsx` - 侧边栏组件
3. `src/tui/components/token-breakdown.tsx` - Token 分段条（可选拆分）
4. `src/tui/components/stat-row.tsx` - 统计行组件（可选拆分）

### 修改文件
1. `src/tui/index.ts` - 注册 sidebar slot

## 依赖检查

需要确认：
- ✅ OpenCode TUI API 支持 `sidebar_content` slot
- ✅ Solid.js 已安装（OpenCode 依赖）
- ✅ Magic Context 存储已实现
- ⚠️ 需要添加 token 计数功能（如果还没有）

## Token 计数实现

如果当前没有 token 计数，需要添加：

**选项 1：使用 OpenCode API**
```typescript
// 从 session messages 获取 token 统计
const messages = await ctx.client.session.messages({ path: { id: sessionId } })
// 解析 usage 信息
```

**选项 2：估算**
```typescript
// 简单估算：1 token ≈ 4 字符
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
```

**选项 3：使用 tiktoken**
```typescript
import { encoding_for_model } from "tiktoken"
const enc = encoding_for_model("gpt-4")
const tokens = enc.encode(text).length
```

## 测试计划

1. **单元测试**
   - `tui-snapshot.ts` 数据生成逻辑
   - Token 计数准确性

2. **集成测试**
   - 侧边栏正确显示
   - 实时更新工作正常
   - 不同会话切换正常

3. **手动测试**
   - 启动 TUI，检查侧边栏
   - 发送消息，观察更新
   - 切换会话，验证数据正确

## 时间估算

- Phase 1（数据层）：2-3 小时
- Phase 2（UI 组件）：3-4 小时
- Phase 3（集成）：1-2 小时
- Phase 4（实时更新）：1-2 小时
- 测试和调试：2-3 小时

**总计：9-14 小时**

## 优先级

1. **P0（必须）**
   - 基础侧边栏显示
   - Token 占比可视化
   - 基本统计信息

2. **P1（重要）**
   - 实时更新
   - 颜色主题适配
   - 错误处理

3. **P2（可选）**
   - 动画效果
   - 详细统计
   - 性能优化

## 注意事项

1. **性能**
   - 使用防抖避免频繁刷新
   - 缓存计算结果
   - 异步加载数据

2. **兼容性**
   - 确保 Magic Context 禁用时不显示
   - 优雅降级（数据不可用时显示占位符）

3. **用户体验**
   - 加载状态提示
   - 错误信息友好
   - 响应式布局

## 下一步

1. 确认 OpenCode TUI API 的 sidebar_content slot 支持
2. 实现 `tui-snapshot.ts` 数据层
3. 创建基础 UI 组件
4. 集成到 TUI 插件
5. 测试和优化
