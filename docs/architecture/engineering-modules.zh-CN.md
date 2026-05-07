# Engineering Modules / 工程模块

ExtendAI Lab 不应该继续靠把越来越多的静态提示词直接塞进每个 agent
来扩展能力。更可复用的行为约束，应该逐步沉淀成标准化的 engineering
modules，这样它们才能：

- 被清楚地文档化；
- 在 PR 中更容易审查；
- 在正确阶段被注入；
- 将来演进为按需读取的 prompt/skill 模块。

英文版见：[`engineering-modules.md`](engineering-modules.md)

## 为什么需要这一层

现在很容易把三种东西混在一起：

1. **基础 agent 身份** —— engineer、bio-analyst、planner、executor
2. **学科偏向** —— biology-first、chemistry-first、engineering-first
3. **可复用行为约束** —— review rigor、anti-overconfidence、validation
   discipline、reproducibility discipline、visual QA discipline

第三类东西不应该散落在每个 agent prompt 里重复描述。
它们更适合作为可复用的 engineering modules。

## 设计目标

- 让核心 prompt 更小、更稳定；
- 让学科 prompt 只增加真正必要的偏向；
- 让可复用约束以“工程文档”的形式存在，而不是散乱段落；
- 为后续阶段性注入 / 按需读取做准备；
- 给贡献者一套标准落点和 PR 规范。

## 当前目标模型

```text
Base agent
  + discipline overlay
  + engineering modules (staged or on-demand)
```

例如：

- `bio-analyst` = 工程底座 + 生物学偏向 + scientific rigor 模块
- 未来 chemistry 专家 = 工程底座 + 化学偏向 + 同一套 rigor 模块
- planner = 规划底座 + plan-quality / risk-review 模块

## 第一批标准化模块

第一批最应该标准化的是：**scientific rigor / anti-overconfidence**。

这一组模块应该同时约束两件事：

1. **模型自己的输出科学性**
   - 区分 observation / interpretation / hypothesis / speculation
   - 标明证据基础和主要不确定性
   - 明确下一步验证动作

2. **指出用户输入中的不科学之处**
   - 因果外推过头
   - 缺少 controls / confounders / power
   - 把 docking / prediction 当作实验验证
   - 把 exploratory signal 当作结论

## 建议目录结构

```text
docs/engineering-modules/
  README.md
  README.zh-CN.md
  module-template.md
  module-template.zh-CN.md
  scientific-rigor.md
  scientific-rigor.zh-CN.md
  anti-overconfidence.md
  anti-overconfidence.zh-CN.md
```

先把文档层标准化，运行时注入以后再演进。

## 标准模块文档契约

每个模块文档都应包含统一章节：

1. **Purpose** —— 这个模块在防什么失败模式
2. **When to inject** —— 在什么任务阶段 / 触发条件下注入
3. **Required behaviors** —— 模型必须遵守的规则
4. **What it must reject or push back on** —— 必须指出或反驳哪些问题
5. **Output expectations** —— 输出时应如何体现该约束
6. **Related modules / related skills** —— 相关模块 / 技能
7. **Notes for contributors** —— 贡献时哪些东西不要膨胀、不要重复

## PR 规则

今后新增可复用 prompt discipline 时，不要先把改动散着塞进多个 prompt。
应该先新增或更新 engineering module 文档，再用小而明确的改动把 prompt
接过去。

这样更利于 review，也能减少 agent 之间的 prompt drift。

## 模块类 PR 检查项

新增模块前先确认：

- 这个行为是不是对多个 agent / workflow 都可复用；
- 它是不是不只是某一个 prompt 的学科措辞；
- 它有没有明确注入时机；
- 它是不是提升 rigor，而不是把专家 prompt 变成刚性身份锁；
- 如果影响架构层行为，中英文文档是否同步更新。

## 下一步实现顺序

1. 先标准化 engineering modules 文档层；
2. 先抽出第一对模块：scientific-rigor / anti-overconfidence；
3. 增加 diagnostics-strategy 模块，避免验证策略被锁死成“只有 LSP”；
4. 在架构文档和贡献规则中引用它们；
5. 等文档层稳定后，再加阶段性注入或按需读取机制。
