---
name: arxiv
description: Search, download, and summarize academic papers from arXiv using MCP tools. Use when user says "search arxiv", "download paper", "fetch arxiv", "arxiv search", "get paper pdf", or wants to find and save papers from arXiv to the local paper library.
argument-hint: [query-or-arxiv-id]
allowed-tools: Read, Write
---

# arXiv Paper Search & Download

Search topic or arXiv paper ID: $ARGUMENTS

## Constants

- **PAPER_DIR** - Local directory to save downloaded PDFs. Default: `papers/` in the current project directory.
- **MAX_RESULTS = 10** - Default number of search results.

> Overrides (append to arguments):
> - `/arxiv "attention mechanism" - max: 20` - return up to 20 results
> - `/arxiv "2301.07041" - download` - download a specific paper by ID
> - `/arxiv "query" - dir: literature/` - save PDFs to a custom directory
> - `/arxiv "query" - download: all` - download all result PDFs

## MCP Requirement (No Script Fallback)

This skill uses MCP only. Ensure at least one of these is enabled:

- `paper_search_mcp` (preferred, multi-source)
- `arxiv_mcp` (arXiv-only)

If MCP tools are missing, enable them in config:

```json
{
  "mcp_policy": {
    "enable": ["paper_search_mcp", "arxiv_mcp"]
  }
}
```

## Workflow

### Step 1: Parse Arguments

Parse `$ARGUMENTS` for directives:

- **Query or ID**: main search term or a bare arXiv ID such as `2301.07041` or `cs/0601001`
- **`- max: N`**: override MAX_RESULTS (e.g., `- max: 20`)
- **`- dir: PATH`**: override PAPER_DIR (e.g., `- dir: literature/`)
- **`- download`**: download the first result's PDF after listing
- **`- download: all`**: download PDFs for all results

If the argument matches an arXiv ID pattern (`YYMM.NNNNN` or `category/NNNNNNN`), skip the search and go directly to Step 3.

### Step 2: Search arXiv (MCP)

Use MCP tools to search:

- Prefer `paper_search_mcp` if available (multi-source).
- Otherwise use `arxiv_mcp` (arXiv-only).

Call the search tool exposed by the MCP server (the exact tool name appears in your MCP tool list). Pass the query and `MAX_RESULTS`.

Present results as a table:

```text
| # | arXiv ID   | Title               | Authors        | Date       | Category |
|---|------------|---------------------|----------------|------------|----------|
| 1 | 2301.07041 | Attention Is All... | Vaswani et al. | 2017-06-12 | cs.LG    |
```

### Step 3: Fetch Details for a Specific ID (MCP)

Use the MCP server's fetch/details tool (if provided) to retrieve metadata for a specific arXiv ID.

Display: title, all authors, categories, full abstract, published date, PDF URL, abstract URL.

### Step 4: Download PDFs (MCP)

When download is requested:

- Use MCP download/fetch tool if available.
- If the MCP server only returns URLs, create the directory and save the URL list so the user can fetch later.

If a local file path is returned:

- Confirm file size > 10 KB (reject smaller files - likely an error HTML page)
- Add a 1-second delay between consecutive downloads to avoid rate limiting
- Report: `Downloaded: papers/2301.07041.pdf (842 KB)`

### Step 5: Summarize

For each paper (downloaded or fetched by API):

```markdown
## [Title]

- **arXiv**: [ID] - [abs_url]
- **Authors**: [full author list]
- **Date**: [published]
- **Categories**: [cs.LG, cs.AI, ...]
- **Abstract**: [full abstract]
- **Key contributions** (extracted from abstract):
  - [contribution 1]
  - [contribution 2]
  - [contribution 3]
- **Local PDF**: papers/[ID].pdf (if downloaded)
```

### Step 6: Final Output

Summarize what was done:

- `Found N papers for "query"`
- `Downloaded: papers/2301.07041.pdf (842 KB)` (for each download)
- Any warnings (rate limit hit, file too small, already exists)

Suggest follow-up skills:

```text
/research-lit "topic"     - multi-source review: Zotero + Obsidian + local PDFs + web
/novelty-check "idea"     - verify your idea is novel against these papers
```

## Key Rules

- Always show the arXiv ID prominently - users need it for citations and reproducibility
- Verify downloaded PDFs: file must be > 10 KB; warn and delete if smaller
- Rate limit: wait 1 second between consecutive PDF downloads; retry once after 5 seconds on HTTP 429
- Never overwrite an existing PDF at the same path - skip it and report "already exists"
- Handle both arXiv ID formats: new (`2301.07041`) and old (`cs/0601001`)
- PAPER_DIR is created automatically if it does not exist
- If the arXiv API is unreachable, report the error clearly and suggest using `/research-lit` with `- sources: web` as a fallback
