# TUI 模型选择设计文档

## 用户需求总结

1. **条件使用 DeepSeek**：只有用户配置了 DeepSeek 提供商时才使用 DeepSeek 模型
2. **auto 服务商开关**：TUI 设置中可以启用/禁用 auto 服务商
3. **模型选择方式**：从 OpenCode 的可用模型列表中选择（上下键+回车），不是手动输入
4. **主代理/子代理模型配置**：分别配置主代理和子代理的默认模型

## 配置结构

### 新增配置字段

```jsonc
{
  "model_selection": {
    // auto 服务商开关
    "enable_auto_provider": true,  // 默认启用
    
    // 主代理默认模型（当不使用 auto 时）
    "main_agent_model": "deepseek/deepseek-v4-pro",
    
    // 子代理默认模型（当不使用 auto 时）
    "subagent_model": "deepseek/deepseek-v4-flash",
    
    // DeepSeek 可用性检测（自动填充，用户不需要手动设置）
    "deepseek_available": false
  }
}
```

## 实现逻辑

### 1. DeepSeek 可用性检测

在插件初始化时检测 DeepSeek 是否可用：

```typescript
// src/plugin-state.ts
function detectDeepSeekAvailability(): boolean {
  const connectedProviders = readConnectedProvidersCache()
  if (!connectedProviders) return false
  
  // 检查是否有 deepseek 或 opencode provider
  return connectedProviders.includes('deepseek') || connectedProviders.includes('opencode')
}
```

### 2. 模型选择优先级

**当 `enable_auto_provider = true` 时**：
- 使用 auto 服务商逻辑
- 根据 `model-requirements.ts` 中的 fallback chain 自动选择
- DeepSeek 作为优先级 1（如果可用）

**当 `enable_auto_provider = false` 时**：
- 主代理使用 `main_agent_model`
- 子代理使用 `subagent_model`
- 不使用 fallback chain

### 3. TUI 设置页面

新增 "Model Selection Settings" 页面：

```typescript
const openModelSelection = () => {
  const config = effectiveRecord()
  const enableAuto = getNestedBoolean(config, ["model_selection", "enable_auto_provider"])
  const mainModel = getNestedString(config, ["model_selection", "main_agent_model"])
  const subagentModel = getNestedString(config, ["model_selection", "subagent_model"])
  const deepseekAvailable = getNestedBoolean(config, ["model_selection", "deepseek_available"])

  api.ui.dialog.replace(() =>
    api.ui.DialogSelect({
      title: text("Model Selection Settings", "模型选择设置"),
      options: [
        summaryRow(
          text("Current Status", "当前状态"),
          `${text("Auto", "自动")}: ${booleanLabel(enableAuto)} • DeepSeek: ${booleanLabel(deepseekAvailable)}`,
          text("Current", "当前")
        ),
        {
          title: text("Enable Auto Provider", "启用 Auto 服务商"),
          value: "enable_auto",
          category: text("Core", "核心"),
          description: statusLabel(enableAuto),
        },
        {
          title: text("Main Agent Model", "主代理模型"),
          value: "main_model",
          category: text("Models", "模型"),
          description: stringValueLabel(mainModel, "Not set", "未设置"),
          disabled: enableAuto === true, // auto 模式下禁用
        },
        {
          title: text("Subagent Model", "子代理模型"),
          value: "subagent_model",
          category: text("Models", "模型"),
          description: stringValueLabel(subagentModel, "Not set", "未设置"),
          disabled: enableAuto === true, // auto 模式下禁用
        },
        {
          title: text("Detect DeepSeek Availability", "检测 DeepSeek 可用性"),
          value: "detect_deepseek",
          category: text("Advanced", "高级"),
          description: text("Refresh DeepSeek availability status", "刷新 DeepSeek 可用性状态"),
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
            trueLabel: text("Enable (Recommended)", "启用（推荐）"),
            falseLabel: text("Disable (Manual)", "禁用（手动）"),
            onBack: openModelSelection,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(root, ["model_selection", "enable_auto_provider"], value),
                text("Updated auto provider setting", "已更新 auto 服务商设置"),
                openModelSelection,
              ),
          })
          return
        }
        if (option.value === "main_model" || option.value === "subagent_model") {
          openModelSelectionDialog({
            title: option.value === "main_model" 
              ? text("Main Agent Model", "主代理模型")
              : text("Subagent Model", "子代理模型"),
            current: option.value === "main_model" ? mainModel : subagentModel,
            onBack: openModelSelection,
            onConfirm: (value) =>
              save(
                (root) => setNestedValue(
                  root, 
                  ["model_selection", option.value === "main_model" ? "main_agent_model" : "subagent_model"], 
                  value
                ),
                text("Updated model", "已更新模型"),
                openModelSelection,
              ),
          })
          return
        }
        if (option.value === "detect_deepseek") {
          // 重新检测 DeepSeek 可用性
          const available = detectDeepSeekAvailability()
          save(
            (root) => setNestedValue(root, ["model_selection", "deepseek_available"], available),
            text(`DeepSeek ${available ? "available" : "not available"}`, `DeepSeek ${available ? "可用" : "不可用"}`),
            openModelSelection,
          )
        }
      },
    })
  )
}
```

### 4. 模型选择对话框

从 OpenCode 的 provider-models cache 中读取可用模型：

```typescript
const openModelSelectionDialog = (args: {
  title: string
  current: string | undefined
  onBack: () => void
  onConfirm: (value: string) => void
}) => {
  // 从 cache 读取可用模型
  const cache = readProviderModelsCache()
  const modelOptions: TuiDialogSelectOption<string>[] = []

  if (cache) {
    for (const [providerID, models] of Object.entries(cache.models)) {
      if (!Array.isArray(models)) continue

      for (const model of models) {
        if (typeof model === 'object' && model !== null && 'id' in model) {
          const metadata = model as ModelMetadata
          const fullModelId = `${providerID}/${metadata.id}`
          
          modelOptions.push({
            title: metadata.name || metadata.id,
            value: fullModelId,
            description: `${providerID} • ${metadata.context ? formatCompactTokens(metadata.context) + ' context' : 'Unknown context'}`,
            category: providerID,
          })
        }
      }
    }
  }

  // 按 provider 分组排序
  modelOptions.sort((a, b) => {
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '')
    }
    return a.title.localeCompare(b.title)
  })

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

## 模型选择逻辑集成

### 更新 model-requirements.ts

添加条件检查：

```typescript
// 在 resolveModelForDelegateTask 中添加
function shouldUseDeepSeek(): boolean {
  const config = readEffectiveConfig(directory)
  const deepseekAvailable = getNestedBoolean(config, ["model_selection", "deepseek_available"])
  return deepseekAvailable === true
}

// 在 fallback chain 中动态过滤
function filterFallbackChain(chain: FallbackEntry[]): FallbackEntry[] {
  if (!shouldUseDeepSeek()) {
    // 过滤掉 DeepSeek 模型
    return chain.filter(entry => 
      !entry.model.includes('deepseek-v4')
    )
  }
  return chain
}
```

### 更新 category-resolver.ts

```typescript
function resolveModelForCategory(category: string, inheritedModel?: string): string {
  const config = readEffectiveConfig(directory)
  const enableAuto = getNestedBoolean(config, ["model_selection", "enable_auto_provider"])

  if (!enableAuto) {
    // 手动模式：使用用户配置的模型
    const isSubagent = category === "quick" || category === "unspecified-low"
    const configKey = isSubagent ? "subagent_model" : "main_agent_model"
    const userModel = getNestedString(config, ["model_selection", configKey])
    
    if (userModel) {
      return userModel
    }
  }

  // auto 模式：使用 fallback chain
  const requirement = CATEGORY_MODEL_REQUIREMENTS[category]
  if (requirement) {
    const filteredChain = filterFallbackChain(requirement.fallbackChain)
    // ... 继续现有逻辑
  }
}
```

## 用户体验流程

### 场景 1：首次使用（推荐配置）

1. 用户打开 TUI 设置 → Model Selection Settings
2. 系统自动检测 DeepSeek 可用性
3. 如果 DeepSeek 可用：
   - `enable_auto_provider = true`（默认）
   - DeepSeek 作为优先级 1 自动使用
4. 如果 DeepSeek 不可用：
   - `enable_auto_provider = true`（默认）
   - 使用其他模型（Claude, GPT 等）

### 场景 2：手动配置模型

1. 用户打开 TUI 设置 → Model Selection Settings
2. 禁用 "Enable Auto Provider"
3. 选择 "Main Agent Model"
   - 显示所有可用模型列表（从 OpenCode cache 读取）
   - 用户用上下键选择，回车确认
4. 选择 "Subagent Model"
   - 同样的选择流程

### 场景 3：DeepSeek 不可用但想使用

1. 用户配置 DeepSeek provider
2. 打开 TUI 设置 → Model Selection Settings
3. 点击 "Detect DeepSeek Availability"
4. 系统重新检测并更新状态
5. 如果检测到 DeepSeek，自动在 fallback chain 中启用

## 实现步骤

### Phase 1: 基础设施
- [ ] 添加 `model_selection` 配置字段到 schema
- [ ] 实现 `detectDeepSeekAvailability()` 函数
- [ ] 实现 `shouldUseDeepSeek()` 检查函数
- [ ] 实现 `filterFallbackChain()` 过滤函数

### Phase 2: TUI 界面
- [ ] 创建 `openModelSelection()` 页面
- [ ] 创建 `openModelSelectionDialog()` 对话框
- [ ] 集成到主设置页面

### Phase 3: 模型选择逻辑
- [ ] 更新 `category-resolver.ts` 集成手动/auto 模式
- [ ] 更新 `subagent-resolver.ts` 集成手动/auto 模式
- [ ] 测试 fallback chain 过滤

### Phase 4: 测试和文档
- [ ] 测试 auto 模式
- [ ] 测试手动模式
- [ ] 测试 DeepSeek 可用性检测
- [ ] 更新用户文档

## 注意事项

1. **向后兼容**：如果用户没有配置 `model_selection`，默认使用 auto 模式
2. **缓存刷新**：DeepSeek 可用性检测依赖 OpenCode 的 provider cache，需要定期刷新
3. **错误处理**：如果用户选择的模型不可用，应该有友好的错误提示
4. **性能**：模型列表可能很长，需要优化 TUI 的筛选性能
