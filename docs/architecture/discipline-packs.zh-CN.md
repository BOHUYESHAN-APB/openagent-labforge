# Discipline Packs / 学科包

LabForge 从强生信支持开始，但长期设计不是“只做生信”。Bio 应该成为通用 discipline 系统里的第一个学科包。

英文版本：[`discipline-packs.md`](discipline-packs.md)

## 为什么重要

当前 GitHub 仓库名 `openagent-labforge-bio` 是历史名称。它不应该让未来所有 LabForge 安装都默认等同于“生信专用”。

目标模型：

```text
LabForge core
  + engineering workflow
  + host adapters
  + optional discipline packs
```

## 第一个学科包：bio

Bio 仍然重要，也必须兼容当前用户。

当前 bio 资产包括：

- `bio-analyst` display name，对应内部 `bio-orchestrator`；
- bundled `resources/bioSkills` catalog；
- `detect_bio_task` 和 `load_bio_skills` 工具；
- bio-focused MCP 推荐；
- 生信工作流里的 figure QA 和脚本卫生要求。

后续应把这些能力移动到 discipline-pack 边界之后，同时不破坏现有 `openagent-labforge-bio` 用户。

### 当前 bio 的演进方向

下一步重点不是让 bio-analyst 永远停留在“偏生信执行代理”。它应该逐步成长为更完整的生物科学主专家，能够：

- 明确生物学问题和假设；
- 设计实验与验证策略；
- 处理对照、混杂因素、批次效应、功效与效应量等研究逻辑；
- 解释结果并提出下一步研究；
- 在需要时调用化学、统计等专家模块，再把结果回收成统一的生物学结论。

也就是说，bio 仍然是当前科学侧的主专家。其他专家模块可以逐步增加，但最后应回灌到成熟的生物主专家，而不是让工作流永久碎片化。

## 未来学科包形态

```ts
interface DisciplinePack {
  id: 'bio' | 'chemistry' | 'materials' | 'physics' | 'math';
  displayName: string;
  agents: unknown[];
  skills: unknown[];
  commands: unknown[];
  mcps?: unknown[];
  defaultEnabled: boolean;
}
```

具体 TypeScript 接口以后再细化。关键设计规则是：新增学科不应该继续往 OpenCode plugin 入口里硬塞新的特殊分支。

## 仓库改名计划

把 GitHub 仓库从 `openagent-labforge-bio` 改成 `extendai-lab` 之前，需要确认：

1. 文档说明 bio 是 discipline pack，不是整个产品；
2. package metadata 指向最终仓库名；
3. install examples 不再依赖 `-bio` 路径；
4. GitHub redirect 对现有 release/tag 链接可接受；
5. release automation 使用新远端；
6. 旧名称作为历史兼容被记录。

在那之前，仍然只使用当前正确远端 `origin-bio`。

## 最小计算化学迁移

第一步计算化学迁移刻意保持很小：

- 增加一个 chemistry-facing 的 primary agent 入口；
- 先聚焦 chemoinformatics 和与 bio 重叠很强的化学任务；
- 直接复用现有 `load_bio_skills(categories=["chemoinformatics"])` 路径；
- 不额外发明第二套 loader 或平行 chemistry skill registry。

这样可以先让 chemistry pack 服务于 protein / ligand / structure 这类与 bio 重叠很强的工作，而不是假装 LabForge 已经拥有一个完整独立的化学平台。

因此 chemistry 重叠层目前主要是服务 bio 主专家，而不是取代它。遇到 chemistry-heavy 子问题时，当前应优先通过现有 chemoinformatics skills 处理；如果任务本质上仍然是生物学问题，那么主要的解释、研究策略和结论仍应由 `bio-analyst` 负责。

## 专家提示词设计规则

专家提示词应该带有学科偏向，但不能做成刚性的“身份锁死”。对大模型来说，过度强行规定“你就是某某专家”反而可能把问题带偏。

设计规则是：

- 给每个专家一个默认学科视角；
- 说明它应该优先注意什么；
- 说明它应该优先加载哪些 skills / tools；
- 同时明确：如果真正的瓶颈其实是化学、统计、软件、或更一般的研究设计，就必须承认并正确路由，而不是硬把问题解释成自己那一科。
