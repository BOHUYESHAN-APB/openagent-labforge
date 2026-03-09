# MCP 短名单（论文检索 / 生信分析）

> 状态：初筛（许可证优先）
> 原则：优先 MIT / Apache-2.0 / BSD / ISC；必须可追溯来源与维护状态。

## A. 论文检索 MCP（优先接入）

| 名称 | 仓库 | 许可证 | 维护状态 | 适配建议 |
|---|---|---|---|---|
| arXiv MCP Server | `blazickjp/arxiv-mcp-server` | Apache-2.0 | 活跃 | 作为预印本主通道 |
| Paper Search MCP | `openags/paper-search-mcp` | MIT | 中等（需复查） | 多源聚合候选，需安全开关 |
| MCP Simple PubMed | `andybrandt/mcp-simple-pubmed` | MIT | 中等 | 生物医学论文主通道 |
| Semantic Scholar FastMCP | `zongmin-yu/semantic-scholar-fastmcp-mcp-server` | MIT | 活跃 | 引文网络与推荐增强 |
| Crossref MCP | `botanicastudios/crossref-mcp` | MIT | 低-中 | DOI/元数据补全 |

## B. 生物医学/生信检索扩展（候选）

| 名称 | 仓库 | 许可证 | 维护状态 | 适配建议 |
|---|---|---|---|---|
| MCP Simple arXiv | `andybrandt/mcp-simple-arxiv` | MIT | 活跃 | 与 PubMed 套件配对 |
| OpenAlex MCP | `hbiaou/openalex-mcp` | MIT | 偏旧 | 作为目录补充，不做主通道 |
| BioMCP | `genomoncology/biomcp` | MIT（需二次核验） | 活跃 | 生物医学聚合检索增强 |

## C. 接入分层建议（V1）

### 必接（第一批）
1. arXiv MCP（预印本）
2. PubMed MCP（医学）
3. Semantic Scholar MCP（引文网络）

### 次接（第二批）
4. Crossref MCP（DOI 元数据标准化）
5. OpenAlex / BioMCP（二选一，按维护与稳定性）

## D. 许可证与合规闸门

接入前必须完成：

1. 在 `docs/guide/mcp-license-checklist.md` 完成逐项检查
2. 在 `plugins/opencode-mcp-paper-search/MCP_CANDIDATES.md` 记录审计结果
3. 在 `THIRD_PARTY_NOTICES.md` 写入来源与许可证

## E. 风险点

- 多源检索 MCP 可能含法律/访问策略风险功能（需默认关闭高风险路径）
- 部分项目维护频率较低，需预备替代方案
- 返回格式不一致，需在上层做统一证据结构化

## F. 用户提供的 ModelScope MCP 列表核验（初版）

> 说明：以下为“当前可验证信息”。无法从上游仓库明确验证的字段标记为 `Unknown`，不得默认启用。

| ModelScope 条目 | 上游候选仓库 | 许可证 | 额外 Key 要求 | 建议 |
|---|---|---|---|---|
| `@openags/paper-search-mcp` | `openags/paper-search-mcp` | MIT（可验证） | Unknown/部分来源可能免 key | 候选，需逐项工具能力审计 |
| `slcatwujian/bing-cn-mcp-server` | 候选：`yan5236/bing-cn-mcp-server`（需确认） | Unknown（待仓库确认） | 可能依赖 Bing 接口能力 | 暂缓（defer） |
| `@blazickjp/arxiv-mcp-server` | `blazickjp/arxiv-mcp-server` | Apache-2.0（可验证） | 核心检索通常免 key | 优先接入 |
| `zephyr/Arxiv-Paper-MCP` | 候选：`daheepk/arxiv-paper-mcp`（需确认） | MIT（候选） | Unknown | 暂缓，先确认映射 |
| `@wangtsiao/pulse-cn-mcp` | `wangtsiao/pulse-cn-mcp`（需确认） | Unknown（来源聚合页不作最终凭据） | Unknown | 暂缓（defer） |
| `@modelcontextprotocol/puppeteer` | `@modelcontextprotocol/server-puppeteer` | MIT（可验证） | No | 优先接入（浏览器关键能力） |
| `liueic/mcp-pubmed-llm-server` | 未定位到可靠上游仓库（待补） | Unknown | Unknown | 暂缓（defer） |
| `@smaniches/semantic-scholar-mcp` | `smaniches/semantic-scholar-mcp` | 声明与元数据存在不一致（需人工核验） | 通常需要 API key | 暂缓（defer） |
| `@zongmin-yu/semantic-scholar-fastmcp-mcp-server` | `zongmin-yu/semantic-scholar-fastmcp-mcp-server` | MIT（可验证） | 通常需要 API key（可选但影响配额） | 次优先（如你坚持免 key，可后置） |
| `@regenrek/mcp-deepwiki` | `regenrek/deepwiki-mcp` | MIT（可验证） | No（公开仓库问答） | 可接入（辅助文档调研） |
| `@TheSethRose/Fetch-Browser` | `TheSethRose/Fetch-Browser` | MIT（可验证） | No | 优先接入（免 key + 浏览器） |

## G. “免额外 Key 优先”策略（执行）

第一批优先（免 key 为主）：
1. `@blazickjp/arxiv-mcp-server`
2. `@modelcontextprotocol/server-puppeteer`
3. `@TheSethRose/Fetch-Browser`
4. `@regenrek/deepwiki-mcp`（文档检索辅助）

第二批（可选 key / 条件启用）：
5. `@zongmin-yu/semantic-scholar-fastmcp-mcp-server`
6. `openags/paper-search-mcp`

第三批（信息不全先不接）：
7. `bing-cn` / `pulse-cn` / `liueic pubmed` 等待仓库与许可证完全核验。

## H. 补充核验（GitHub 直连仓库）

| 仓库 | 协议 | Key 要求 | 当前结论 |
|---|---|---|---|
| `hhx465453939/mcp-pubmed-server` | 存在协议元数据冲突（需人工确认） | Yes（文档要求） | 暂缓 |
| `yan5236/bing-cn-mcp-server` | MIT | No | 可作为区域检索补充（默认可选） |

详见：`docs/guide/mcp-skills-audit-2026-03-08.md`
