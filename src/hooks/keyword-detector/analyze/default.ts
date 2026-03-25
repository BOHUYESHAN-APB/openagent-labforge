/**
 * Analyze mode keyword detector.
 *
 * Triggers on analysis-related keywords across multiple languages:
 * - English: analyze, analyse, investigate, examine, research, study, deep-dive, inspect, audit, evaluate, assess, review, diagnose, scrutinize, dissect, debug, comprehend, interpret, breakdown, understand, why is, how does, how to
 * - Korean: 분석, 조사, 파악, 연구, 검토, 진단, 이해, 설명, 원인, 이유, 뜯어봐, 따져봐, 평가, 해석, 디버깅, 디버그, 어떻게, 왜, 살펴
 * - Japanese: 分析, 調査, 解析, 検討, 研究, 診断, 理解, 説明, 検証, 精査, 究明, デバッグ, なぜ, どう, 仕組み
 * - Chinese: 调查, 检查, 剖析, 深入, 诊断, 解释, 调试, 为什么, 原理, 搞清楚, 弄明白
 * - Vietnamese: phân tích, điều tra, nghiên cứu, kiểm tra, xem xét, chẩn đoán, giải thích, tìm hiểu, gỡ lỗi, tại sao
 */

export const ANALYZE_PATTERN =
  /\b(analyze|analyse|investigate|examine|research|study|deep[\s-]?dive|inspect|audit|evaluate|assess|review|diagnose|scrutinize|dissect|debug|comprehend|interpret|breakdown|understand)\b|why\s+is|how\s+does|how\s+to|분석|조사|파악|연구|검토|진단|이해|설명|원인|이유|뜯어봐|따져봐|평가|해석|디버깅|디버그|어떻게|왜|살펴|分析|調査|解析|検討|研究|診断|理解|説明|検証|精査|究明|デバッグ|なぜ|どう|仕組み|调查|检查|剖析|深入|诊断|解释|调试|为什么|原理|搞清楚|弄明白|phân tích|điều tra|nghiên cứu|kiểm tra|xem xét|chẩn đoán|giải thích|tìm hiểu|gỡ lỗi|tại sao/i

export const ANALYZE_MESSAGE = `[analyze-mode]
ANALYSIS POLICY. Reason from current context first, then search only to close evidence gaps.

- Start with direct repo evidence: Read, Grep, AST-grep, diagnostics, and nearby code.
- If external retrieval is needed, use open_websearch_mcp for broad recall and websearch for higher-quality precision refinement.
- Use context7 for upstream docs, grep_app for real GitHub examples, and paper_search_mcp first for academic or citation-sensitive analysis.
- Escalate to specialist agents only when the task clearly needs them: Explore for local code discovery, Librarian for one upstream dependency, GitHub-Scout for repo landscapes, Tech-Scout for ecosystem/trend synthesis, Oracle for hard judgment.
- Do not force extra verification by default. Add more search only when sources conflict, evidence is thin, or the domain is high-risk.`
