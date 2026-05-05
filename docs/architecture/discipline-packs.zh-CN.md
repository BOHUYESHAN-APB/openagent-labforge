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

把 GitHub 仓库从 `openagent-labforge-bio` 改成 `openagent-labforge` 之前，需要确认：

1. 文档说明 bio 是 discipline pack，不是整个产品；
2. package metadata 指向最终仓库名；
3. install examples 不再依赖 `-bio` 路径；
4. GitHub redirect 对现有 release/tag 链接可接受；
5. release automation 使用新远端；
6. 旧名称作为历史兼容被记录。

在那之前，仍然只使用当前正确远端 `origin-bio`。
