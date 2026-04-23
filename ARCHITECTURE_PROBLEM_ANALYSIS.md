# Bio Skills 架构问题深度分析

## 核心架构问题

### 问题 1: 双重 Skills 系统冲突

系统中存在**两套独立的 bio skills**：

#### 1. 内置 Skills（50 个，代码定义）
位置: `src/features/builtin-skills/skills/`

**限制给 bio-pipeline-operator 的 21 个 skills**:
- blast-search
- functional-annotation
- bio-visualization
- bio-pipeline
- differential-expression
- read-qc
- read-alignment
- rna-quantification
- pathway-analysis
- variant-calling
- genome-annotation
- workflow-management
- genome-intervals
- scrna-preprocessing
- cell-annotation
- atac-seq
- chip-seq
- metagenomics
- proteomics
- sequence-analysis
- structural-biology

**限制给其他 agent 的 14 个 skills**:
- bio-methods, experimental-design → bio-methodologist
- wet-lab-design, vector-design → wet-lab-designer
- paper-evidence, pubmed-search, geo-query → paper-evidence-synthesizer
- proposal-and-roadmap, doc-coauthoring, internal-comms, brand-guidelines → article-writer
- literature-synthesis, research-paper-pipeline, reporting → scientific-writer

#### 2. Bio Bundle Skills（439 个，文件加载）
位置: `generated/skills-bundles/bio/skills/`

**完全无限制**，包含详细的实现指南：
- database-access/blast-searches
- differential-expression/deseq2-basics
- differential-expression/edger-basics
- single-cell/cell-annotation
- ... 共 439 个

### 问题 2: 权限逻辑错误

**代码实现** (`src/tools/skill/tools.ts:254-256`):
```typescript
if (matchedSkill.definition.agent && (!ctx?.agent || matchedSkill.definition.agent !== ctx.agent)) {
  throw new Error(`Skill "${matchedSkill.name}" is restricted to agent "${matchedSkill.definition.agent}"`)
}
```

**问题**:
1. **bio-orchestrator（规划 agent）无法读取 35 个内置 skills**
2. 这些内置 skills 是**概览性的指导文档**
3. 但规划时**必须能读取这些指导**才能制定合理计划
4. 执行时应该使用 bio bundle 中的 439 个详细 skills

### 问题 3: 命名冲突和混淆

| 内置 Skill | Bio Bundle 对应 Skills | 关系 |
|-----------|----------------------|------|
| `blast-search` | `database-access/blast-searches` | 概览 vs 详细实现 |
| `differential-expression` | `differential-expression/deseq2-basics`<br>`differential-expression/edger-basics`<br>等 6 个 | 概览 vs 多个具体方法 |
| `scrna-preprocessing` | `single-cell/preprocessing`<br>`single-cell/qc`<br>等 | 概览 vs 详细步骤 |

**用户困惑**:
- 看到 `blast-search` 存在但无法读取
- 不知道应该用内置的概览还是 bundle 中的详细版本
- bio-orchestrator 作为规划 agent 却读不到规划需要的概览文档

## 架构设计意图 vs 实际问题

### 原始设计意图（推测）

```
规划阶段:
  bio-orchestrator 读取内置概览 skills
  ↓
  理解任务类型和工作流程
  ↓
  制定计划，选择具体的 bio bundle skills

执行阶段:
  bio-pipeline-operator 读取详细的 bio bundle skills
  ↓
  执行具体的分析步骤
```

### 实际问题

```
规划阶段:
  bio-orchestrator 尝试读取 blast-search
  ↓
  ❌ 被拒绝: "restricted to agent bio-pipeline-operator"
  ↓
  无法理解任务需要什么工具
  ↓
  无法制定合理计划

执行阶段:
  bio-pipeline-operator 可以读取内置概览
  ↓
  但内置概览只有简单指导
  ↓
  需要的详细实现在 bio bundle 中（439 个）
  ↓
  但 guidance.ts 中的别名无法匹配这些详细 skills
```

## 根本矛盾

**矛盾 1: 规划者无法规划**
- bio-orchestrator 是规划 agent
- 但无法读取规划所需的概览文档
- 这违反了基本的职责分工逻辑

**矛盾 2: 执行者不需要概览**
- bio-pipeline-operator 是执行 agent
- 被授权读取概览文档
- 但执行时需要的是详细实现，不是概览

**矛盾 3: 双重系统不协调**
- 内置 skills 是概览（35 个有限制）
- bio bundle skills 是详细实现（439 个无限制）
- 但两者之间没有清晰的映射和协调机制

## 正确的架构应该是

### 方案 A: 移除内置 Skills 的 Agent 限制

**原理**: 概览文档应该对所有 agent 可见

```typescript
// 内置 skills 改为无限制或只对规划型 agent 限制
const PLANNING_AGENTS = ["bio-orchestrator", "bio-methodologist"]

if (matchedSkill.definition.agent) {
  // 如果是规划型 agent，允许读取所有概览
  if (PLANNING_AGENTS.includes(ctx?.agent || "")) {
    // 允许访问
  } else if (matchedSkill.definition.agent !== ctx.agent) {
    throw new Error(...)
  }
}
```

**优点**:
- 规划 agent 可以读取所有概览
- 执行 agent 也可以读取（作为参考）
- 符合"规划需要全局视野"的原则

### 方案 B: 重新设计权限模型

**原理**: 区分"读取权限"和"执行权限"

```typescript
interface SkillPermission {
  canRead: string[]      // 可以读取内容的 agents
  canExecute: string[]   // 可以执行的 agents
}

// 内置概览 skills
{
  name: "blast-search",
  permission: {
    canRead: ["*"],  // 所有 agent 都可以读取
    canExecute: ["bio-pipeline-operator"]  // 只有执行 agent 可以执行
  }
}
```

**优点**:
- 清晰区分读取和执行
- 规划 agent 可以读取所有文档
- 执行权限仍然受控

### 方案 C: 统一到 Bio Bundle（推荐）

**原理**: 移除内置 skills，全部使用 bio bundle

1. **删除内置的 35 个 bio skills**
2. **在 bio bundle 中创建顶层概览 skills**:
   ```
   bio-tools/SKILL.md
   bio-methods/SKILL.md
   bio-pipeline/SKILL.md
   bio-visualization/SKILL.md
   paper-evidence/SKILL.md
   wet-lab-design/SKILL.md
   ```
3. **这些概览 skills 无 agent 限制**
4. **包含指向详细 skills 的索引**

**优点**:
- 单一 skills 系统，无冲突
- 所有 skills 都无限制（或统一管理）
- 概览和详细实现在同一系统中
- 易于维护和扩展

## 立即修复方案

### 最小改动方案（临时）

修改 `src/features/builtin-skills/skills/blast-search.ts` 等 35 个文件：

```typescript
export const blastSearchSkill: BuiltinSkill = {
  name: "blast-search",
  description: "...",
  // agent: "bio-pipeline-operator",  // 注释掉或删除这行
  allowedTools: ["Read(*)", "WebFetch(*)", "Bash(python:*)", "Bash(*)"],
  template: `...`
}
```

**影响**: 所有 agent 都可以读取这些概览 skills

### 推荐方案（长期）

1. **Phase 1**: 移除内置 bio skills 的 agent 限制
2. **Phase 2**: 在 bio bundle 中创建 6 个顶层概览 skills
3. **Phase 3**: 更新 bio-skill-guidance.ts 使用正确的路径
4. **Phase 4**: 逐步迁移内置 skills 到 bio bundle
5. **Phase 5**: 删除内置 bio skills，统一使用 bio bundle

## 总结

**当前状态**:
- ✅ 439 个详细 bio skills 已加载（无限制）
- ❌ 35 个概览 skills 被错误限制
- ❌ 规划 agent 无法读取规划所需的文档
- ❌ 双重系统导致混淆和冲突

**核心问题**:
- **架构设计与实际需求不匹配**
- **权限模型违反了职责分工原则**
- **规划者无法规划，这是根本性的逻辑错误**

**解决方向**:
- 移除内置 skills 的 agent 限制（最快）
- 或统一到 bio bundle 系统（最彻底）
