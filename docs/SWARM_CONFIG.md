# Swarm Agent 配置说明

## 配置文件位置

用户级配置：`~/.opencode/openagent-labforge.json`
项目级配置：`{project}/.opencode/openagent-labforge.json`

## Swarm 配置选项

在配置文件中添加 `experimental.swarm` 部分：

```json
{
  "experimental": {
    "swarm": {
      "enabled": true,
      "max_workers": 5,
      "heartbeat_interval_ms": 10000,
      "heartbeat_timeout_ms": 30000,
      "auto_cleanup": true
    }
  }
}
```

## 配置项说明

### `enabled` (boolean, 默认: false)
- 是否启用 swarm 模式
- 设置为 `true` 后，orchestrator 才能启动 swarm-coordinator

### `max_workers` (number, 默认: 5, 范围: 1-20)
- 最大并发 worker 数量
- **根据模型和资源调整**：
  - **Haiku/小模型**: 可以设置 10-20（便宜、快速）
  - **Sonnet/中等模型**: 建议 5-10（平衡性能和成本）
  - **Opus/大模型**: 建议 2-5（昂贵、慢速）
- 超过此限制时，coordinator 会等待现有 worker 完成

### `heartbeat_interval_ms` (number, 默认: 10000)
- Worker 更新心跳的间隔（毫秒）
- 建议值：5000-15000
- 太短会增加文件 I/O，太长会延迟失败检测

### `heartbeat_timeout_ms` (number, 默认: 30000)
- 心跳超时时间（毫秒）
- Worker 超过此时间未更新心跳视为失败
- 建议值：20000-60000
- 应该是 `heartbeat_interval_ms` 的 2-3 倍

### `auto_cleanup` (boolean, 默认: true)
- 是否自动清理完成的 swarm 目录
- `true`: swarm 完成后自动删除 `.opencode/openagent-labforge/swarm/{id}/`
- `false`: 保留所有 swarm 目录（用于调试）

## 使用示例

### 场景 1: 本地开发（资源充足）

```json
{
  "experimental": {
    "swarm": {
      "enabled": true,
      "max_workers": 10,
      "heartbeat_interval_ms": 5000,
      "heartbeat_timeout_ms": 15000,
      "auto_cleanup": true
    }
  }
}
```

### 场景 2: 生产环境（成本敏感）

```json
{
  "experimental": {
    "swarm": {
      "enabled": true,
      "max_workers": 3,
      "heartbeat_interval_ms": 10000,
      "heartbeat_timeout_ms": 30000,
      "auto_cleanup": true
    }
  }
}
```

### 场景 3: 调试模式

```json
{
  "experimental": {
    "swarm": {
      "enabled": true,
      "max_workers": 2,
      "heartbeat_interval_ms": 5000,
      "heartbeat_timeout_ms": 20000,
      "auto_cleanup": false
    }
  }
}
```

## 模型推荐配置

| 模型类型 | max_workers | 原因 |
|---------|-------------|------|
| Claude Haiku | 10-15 | 便宜、快速，适合大量并行 |
| Claude Sonnet | 5-8 | 平衡性能和成本 |
| Claude Opus | 2-3 | 昂贵、慢速，限制并发 |
| GPT-4o-mini | 10-15 | 便宜、快速 |
| GPT-4o | 5-8 | 中等成本 |
| GPT-4 | 2-3 | 昂贵 |

## 动态调整建议

未来可以实现根据用户选择的模型自动调整 `max_workers`：

```typescript
function getRecommendedMaxWorkers(model: string): number {
  if (model.includes("haiku") || model.includes("mini")) {
    return 10
  } else if (model.includes("sonnet") || model.includes("gpt-4o")) {
    return 5
  } else if (model.includes("opus") || model.includes("gpt-4")) {
    return 3
  }
  return 5 // 默认值
}
```

## 注意事项

1. **Token 消耗**: `max_workers` 越大，并发 API 调用越多，token 消耗越快
2. **API 限制**: 某些 API 提供商有并发请求限制
3. **内存使用**: 每个 worker 都是独立的 session，会占用内存
4. **文件 I/O**: 心跳和结果文件会频繁读写，SSD 性能更好

## 禁用 Swarm

如果不需要 swarm 功能，可以：

1. 不配置 `experimental.swarm`（默认禁用）
2. 或显式设置 `enabled: false`
3. 或在 `disabled_agents` 中添加 swarm agents：

```json
{
  "disabled_agents": [
    "swarm-coordinator",
    "swarm-worker",
    "swarm-specialist"
  ]
}
```
