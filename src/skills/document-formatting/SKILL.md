---
name: document-formatting
description: "中文正式文档排版规范：宋体正文/黑体标题/新罗马英文数字/固定字号"
---

# 中文正式文档排版规范

用于生成学术论文、正式报告、技术文档的中文排版。

## 字体规范

| 用途 | 字体 | 字号 |
|---|---|---|
| 主标题 | 黑体 SimHei | 三号 (16pt) |
| 次级标题 | 黑体 SimHei | 小三 (15pt) |
| 三级标题 | 黑体 SimHei | 四号 (14pt) |
| 中文正文 | 宋体 SimSun | 四号 (14pt) |
| 英文正文 | Times New Roman | 四号 (14pt) |
| 数字 | Times New Roman | 四号 (14pt) |
| 图注/表注 | 宋体 SimSun | 小四 (12pt)，居中 |
| 代码 | Consolas / Cascadia Code | 五号 (10.5pt) |
| 页脚 | 宋体 SimSun | 五号 (10.5pt) |

## 段落规范

- 行距：1.5 倍
- 段前段后：0 行
- 首行缩进：2 字符（中文正文）
- 页面：A4，边距上下 2.54cm，左右 3.17cm

## DOCX 输出规则

- 生成 DOCX 时不要填写作者信息（自动清理 python-docx 默认 author）
- 如用户明确指定作者才保留
