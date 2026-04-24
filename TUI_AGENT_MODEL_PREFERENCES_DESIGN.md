# TUI Agent 模型偏好配置设计

## 核心理解

用户需求：**在 TUI 设置界面中为每个 agent 配置模型偏好，让 auto 模式能够根据这些偏好自动选择模型。**

当前问题：auto 模式是空壳，没有实际的模型选择逻辑。

## 设计方案

### 1. 配置结构

```jsonc
{
  "model_selection": {
    // auto 服务商开关
    "enable_auto_provider": true,
    
    // DeepSeek 可用性（自动检测）
    "deepseek_available": false,
    
    // Agent 模型偏好配置
    "agent_preferences": {
      "sisyphus": {
        "preferred_model": "deepseek/deepseek-v4-pro",
        "fallback_models": [
          "anthropic/claude-opus-4-6",
          "openai/gpt-5.4"
        ]
      },
      "wase": {
        "preferred_model": "deepseek/deepseek-v4-pro",
        "fallback_models": [
          "anthropic/claude-opus-4-6"
        ]
      },
      "librarian": {
        "preferred_model": "deepseek/deepseek-v4-flash",
        "fallback_models": [
          "anthropic/claude-haiku-4-5",
          "google/gemini-3-flash"
        ]
      },
      // ... 其他 agents
    },
    
    // Category 模型偏好配置
    "category_preferences": {
      "quick": {
        "preferred_model": "deepseek/deepseek-v4-flash",
        "fallback_models": [
          "anthropic/claude-haiku-4-5"
        ]
      },
      "ultrabrain": {
        "preferred_model": "deepseek/deepseek-v4-pro",
        "fallback_models": [
          "openai/gpt-5.3-codex",
          "anthropic/claude-opus-4-6"
        ]
      },
      // ... 其他 categories
    }
  }
}
```

### 2. TUI 设置页面结构

```
OpenAgent Settings
├── Model Selection Settings (新增)
│   ├── Enable Auto Provider (开关)
│   ├── DeepSeek Availability (检测)
│   ├── Agent Model Preferences (子页面)
│   │   ├── Sisyphus
│   │   ├── Wase
│   │   ├── Prometheus
│   │   ├── Librarian
│   │   ├── Explore
│   │   └── ... (所有 agents)
│   └── Category Model Preferences (子页面)
│       ├── Quick
│       ├── Ultrabrain
│       ├── Deep
│       └── ... (所有 categories)
```

### 3. TUI 实现

#### 3.1 主页面：Model Selection Settings

```typescript
const openModelSelection = () => {
  const config = effectiveRecord()
  const enableAuto = getNestedBoolean(config, ["model_selection", "enable_auto_provider"])
  const deepseekAvailable = getNestedBoolean(config, ["model_selection", "deepseek_available"])

  api.ui.dialog.replace(() =>
    api.ui.DialogSelect({
      title: text("Model Selection Settings", "模型选择设置"),
      placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选设置 • 回车进入 • Esc 关闭"),
      options: [
        summaryRow(
          text("Current Status", "当前状态"),
          `Auto: ${booleanLabel(enableAuto)} • DeepSeek: ${booleanLabel(deepseekAvailable)}`,
          text("Current", "当前")
        ),
        {
          title: text("Enable Auto Provider", "启用 Auto 服务商"),
          value: "enable_auto",
          category: text("Core", "核心"),
          description: statusLabel(enableAuto),
        },
        {
          title: text("Detect DeepSeek Availability", "检测 DeepSeek 可用性"),
          value: "detect_deepseek",
          category: text("Core", "核心"),
          description: booleanLabel(deepseekAvailable, "✓ Available", "○ Not Available"),
        },
        {
          title: text("Configure Agent Preferences", "配置 Agent 模型偏好"),
          value: "agent_preferences",
          category: text("Configuration", "配置"),
          description: text("Set preferred models for each agent", "为每个 agent 设置偏好模型"),
        },
        {
          title: text("Configure Category Preferences", "配置 Category 模型偏好"),
          value: "category_preferences",
          category: text("Configuration", "配置"),
          description: text("Set preferred models for each category", "为每个 category 设置偏好模型"),
        },
        {
          title: text("Back", "返回"),
          value: "back",
          category: text("Navigation", "导航"),
        },
      ],
      onSelect: (option) => {
        if (option.value === "back") {
          openRoot("root")
          return
        }
        if (option.value === "enable_auto") {
          openBooleanDialog({
            title: text("Enable Auto Provider", "启用 Auto 服务商"),
            current: enableAuto,
            trueLabel: text("✓ Enable (Use preferences)", "✓ 启用（使用偏好配置）"),
            falseLabel: text("○ Disable (Manual override)", "○ 禁用（手动覆盖）"),
            onBack: openModelSelection,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["model_selection", "enable_auto_provider"], value),
                text("Updated auto provider", "已更新 auto 服务商"),
                openModelSelection,
              ),
          })
          return
        }
        if (option.value === "detect_deepseek") {
          const available = detectDeepSeekAvailability()
          save(
            (root) => setNestedValue(root, ["model_selection", "deepseek_available"], available),
            text(`DeepSeek ${available ? "available" : "not available"}`, `DeepSeek ${available ? "可用" : "不可用"}`),
            openModelSelection,
          )
          return
        }
        if (option.value === "agent_preferences") {
          openAgentPreferences()
          return
        }
        if (option.value === "category_preferences") {
          openCategoryPreferences()
          return
        }
      },
    })
  )
}
```

#### 3.2 Agent 偏好列表页面

```typescript
const openAgentPreferences = () => {
  const config = effectiveRecord()
  const agentPrefs = config["model_selection"]?.["agent_preferences"] as Record<string, { preferred_model?: string }> | undefined

  // 所有可配置的 agents
  const agents = [
    { name: "sisyphus", title: "Sisyphus", description: "智能调度" },
    { name: "wase", title: "Wase", description: "全自动执行" },
    { name: "prometheus", title: "Prometheus", description: "任务规划" },
    { name: "oracle", title: "Oracle", description: "架构设计" },
    { name: "hephaestus", title: "Hephaestus", description: "深度开发" },
    { name: "librarian", title: "Librarian", description: "文档搜索" },
    { name: "explore", title: "Explore", description: "代码探索" },
    { name: "atlas", title: "Atlas", description: "计划执行" },
    // ... 添加所有 agents
  ]

  api.ui.dialog.replace(() =>
    api.ui.DialogSelect({
      title: text("Agent Model Preferences", "Agent 模型偏好"),
      placeholder: text(SETTINGS_SELECT_PLACEHOLDER, "筛选 Agent • 回车配置 • Esc 返回"),
      options: [
        summaryRow(
          text("Agent Preferences", "Agent 偏好配置"),
          text("Configure preferred models for each agent", "为每个 agent 配置偏好模型"),
          text("Info", "信息")
        ),
        ...agents.map(agent => {
          const pref = agentPrefs?.[agent.name]
          const preferredModel = pref?.preferred_model
          return {
            title: agent.title,
            value: agent.name,
            category: text("Agents", "代理"),
            description: preferredModel 
              ? `${agent.description} • ${preferredModel}`
              : `${agent.description} • ${text("Not configured", "未配置")}`,
          }
        }),
        {
          title: text("Back", "返回"),
          value: "back",
          category: text("Navigation", "导航"),
        },
      ],
      onSelect: (option) => {
        if (option.value === "back") {
          openModelSelection()
          return
        }
        const agent = agents.find(a => a.name === option.value)
        if (agent) {
          openAgentPreferenceDetail(agent.name, agent.title, agent.description)
        }
      },
    })
  )
}
```

#### 3.3 单个 Agent 偏好配置页面

```typescript
const openAgentPreferenceDetail = (agentName: string, agentTitle: string, agentDescription: string) => {
  const config = effectiveRecord()
  const pref = config["model_selection"]?.["agent_preferences"]?.[agentName] as { 
    preferred_model?: string
    fallback_models?: string[]
  } | undefined

  const preferredModel = pref?.preferred_model
  const fallbackModels = pref?.fallback_models ?? []

  api.ui.dialog.replace(() =>
    api.ui.DialogSelect({
      title: `${agentTitle} ${text("Preferences", "偏好")}`,
      placeholder: text(SETTINGS_SUBPAGE_PLACEHOLDER, "筛选选项 • 回车确认 • Esc 返回"),
      options: [
        summaryRow(
          text("Current Configuration", "当前配置"),
          `${text("Preferred", "偏好")}: ${preferredModel || text("None", "无")} • ${text("Fallbacks", "备选")}: ${fallbackModels.length}`,
          text("Current", "当前")
        ),
        {
          title: text("Set Preferred Model", "设置偏好模型"),
          value: "preferred",
          category: text("Configuration", "配置"),
          description: preferredModel || text("Not set", "未设置"),
        },
        {
          title: text("Manage Fallback Models", "管理备选模型"),
          value: "fallbacks",
          category: text("Configuration", "配置"),
          description: `${fallbackModels.length} ${text("models", "个模型")}`,
        },
        {
          title: text("Reset to Default", "重置为默认"),
          value: "reset",
          category: text("Actions", "操作"),
          description: text("Clear all preferences for this agent", "清除此 agent 的所有偏好"),
        },
        {
          title: text("Back", "返回"),
          value: "back",
          category: text("Navigation", "导航"),
        },
      ],
      onSelect: (option) => {
        if (option.value === "back") {
          openAgentPreferences()
          return
        }
        if (option.value === "preferred") {
          openModelSelectionDialog({
            title: `${agentTitle} ${text("Preferred Model", "偏好模型")}`,
            current: preferredModel,
            onBack: () => openAgentPreferenceDetail(agentName, agentTitle, agentDescription),
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["model_selection", "agent_preferences", agentName, "preferred_model"], value),
                text("Updated preferred model", "已更新偏好模型"),
                () => openAgentPreferenceDetail(agentName, agentTitle, agentDescription),
              ),
          })
          return
        }
        if (option.value === "fallbacks") {
          openFallbackModelsManager(agentName, agentTitle, agentDescription, fallbackModels)
          return
        }
        if (option.value === "reset") {
          save(
            (root) => {
              const modelSelection = root["model_selection"] as Record<string, unknown> | undefined
              if (modelSelection?.["agent_preferences"]) {
                const prefs = modelSelection["agent_preferences"] as Record<string, unknown>
                delete prefs[agentName]
              }
            },
            text("Reset agent preferences", "已重置 agent 偏好"),
            openAgentPreferences,
          )
        }
      },
    })
  )
}
```

#### 3.4 模型选择对话框（从 OpenCode cache 读取）

```typescript
const openModelSelectionDialog = (args: {
  title: string
  current: string | undefined
  onBack: () => void
  onConfirm: (value: string) => void
}) => {
  const cache = readProviderModelsCache()
  const modelOptions: TuiDialogSelectOption<string>[] = []

  if (cache) {
    // 按 provider 分组
    const providerGroups: Record<string, ModelMetadata[]> = {}
    
    for (const [providerID, models] of Object.entries(cache.models)) {
      if (!Array.isArray(models)) continue
      
      for (const model of models) {
        if (typeof model === 'object' && model !== null && 'id' in model) {
          const metadata = model as ModelMetadata
          if (!providerGroups[providerID]) {
            providerGroups[providerID] = []
          }
          providerGroups[providerID].push(metadata)
        }
      }
    }

    // 优先显示常用 providers
    const priorityProviders = ['deepseek', 'anthropic', 'openai', 'google', 'opencode']
    const sortedProviders = [
      ...priorityProviders.filter(p => providerGroups[p]),
      ...Object.keys(providerGroups).filter(p => !priorityProviders.includes(p)).sort()
    ]

    for (const providerID of sortedProviders) {
      const models = providerGroups[providerID]
      for (const metadata of models) {
        const fullModelId = `${providerID}/${metadata.id}`
        const contextInfo = metadata.context 
          ? `${formatCompactTokens(metadata.context)} context`
          : 'Unknown context'
        
        modelOptions.push({
          title: metadata.name || metadata.id,
          value: fullModelId,
          description: `${providerID} • ${contextInfo}`,
          category: providerID,
        })
      }
    }
  }

  api.ui.dialog.replace(() =>
    api.ui.DialogSelect({
      title: args.title,
      placeholder: text("Filter models • Enter select • Esc back", "筛选模型 • 回车选择 • Esc 返回"),
      current: args.current,
      options: [
        ...modelOptions,
        {
          title: text("Back", "返回"),
          value: "__back__",
          description: text("Return without changing", "不修改并返回"),
          category: text("Navigation", "导航"),
        },
      ],
      onSelect: (option) => {
        if (option.value === "__back__") {
          args.onBack()
          return
        }
        args.onConfirm(option.value)
      },
    })
  )
}
```

### 4. Auto 模式工作逻辑

#### 4.1 模型选择函数

```typescript
// src/shared/auto-model-selector.ts
export function selectModelForAgent(
  agentName: string,
  config: Record<string, unknown>
): string | null {
  const enableAuto = getNestedBoolean(config, ["model_selection", "enable_auto_provider"])
  
  if (!enableAuto) {
    // 手动模式：不使用 auto 逻辑
    return null
  }

  // Auto 模式：使用偏好配置
  const agentPrefs = config["model_selection"]?.["agent_preferences"] as Record<string, {
    preferred_model?: string
    fallback_models?: string[]
  }> | undefined

  const pref = agentPrefs?.[agentName]
  if (!pref) {
    return null
  }

  // 检查 preferred model 是否可用
  if (pref.preferred_model && isModelAvailable(pref.preferred_model)) {
    return pref.preferred_model
  }

  // 尝试 fallback models
  if (pref.fallback_models) {
    for (const model of pref.fallback_models) {
      if (isModelAvailable(model)) {
        return model
      }
    }
  }

  return null
}

export function selectModelForCategory(
  category: string,
  config: Record<string, unknown>
): string | null {
  const enableAuto = getNestedBoolean(config, ["model_selection", "enable_auto_provider"])
  
  if (!enableAuto) {
    return null
  }

  const categoryPrefs = config["model_selection"]?.["category_preferences"] as Record<string, {
    preferred_model?: string
    fallback_models?: string[]
  }> | undefined

  const pref = categoryPrefs?.[category]
  if (!pref) {
    return null
  }

  if (pref.preferred_model && isModelAvailable(pref.preferred_model)) {
    return pref.preferred_model
  }

  if (pref.fallback_models) {
    for (const model of pref.fallback_models) {
      if (isModelAvailable(model)) {
        return model
      }
    }
  }

  return null
}

function isModelAvailable(modelId: string): boolean {
  const cache = readProviderModelsCache()
  if (!cache) return false

  const [providerID, modelName] = modelId.split('/')
  const models = cache.models[providerID]
  
  if (!Array.isArray(models)) return false

  return models.some(m => 
    typeof m === 'object' && m !== null && 'id' in m && m.id === modelName
  )
}
```

#### 4.2 集成到现有代码

```typescript
// src/tools/delegate-task/subagent-resolver.ts
export function resolveSubagentModel(
  agentName: string,
  inheritedModel?: string
): string {
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
  const requirement = AGENT_MODEL_REQUIREMENTS[agentName]
  if (requirement) {
    return resolveFromFallbackChain(requirement.fallbackChain)
  }

  // 5. 默认模型
  return DEFAULT_MODEL
}
```

```typescript
// src/tools/delegate-task/category-resolver.ts
export function resolveCategoryModel(
  category: string,
  inheritedModel?: string
): string {
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
  const defaultModel = DEFAULT_CATEGORIES[category]?.model
  if (defaultModel) {
    return defaultModel
  }

  // 5. 默认模型
  return DEFAULT_MODEL
}
```

### 5. 初始化默认配置

当用户首次使用时，自动生成默认的偏好配置：

```typescript
// src/plugin-state.ts
function initializeDefaultModelPreferences(config: Record<string, unknown>): void {
  const modelSelection = config["model_selection"] as Record<string, unknown> | undefined
  
  if (modelSelection?.["agent_preferences"]) {
    // 已经配置过，不覆盖
    return
  }

  const deepseekAvailable = detectDeepSeekAvailability()

  // 生成默认配置
  const defaultAgentPrefs: Record<string, { preferred_model: string; fallback_models: string[] }> = {
    sisyphus: {
      preferred_model: deepseekAvailable ? "deepseek/deepseek-v4-pro" : "anthropic/claude-opus-4-6",
      fallback_models: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
    },
    wase: {
      preferred_model: deepseekAvailable ? "deepseek/deepseek-v4-pro" : "anthropic/claude-opus-4-6",
      fallback_models: ["anthropic/claude-opus-4-6"],
    },
    librarian: {
      preferred_model: deepseekAvailable ? "deepseek/deepseek-v4-flash" : "anthropic/claude-haiku-4-5",
      fallback_models: ["anthropic/claude-haiku-4-5", "google/gemini-3-flash"],
    },
    // ... 其他 agents
  }

  const defaultCategoryPrefs: Record<string, { preferred_model: string; fallback_models: string[] }> = {
    quick: {
      preferred_model: deepseekAvailable ? "deepseek/deepseek-v4-flash" : "anthropic/claude-haiku-4-5",
      fallback_models: ["anthropic/claude-haiku-4-5"],
    },
    ultrabrain: {
      preferred_model: deepseekAvailable ? "deepseek/deepseek-v4-pro" : "openai/gpt-5.3-codex",
      fallback_models: ["openai/gpt-5.3-codex", "anthropic/claude-opus-4-6"],
    },
    // ... 其他 categories
  }

  // 写入配置
  setNestedValue(config, ["model_selection", "enable_auto_provider"], true)
  setNestedValue(config, ["model_selection", "deepseek_available"], deepseekAvailable)
  setNestedValue(config, ["model_selection", "agent_preferences"], defaultAgentPrefs)
  setNestedValue(config, ["model_selection", "category_preferences"], defaultCategoryPrefs)
}
```

## 实现步骤

### Phase 1: 基础设施 ✅
- [ ] 添加 `model_selection` 配置 schema
- [ ] 实现 `detectDeepSeekAvailability()`
- [ ] 实现 `selectModelForAgent()`
- [ ] 实现 `selectModelForCategory()`
- [ ] 实现 `isModelAvailable()`

### Phase 2: TUI 界面 ✅
- [ ] 创建 `openModelSelection()` 主页面
- [ ] 创建 `openAgentPreferences()` Agent 列表页面
- [ ] 创建 `openAgentPreferenceDetail()` 单个 Agent 配置页面
- [ ] 创建 `openCategoryPreferences()` Category 列表页面
- [ ] 创建 `openModelSelectionDialog()` 模型选择对话框
- [ ] 创建 `openFallbackModelsManager()` 备选模型管理

### Phase 3: 集成 ✅
- [ ] 更新 `subagent-resolver.ts` 集成 auto 逻辑
- [ ] 更新 `category-resolver.ts` 集成 auto 逻辑
- [ ] 实现 `initializeDefaultModelPreferences()`
- [ ] 在插件初始化时调用

### Phase 4: 测试 ✅
- [ ] 测试 auto 模式模型选择
- [ ] 测试 TUI 配置界面
- [ ] 测试 DeepSeek 可用性检测
- [ ] 测试 fallback 逻辑

## 用户体验

1. **首次使用**：
   - 插件自动检测 DeepSeek 可用性
   - 自动生成默认偏好配置
   - Auto 模式默认启用

2. **配置 Agent 偏好**：
   - 打开 TUI 设置 → Model Selection → Agent Preferences
   - 选择要配置的 Agent
   - 从可用模型列表中选择偏好模型（上下键+回车）
   - 可选：添加备选模型

3. **Auto 模式工作**：
   - 当启动 Agent 时，auto 模式自动查找该 Agent 的偏好模型
   - 如果偏好模型可用，使用偏好模型
   - 如果不可用，尝试备选模型
   - 如果都不可用，回退到 model-requirements.ts 的 fallback chain

4. **手动覆盖**：
   - 用户可以在配置文件中显式指定 `agents.sisyphus.model`
   - 显式配置优先级高于 auto 模式
