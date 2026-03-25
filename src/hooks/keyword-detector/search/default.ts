/**
 * Search mode keyword detector.
 *
 * Triggers on search-related keywords across multiple languages:
 * - English: search, find, locate, lookup, explore, discover, scan, grep, query, browse, detect, trace, seek, track, pinpoint, hunt, where is, show me, list all
 * - Korean: 검색, 찾아, 탐색, 조회, 스캔, 서치, 뒤져, 찾기, 어디, 추적, 탐지, 찾아봐, 찾아내, 보여줘, 목록
 * - Japanese: 検索, 探して, 見つけて, サーチ, 探索, スキャン, どこ, 発見, 捜索, 見つけ出す, 一覧
 * - Chinese: 搜索, 查找, 寻找, 查询, 检索, 定位, 扫描, 发现, 在哪里, 找出来, 列出
 * - Vietnamese: tìm kiếm, tra cứu, định vị, quét, phát hiện, truy tìm, tìm ra, ở đâu, liệt kê
 */

export const SEARCH_PATTERN =
  /\b(search|find|locate|lookup|look\s*up|explore|discover|scan|grep|query|browse|detect|trace|seek|track|pinpoint|hunt)\b|where\s+is|show\s+me|list\s+all|검색|찾아|탐색|조회|스캔|서치|뒤져|찾기|어디|추적|탐지|찾아봐|찾아내|보여줘|목록|検索|探して|見つけて|サーチ|探索|スキャン|どこ|発見|捜索|見つけ出す|一覧|搜索|查找|寻找|查询|检索|定位|扫描|发现|在哪里|找出来|列出|tìm kiếm|tra cứu|định vị|quét|phát hiện|truy tìm|tìm ra|ở đâu|liệt kê/i

export const SEARCH_MESSAGE = `[search-mode]
SEARCH POLICY. Prefer lightweight retrieval over heavy orchestration.

- Use open_websearch_mcp first for broad recall when enabled.
- Use websearch for higher-quality precision search after you have narrowed the target.
- Use context7 for library/framework documentation and grep_app for GitHub code examples.
- Use paper_search_mcp first when the request is explicitly academic, literature-driven, or citation-sensitive.
- Prefer direct tools before specialist agents. Escalate to GitHub-Scout, Tech-Scout, or Librarian only when the task scope clearly needs them.
- Do not add extra verification by default. Search more only when evidence is weak, conflicting, or high-risk.`
