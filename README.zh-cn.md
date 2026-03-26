# OpenAgent Labforge

> [!NOTE]
> **衍生项目说明**
>
> OpenAgent Labforge 是 `code-yeongyu/oh-my-openagent`
> （原 `oh-my-opencode`）的衍生版本。本分支保留上游许可边界与来源说明，
> 但产品方向已经明显转向：更强调 OpenCode 原生委派、科研/检索工作流、
> MCP 使用体验，以及本地优先的运行方式。
>
> 许可与来源请见：`LICENSE.md`、`NOTICE`、`THIRD_PARTY_NOTICES.md`、
> `docs/licensing.md`。

## 这个分支现在真正改了什么

这份 README 重点展示**当前实际能力与动态变化**，而不是重复上游故事。

### 1）Agent 体系更清晰，也更可检查

- 主调度与专长 agent 的分工被明确拉开
- `task(subagent_type=...)` 成为可检查 child session 的规范路径
- 以下角色边界被明显强化：
  - `librarian`：单一库 / 框架 / SDK / 上游实现问题
  - `github-scout`：仓库横向比较、选型和学习清单
  - `tech-scout`：生态、benchmark、发布与趋势分析
  - `article-writer`：公众/工作场景技术写作
  - `scientific-writer`：科研/同行向技术写作
- 后台子任务的 fallback-chain 现在会被正确注册和清理，模型回退行为更稳定

### 2）搜索流被拆成“精准”和“广覆盖”两类

- `websearch`：高质量、偏精准的搜索
- `open_websearch_mcp`：多引擎、偏广覆盖的搜索
- `paper_search_mcp`：学术检索
- `context7`：官方文档/框架参考
- `grep_app`：GitHub 代码示例

插件现在不再强推那种“无脑多代理全开”的重注入提示，而是改成更轻量的
检索策略提示，避免显式选中 specialist agent 时被二次路由干扰。

### 3）MCP 运行更稳定了

- 已把 `bing_cn_mcp` 替换为 `open_websearch_mcp`
- `open_websearch_mcp` 修正了本地 MCP 的 `environment`、stdio 模式、
  prompt-probe 兼容、版本固定与启动超时
- `paper_search_mcp` 已回退到当前这个 Windows/OpenCode 环境里真正可用的
  启动方式
- MCP policy 现在更符合真实产品定位：精准搜索、广覆盖搜索、学术检索三者分工清楚

### 4）Skill 发现更接近 OpenCode 规范

- 项目级 skill 会向上查找直到 git 根目录
- `SKILL.md` 元数据校验更严格
- 安装器会自动生成 `openagent-labforge` skill 目录，提升插件能力被识别的稳定性

### 5）发布/安装表面已经开始去上游残留

- 顶层 README 已不再是上游营销文案的镜像
- 安装器文案、包元数据、schema 元数据已经对齐当前 fork 身份
- 当前正式支持路径仍然是：**本地构建 + 本地安装**

## 当前 agent 结构

### 核心调度层

- `sisyphus`：默认总调度器
- `hephaestus`：深度编码执行者
- `prometheus`：规划器
- `atlas`：执行协调器
- `sisyphus-junior`：按类别执行的委派器

### 专长层

- `explore`：本地代码库探索
- `librarian`：聚焦单一上游依赖研究
- `github-scout`：GitHub 仓库侦察与选型
- `tech-scout`：生态/发布/benchmark 分析
- `article-writer`：公众技术写作
- `scientific-writer`：科研/同行技术写作
- 生信与多模态专长 agent 按配置继续保留

## 当前安装现实

当前项目主要面向：

1. 本地构建
2. 本地打包 tgz
3. 替换 OpenCode 配置目录中的本地插件包

常用命令：

```bash
bun run build:skills-catalog
bun run build
bun pm pack
```

然后按照 `docs/guide/installation.md` 完成替换安装。

## 文档入口

- `docs/guide/installation.md`：当前安装/替换流程
- `docs/guide/overview.md`：产品形态与工作流分层
- `docs/guide/orchestration.md`：规划、执行、委派关系
- `docs/reference/configuration.md`：配置参考
- `docs/reference/features.md`：能力总览
- `examples/README.md`：配置样例与 bundle 示例

## 当前已知限制

- 目前仍然是本地优先，不是完整公开 npm 发布流
- 仍有部分二级文档需要继续清理旧上游术语
- 浏览器类 MCP 的环境敏感性仍高于核心搜索/文档/代码类 MCP

## 来源与归属

我们保留上游来源和许可边界，但当前 fork 的产品形态、运行方式和很多行为
已经明显不同。

- 上游：`https://github.com/code-yeongyu/oh-my-openagent`
- 当前 fork：`https://github.com/BOHUYESHAN-APB/openagent-labforge`

如果某个底层文档与当前运行表现不一致，请优先以本 README 和
`docs/guide/installation.md` 为准。

## 其他语言版本

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
