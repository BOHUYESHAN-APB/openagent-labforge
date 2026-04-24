# TUI Agent 模型偏好配置 - 实现进度

## 已完成 ✅

### Phase 1: 基础设施
- ✅ 创建 `ModelSelectionConfigSchema` (src/config/schema/model-selection.ts)
- ✅ 集成到主配置 schema (src/config/schema/oh-my-opencode-config.ts)
- ✅ 导出 schema (src/config/schema.ts)
- ✅ 创建 `auto-model-selector.ts` 核心逻辑
  - `detectDeepSeekAvailability()` - 检测 DeepSeek 可用性
  - `isModelAvailable()` - 检查模型是否可用
  - `selectModelForAgent()` - 为 agent 选择模型
  - `selectModelForCategory()` - 为 category 选择模型
  - `getAllAvailableModels()` - 获取所有可用模型

### Phase 3: 集成到模型选择逻辑 ✅
已更新以下文件以使用 auto 模式：

1. **src/tools/delegate-task/category-resolver.ts**
   - 导入 `selectModelForCategory` 和 `loadPluginConfig`
   - 在模型选择优先级中添加 auto 模式作为第一优先级
   - 优先级：auto → explicit → inherited → sisyphus-junior → category default

2. **src/tools/delegate-task/subagent-resolver.ts**
   - 导入 `selectModelForAgent` 和 `loadPluginConfig`
   - 在模型选择优先级中添加 auto 模式作为第一优先级
   - 优先级：auto → explicit → inherited → agent default

3. **src/shared/init-model-preferences.ts** (新建)
   - `initializeDefaultModelPreferences()` - 生成默认模型偏好配置
   - 主代理使用 DeepSeek V4-Pro (T0级) 或 Claude Opus 4.6
   - 子代理使用 DeepSeek V4-Flash (T1级) 或 Claude Haiku 4.5
   - 根据 DeepSeek 可用性自动选择

## 待实现 🔄

### Phase 2: TUI 界面 ✅ 已完成

**已完成** ✅：
1. 添加 "model-selection" 到 SettingsEntry 类型
2. 在 openRoot 中添加 model-selection 路由和主菜单入口
3. 创建 openModelSelection() 主页面
   - 显示 auto 模式开关
   - 显示 DeepSeek 可用性
   - 入口到 Agent/Category 配置
4. 实现 openAgentPreferences() - Agent 列表页面
   - 列出所有可配置的 agents
   - 显示每个 agent 的当前配置
5. 实现 openAgentPreferenceDetail() - 单个 Agent 配置页面
   - 配置 preferred_model
   - 管理 fallback_models
   - 重置为默认
6. 实现 openCategoryPreferences() - Category 列表页面
   - 列出所有 categories
   - 显示每个 category 的当前配置
7. 实现 openCategoryPreferenceDetail() - 单个 Category 配置页面
   - 配置 preferred_model
   - 管理 fallback_models
   - 重置为默认
8. 实现 openModelSelectionDialog() - 模型选择对话框
   - 从 OpenCode cache 读取可用模型
   - 按 provider 分组显示
   - 显示模型上下文大小
9. 实现 openFallbackModelsManager() - Fallback 模型管理
   - 添加/删除 fallback 模型
   - 按优先级顺序显示

### Phase 3: 集成到模型选择逻辑
需要更新以下文件以使用 auto 模式：

1. **src/tools/delegate-task/subagent-resolver.ts**
   ```typescript
   import { selectModelForAgent } from "../../shared/auto-model-selector"
   
   export function resolveSubagentModel(agentName: string, inheritedModel?: string): string {
     const config = readEffectiveConfig(directory)
     
     // 1. 尝试 auto 模式
     const autoModel = selectModelForAgent(agentName, config)
     if (autoModel) {
       return autoModel
     }
     
     // 2. 用户显式配置
     const agentOverride = config.agents?.[agentName]
     if (agentOverride?.model) {
       return agentOverride.model
     }
     
     // 3. 继承父代理模型
     if (inheritedModel) {
       return inheritedModel
     }
     
     // 4. 使用 model-requirements.ts 的 fallback chain
     // ... 现有逻辑
   }
   ```

2. **src/tools/delegate-task/category-resolver.ts**
   ```typescript
   import { selectModelForCategory } from "../../shared/auto-model-selector"
   
   export function resolveCategoryModel(category: string, inheritedModel?: string): string {
     const config = readEffectiveConfig(directory)
     
     // 1. 尝试 auto 模式
     const autoModel = selectModelForCategory(category, config)
     if (autoModel) {
       return autoModel
     }
     
     // 2. 用户显式配置
     const categoryOverride = config.categories?.[category]
     if (categoryOverride?.model) {
       return categoryOverride.model
     }
     
     // 3. 继承父代理模型
     if (inheritedModel) {
       return inheritedModel
     }
     
     // 4. 使用 DEFAULT_CATEGORIES
     // ... 现有逻辑
   }
   ```

### Phase 4: 初始化默认配置 (待集成)
在插件初始化时生成默认的模型偏好配置：

**src/shared/init-model-preferences.ts** ✅ 已创建
- `initializeDefaultModelPreferences()` 函数已实现
- 根据 DeepSeek 可用性自动配置
- 主代理使用 T0 级模型，子代理使用 T1 级模型

**待完成**：
- 在插件初始化时调用 `initializeDefaultModelPreferences()`
- 如果用户配置中没有 `model_selection`，自动生成默认配置
- 可能的集成点：`src/plugin-state.ts` 或 `src/plugin-config.ts`

## 推荐配置说明

### DeepSeek V4 模型梯队

1. **DeepSeek V4-Pro (T0级)**
   - 性能：与 GPT-5.4 / Claude Opus 4.6 相当
   - 价格：$0.28-0.30/M tokens
   - 上下文：1M tokens
   - 用途：主代理（sisyphus, wase, prometheus, oracle 等）

2. **DeepSeek V4-Flash (T1级)**
   - 性能：T1 级，完全够用
   - 价格：更便宜（约 Pro 的 1/3）
   - 上下文：1M tokens
   - 用途：子代理（librarian, explore, github-scout 等）

### 为什么推荐 DeepSeek？

1. **性价比无敌**：T0 级性能，价格仅为竞品的 1/20 到 1/50
2. **Flash 完全够用**：T1 级性能对于子代理任务完全足够
3. **大上下文**：1M tokens 适合大型项目
4. **用户友好**：绝大多数用户都能负担得起

### Phase 4: 初始化默认配置 ✅ 已完成

**已完成** ✅：
- 在 `src/plugin-config.ts` 中集成 `initializeDefaultModelPreferences()`
- 在 `loadPluginConfig()` 函数中检查 `model_selection` 配置
- 如果未配置，自动生成默认配置（DeepSeek V4 优先）
- 添加日志记录配置初始化过程

**工作原理**：
1. 插件加载时，`loadPluginConfig()` 合并用户和项目配置
2. 检查 `config.model_selection` 是否存在或为空
3. 如果未配置，调用 `initializeDefaultModelPreferences()` 生成默认值
4. 默认配置包含：
   - `enable_auto_provider: true`
   - `deepseek_available: <auto-detected>`
   - 所有 agents 的 DeepSeek V4 偏好
   - 所有 categories 的 DeepSeek V4 偏好

## 全部完成 🎉

所有 4 个阶段已完成：
- ✅ Phase 1: 基础设施 (schema, auto-model-selector)
- ✅ Phase 2: TUI 界面 (完整的模型选择设置页面)
- ✅ Phase 3: 集成到模型选择逻辑 (category-resolver, subagent-resolver)
- ✅ Phase 4: 初始化默认配置 (plugin-config.ts)

## 使用方法

### 自动初始化（推荐）
插件启动时会自动检测并初始化 DeepSeek V4 模型偏好。无需手动配置。

### TUI 配置
通过 `/ol-settings` → Model Selection Settings 可以：
- 启用/禁用 auto provider 模式
- 配置每个 agent 的首选模型和备用模型
- 配置每个 category 的首选模型和备用模型
- 从可用模型列表中选择（按 provider 分组）

## 手动配置示例

用户也可以在 `.opencode/openagent-labforge.jsonc` 中手动配置：

```jsonc
{
  "model_selection": {
    "enable_auto_provider": true,
    "deepseek_available": true,
    "agent_preferences": {
      "sisyphus": {
        "preferred_model": "deepseek/deepseek-v4-pro",
        "fallback_models": ["openai/gpt-5.4", "openai/o1"]
      },
      "librarian": {
        "preferred_model": "deepseek/deepseek-v4-flash",
        "fallback_models": ["openai/gpt-4o", "google/gemini-3-flash"]
      }
    },
    "category_preferences": {
      "quick": {
        "preferred_model": "deepseek/deepseek-v4-flash",
        "fallback_models": ["openai/gpt-4o"]
      },
      "ultrabrain": {
        "preferred_model": "deepseek/deepseek-v4-pro",
        "fallback_models": ["openai/gpt-5.3-codex", "openai/gpt-5.4"]
      }
    }
  }
}
```

Auto 模式现在完全可用！
