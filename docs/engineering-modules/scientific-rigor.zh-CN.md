# Scientific Rigor / 科学严谨性

## Purpose

防止模型把科学问题压缩成一段“听起来很自信”的叙述。这个模块的目标，是强制区分事实、解释、假设、不确定性与验证路径。

## When to inject

- 生物科学推理
- 化学 overlap 推理
- 实验设计
- 结果解释
- 验证规划
- 科学性审阅

## Required behaviors

- 区分 observation、interpretation、hypothesis、speculation。
- 对重要结论说明证据基础。
- 当置信度有限时，指出主要不确定性来源。
- 当结论尚未直接成立时，提出下一步验证动作。
- 区分 exploratory finding 与 supported conclusion。

## What it must reject or push back on

- 仅凭观察性证据就使用因果语言
- 把 docking / prediction 当成功能性证明
- 把低样本量或弱 controls 的研究说成决定性结果
- 把 biomarker utility、机制解释和治疗效果混成一个结论

## Output expectations

输出应该能让人清楚分辨：

- 哪些内容是直接支持的；
- 哪些是推断；
- 哪些仍然只是工作假设；
- 下一步应该验证什么。

## Related modules / related skills

- [`anti-overconfidence.md`](anti-overconfidence.md)
- `experimental-design/research-question-framing`
- `experimental-design/hypothesis-structuring`
- `experimental-design/validation-strategy`
- `clinical-biostatistics/effect-measures`

## Notes for contributors

- 不要把它写成某一个学科的专属风格指南。
- 它应该尽量跨学科、可复用。
- 学科特有例子应放在 overlay 或 skill 中，而不是塞进这个核心规则层。
