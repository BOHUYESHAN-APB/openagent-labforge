type SemanticHintType = "search" | "analyze" | "write" | "review"

const SEARCH_HINT_PATTERN =
  /\b(find|locate|lookup|look\s*up|where\s+is|list\s+all|grep|scan|search|discover|查找|搜索|检索|定位|寻找|一覧|検索|찾아|검색)\b/i

const ANALYZE_HINT_PATTERN =
  /\b(why|how\s+does|investigate|explain|debug|diagnose|analy[sz]e|audit|root\s+cause|原因|为什么|原理|分析|调查|診断|分析|진단|분석)\b/i

const WRITE_HINT_PATTERN =
  /\b(write|draft|compose|document|spec|proposal|blog|article|论文|写作|文档|撰写|レポート|文書|작성|문서)\b/i

const REVIEW_HINT_PATTERN =
  /\b(review|check|inspect|validate|verify|qa|test\s+plan|code\s+review|审查|校验|检查|レビュー|검토)\b/i

const SEMANTIC_HINT_MESSAGES: Record<SemanticHintType, string> = {
  search: `[semantic-mode-hint]
Detected likely SEARCH intent.
Suggested routing:
- Agents: explore (internal), librarian (external docs)
- Tools/MCP: Grep, websearch, context7, grep_app
If this is not intended, ignore this hint.`,

  analyze: `[semantic-mode-hint]
Detected likely ANALYZE intent.
Suggested routing:
- Agents: explore + oracle (for hard reasoning)
- Tools/MCP: Grep, diagnostics, context7
If this is not intended, ignore this hint.`,

  write: `[semantic-mode-hint]
Detected likely WRITING intent.
Suggested routing:
- Agents: article-writer / scientific-writer
- Tools/MCP: context7/websearch for references
If this is not intended, ignore this hint.`,

  review: `[semantic-mode-hint]
Detected likely REVIEW intent.
Suggested routing:
- Agents: momus (plan/code review), oracle (hard tradeoffs)
- Tools/MCP: tests, diagnostics, targeted grep
If this is not intended, ignore this hint.`,
}

export function detectSemanticHintType(text: string): SemanticHintType | null {
  if (SEARCH_HINT_PATTERN.test(text)) return "search"
  if (ANALYZE_HINT_PATTERN.test(text)) return "analyze"
  if (WRITE_HINT_PATTERN.test(text)) return "write"
  if (REVIEW_HINT_PATTERN.test(text)) return "review"
  return null
}

export function buildSemanticHintMessage(type: SemanticHintType): string {
  return SEMANTIC_HINT_MESSAGES[type]
}
