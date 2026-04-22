# Agent 显示模式说明

## 问题背景

使用智能路由后，系统默认只显示少量 agent（5-6个），虽然简化了界面，但降低了用户的控制能力和效率。

## 解决方案

新增 **三种显示模式**，用户可以根据需求选择：

### 1. Minimal 模式（默认）

**适合**：新手用户，追求简洁体验

**显示的 agent**（5-6个）：
- `sisyphus` - 主编排器
- `prometheus` - 规划师
- `orchestrator` - 执行编排器
- `wase` - 通用全自动
- `atlas` - 轻量执行
- `bio-autopilot` - 生信自动驾驶（如果启用生信领域）

**特点**：
- 界面最简洁
- 智能路由自动选择合适的 agent
- 适合不熟悉各个 agent 职责的用户

### 2. Standard 模式

**适合**：中级用户，需要更多控制

**显示的 agent**（8个）：
- Minimal 模式的所有 agent
- `hephaestus` - 深度执行
- `bio-pipeline-operator` - 生信管道执行

**特点**：
- 平衡简洁性和控制力
- 暴露了一些常用的专业 agent
- 适合有一定经验的用户

### 3. Full 模式（新增）

**适合**：高级用户，需要完全控制

**显示的 agent**（20+ 个）：

**主要执行 agents**：
- `sisyphus` - 主编排器
- `wase` - 通用全自动
- `atlas` - 轻量执行
- `hephaestus` - 深度执行

**规划和编排**：
- `prometheus` - 规划师
- `orchestrator` - 通用编排器
- `bio-orchestrator` - 生信编排器
- `engineering-orchestrator` - 工程编排器
- `bio-planner` - 生信规划器

**专业调查工具**：
- `oracle` - 架构咨询
- `librarian` - 文档查询
- `explore` - 代码探索
- `metis` - 元知识
- `momus` - 代码审查

**生信专家**：
- `bio-methodologist` - 生信方法学家
- `bio-pipeline-operator` - 管道执行
- `wet-lab-designer` - 湿实验设计
- `paper-evidence-synthesizer` - 文献证据综合
- `multimodal-looker` - 多模态分析

**其他工具**：
- `github-scout` - GitHub 搜索
- `tech-scout` - 技术侦察
- `acceptance-reviewer` - 验收审查
- `article-writer` - 文章写作
- `scientific-writer` - 科学写作

**Swarm agents**（如果启用）：
- `swarm-coordinator` - 蜂群协调器
- `swarm-worker` - 蜂群工作者
- `swarm-specialist` - 蜂群专家

**特点**：
- 显示所有可用 agent
- 用户可以直接选择最合适的 agent
- 最大化控制能力和效率
- 适合熟悉系统架构的高级用户

## 配置方法

在 `.opencode/openagent-labforge.json` 中配置：

```json
{
  "agent_display": {
    "agent_display_mode": "full"
  }
}
```

可选值：
- `"minimal"` - 默认，5-6 个 agent
- `"standard"` - 8 个 agent
- `"full"` - 所有 agent

## 与智能路由的关系

- **Minimal/Standard 模式**：依赖智能路由自动选择合适的 agent
- **Full 模式**：用户可以直接选择，绕过智能路由

智能路由配置：

```json
{
  "agent_display": {
    "intelligent_routing": {
      "enabled": true  // 可以设置为 false 完全禁用路由
    }
  }
}
```

## 领域开关

无论哪种显示模式，都可以通过领域开关控制特定领域的 agent：

```json
{
  "agent_display": {
    "enable_domains": {
      "bioinformatics": true,  // 显示生信相关 agent
      "engineering": true      // 显示工程相关 agent
    }
  }
}
```

## 细粒度控制

如果需要更精细的控制，可以使用：

```json
{
  "agent_display": {
    "agent_display_mode": "full",
    "disabled_agents": ["momus", "tech-scout"],  // 隐藏特定 agent
    "enabled_agents": []  // 如果非空，只显示列表中的 agent
  }
}
```

## 推荐配置

### 新手用户
```json
{
  "agent_display": {
    "agent_display_mode": "minimal",
    "intelligent_routing": {
      "enabled": true
    }
  }
}
```

### 中级用户
```json
{
  "agent_display": {
    "agent_display_mode": "standard",
    "intelligent_routing": {
      "enabled": true
    }
  }
}
```

### 高级用户（追求效率和控制）
```json
{
  "agent_display": {
    "agent_display_mode": "full",
    "intelligent_routing": {
      "enabled": false  // 可选：完全禁用自动路由
    }
  }
}
```

### 纯工程用户
```json
{
  "agent_display": {
    "agent_display_mode": "full",
    "enable_domains": {
      "bioinformatics": false,
      "engineering": true
    }
  }
}
```

### 纯生信用户
```json
{
  "agent_display": {
    "agent_display_mode": "full",
    "enable_domains": {
      "bioinformatics": true,
      "engineering": true  // 工程能力仍然需要
    }
  }
}
```

## 迁移指南

如果你之前使用的是旧版本（显示 8-10 个 agent），现在想恢复：

1. 打开 `.opencode/openagent-labforge.json`
2. 添加或修改：
   ```json
   {
     "agent_display": {
       "agent_display_mode": "full"
     }
   }
   ```
3. 重启 OpenCode

这样就能看到所有可用的 agent，恢复原来的控制能力。

## 注意事项

1. **Full 模式不会影响性能**：agent 只有在被调用时才会消耗资源
2. **Swarm agents 需要单独启用**：即使在 Full 模式下，swarm agents 也需要在配置中启用 swarm 功能
3. **自定义 agent 总是显示**：通过 `.claude/agents/` 注册的自定义 agent 不受显示模式限制
