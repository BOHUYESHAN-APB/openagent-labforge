# Engineering Module 模板

当你要新增一个可复用的 prompt discipline 模块时，优先使用这个模板。

## Purpose

这个模块要解决什么重复性失败模式？

## When to inject

- 它应该在哪些任务阶段生效？
- 它是常驻、阶段性注入，还是按需读取？

## Required behaviors

- 规则 1
- 规则 2
- 规则 3

## What it must reject or push back on

- 必须指出/反驳的问题 1
- 必须指出/反驳的问题 2

## Output expectations

- 它应该怎样改变模型的输出或推理结构？

## Related modules / related skills

- 模块 A
- 技能 B

## Notes for contributors

- 哪些内容不应该在这里重复？
- 哪些东西应该放回 discipline overlay？
