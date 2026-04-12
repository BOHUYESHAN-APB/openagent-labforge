# Labforge Skills Index (paper)

This file is generated. Skills are grouped by function for low-token preview before reading full instructions.

## data-analysis / experiment-monitoring

- `auto-claude/monitor-experiment` [auto-claude__monitor-experiment] — Monitor running experiments, check progress, collect results. Use when user says "check results", "is it done", "monitor", or wants experiment output. _(source: auto-claude)_

## data-analysis / experiment-ops

- `auto-claude/run-experiment` [auto-claude__run-experiment] — Deploy and run ML experiments on local or remote GPU servers. Use when user says "run experiment", "deploy to server", "跑实验", or needs to launch training jobs. _(source: auto-claude)_

## data-analysis / notebooks

- `openai-curated/jupyter-notebook` [openai-curated__jupyter-notebook] — Use when the user asks to create, scaffold, or edit Jupyter notebooks (`.ipynb`) for experiments, explorations, or tutorials; prefer the bundled templates and run the helper script `new_notebook.py` to generate a clean starting notebook. _(source: openai-curated)_

## data-analysis / optimization

- `auto-claude/dse-loop` [auto-claude__dse-loop] — Autonomous design space exploration loop for computer architecture and EDA. Runs a program, analyzes results, tunes parameters, and iterates until objective is met or timeout. Use when user says \"DSE\", \"design space exploration\", \"sweep parameters\", \"optimize\", \"find best config\", or wants iterative parameter tuning. _(source: auto-claude)_

## data-analysis / statistics

- `auto-claude/analyze-results` [auto-claude__analyze-results] — Analyze ML experiment results, compute statistics, generate comparison tables and insights. Use when user says "analyze results", "compare", or needs to interpret experimental data. _(source: auto-claude)_
- `data-analysis` [builtin__data-analysis__data-analysis] — Statistical analysis workflow with reproducible outputs. _(source: builtin:data-analysis)_

## data-analysis / tabular-analysis

- `openai-curated/spreadsheet` [openai-curated__spreadsheet] — Use when tasks involve creating, editing, analyzing, or formatting spreadsheets (`.xlsx`, `.csv`, `.tsv`) with formula-aware workflows, cached recalculation, and visual review. _(source: openai-curated)_
- `xlsx-analyst` [builtin__xlsx-analyst__xlsx-analyst] — Analyze and format XLSX files with reproducible calculations. _(source: builtin:xlsx-analyst)_

## data-analysis / visualization

- `auto-claude/paper-figure` [auto-claude__paper-figure] — Generate publication-quality figures and tables from experiment results. Use when user says \"画图\", \"作图\", \"generate figures\", \"paper figures\", or needs plots for a paper. _(source: auto-claude)_

## engineering / app-integration

- `openai-curated/chatgpt-apps` [openai-curated__chatgpt-apps] — Build, scaffold, refactor, and troubleshoot ChatGPT Apps SDK applications that combine an MCP server and widget UI. Use when Codex needs to design tools, register UI resources, wire the MCP Apps bridge or ChatGPT compatibility APIs, apply Apps SDK metadata or CSP or domain settings, or produce a docs-aligned project scaffold. Prefer a docs-first workflow by invoking the openai-docs skill or OpenAI developer docs MCP tools before generating code. _(source: openai-curated)_

## engineering / backend-api

- `microsoft/fastapi-router-py` [microsoft__fastapi-router-py] — Create FastAPI routers with CRUD operations, authentication dependencies, and proper response models. Use when building REST API endpoints, creating new routes, implementing CRUD operations, or adding authenticated endpoints in FastAPI applications. _(source: microsoft)_
- `microsoft/pydantic-models-py` [microsoft__pydantic-models-py] — Create Pydantic models following the multi-model pattern with Base, Create, Update, Response, and InDB variants. Use when defining API request/response schemas, database models, or data validation in Python applications using Pydantic v2. _(source: microsoft)_

## engineering / browser-automation

- `agent-browser` [builtin__agent-browser__agent-browser] — Persistent browser automation using agent-browser CLI. _(source: builtin:agent-browser)_
- `dev-browser` [builtin__dev-browser__dev-browser] — Scriptable browser automation with persistent page state for navigation, scraping, and testing. _(source: builtin:dev-browser)_
- `openai-curated/playwright` [openai-curated__playwright] — Use when the task requires automating a real browser from the terminal (navigation, form filling, snapshots, screenshots, data extraction, UI-flow debugging) via `playwright-cli` or the bundled wrapper script. _(source: openai-curated)_
- `openai-curated/playwright-interactive` [openai-curated__playwright-interactive] — Persistent browser and Electron interaction through `js_repl` for fast iterative UI debugging. _(source: openai-curated)_
- `playwright` [builtin__playwright__playwright] — Browser automation via Playwright MCP for verification, scraping, screenshots, and site interaction. _(source: builtin:playwright)_

## engineering / browser-testing

- `anthropic/webapp-testing` [anthropic__webapp-testing] — Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs. _(source: anthropic)_
- `openai-curated/screenshot` [openai-curated__screenshot] — Use when the user explicitly asks for a desktop or system screenshot (full screen, specific app or window, or a pixel region), or when tool-specific capture capabilities are unavailable and an OS-level capture is needed. _(source: openai-curated)_

## engineering / ci-and-delivery

- `openai-curated/gh-fix-ci` [openai-curated__gh-fix-ci] — Use when a user asks to debug or fix failing GitHub PR checks that run in GitHub Actions; use `gh` to inspect checks and logs, summarize failure context, draft a fix plan, and implement only after explicit approval. Treat external providers (for example Buildkite) as out of scope and report only the details URL. _(source: openai-curated)_

## engineering / code-review

- `openai-curated/gh-address-comments` [openai-curated__gh-address-comments] — Help address review/issue comments on the open GitHub PR for the current branch using gh CLI; verify gh auth first and prompt the user to authenticate if not logged in. _(source: openai-curated)_

## engineering / deployment

- `openai-curated/cloudflare-deploy` [openai-curated__cloudflare-deploy] — Deploy applications and infrastructure to Cloudflare using Workers, Pages, and related platform services. Use when the user asks to deploy, host, publish, or set up a project on Cloudflare. _(source: openai-curated)_
- `openai-curated/netlify-deploy` [openai-curated__netlify-deploy] — Deploy web projects to Netlify using the Netlify CLI (`npx netlify`). Use when the user asks to deploy, host, publish, or link a site/repo on Netlify, including preview and production deploys. _(source: openai-curated)_
- `openai-curated/render-deploy` [openai-curated__render-deploy] — Deploy applications to Render by analyzing codebases, generating render.yaml Blueprints, and providing Dashboard deeplinks. Use when the user wants to deploy, host, publish, or set up their application on Render's cloud platform. _(source: openai-curated)_
- `openai-curated/vercel-deploy` [openai-curated__vercel-deploy] — Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment". _(source: openai-curated)_

## engineering / frontend-ui

- `anthropic/frontend-design` [anthropic__frontend-design] — Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics. _(source: anthropic)_
- `frontend-ui-ux` [builtin__frontend-ui-ux__frontend-ui-ux] — High-design frontend UI and UX implementation skill. _(source: builtin:frontend-ui-ux)_

## engineering / mcp-and-tooling

- `anthropic/mcp-builder` [anthropic__mcp-builder] — Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services, whether in Python (FastMCP) or Node/TypeScript (MCP SDK). _(source: anthropic)_

## engineering / observability

- `openai-curated/sentry` [openai-curated__sentry] — Use when the user asks to inspect Sentry issues or events, summarize recent production errors, or pull basic Sentry health data via the Sentry API; perform read-only queries with the bundled script and require `SENTRY_AUTH_TOKEN`. _(source: openai-curated)_

## engineering / security

- `openai-curated/security-best-practices` [openai-curated__security-best-practices] — Perform language and framework specific security best-practice reviews and suggest improvements. Trigger only when the user explicitly requests security best practices guidance, a security review/report, or secure-by-default coding help. Trigger only for supported languages (python, javascript/typescript, go). Do not trigger for general code review, debugging, or non-security tasks. _(source: openai-curated)_
- `openai-curated/security-ownership-map` [openai-curated__security-ownership-map] — Analyze git repositories to build a security ownership topology (people-to-file), compute bus factor and sensitive-code ownership, and export CSV/JSON for graph databases and visualization. Trigger only when the user explicitly wants a security-oriented ownership or bus-factor analysis grounded in git history (for example: orphaned sensitive code, security maintainers, CODEOWNERS reality checks for risk, sensitive hotspots, or ownership clusters). Do not trigger for general maintainer lists or non-security ownership questions. _(source: openai-curated)_
- `openai-curated/security-threat-model` [openai-curated__security-threat-model] — Repository-grounded threat modeling that enumerates trust boundaries, assets, attacker capabilities, abuse paths, and mitigations, and writes a concise Markdown threat model. Trigger only when the user explicitly asks to threat model a codebase or path, enumerate threats/abuse paths, or perform AppSec threat modeling. Do not trigger for general architecture summaries, code review, or non-security design work. _(source: openai-curated)_

## engineering / skill-authoring

- `anthropic/skill-creator` [anthropic__skill-creator] — Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations. _(source: anthropic)_
- `microsoft/skill-creator` [microsoft__skill-creator] — Guide for creating effective skills for AI coding agents working with Azure SDKs and Microsoft Foundry services. Use when creating new skills or updating existing skills. _(source: microsoft)_
- `openai-system/skill-creator` [openai-system__skill-creator] — Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. _(source: openai-system)_
- `openai-system/skill-installer` [openai-system__skill-installer] — Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). _(source: openai-system)_

## engineering / version-control

- `git-master` [builtin__git-master__git-master] — Advanced git workflow skill for commit splitting, history search, and rebase operations. _(source: builtin:git-master)_

## productivity / communication

- `anthropic/internal-comms` [anthropic__internal-comms] — A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.). _(source: anthropic)_
- `auto-claude/feishu-notify` [auto-claude__feishu-notify] — Send notifications to Feishu/Lark. Internal utility used by other skills, or manually via /feishu-notify. Supports push-only (webhook) and interactive (bidirectional) modes. Use when user says \"发飞书\", \"notify feishu\", or other skills need to send status updates. _(source: auto-claude)_

## productivity / issue-tracking

- `microsoft/github-issue-creator` [microsoft__github-issue-creator] — Convert raw notes, error logs, voice dictation, or screenshots into crisp GitHub-flavored markdown issue reports. Use when the user pastes bug info, error messages, or informal descriptions and wants a structured GitHub issue. Supports images/GIFs for visual evidence. _(source: microsoft)_
- `openai-curated/linear` [openai-curated__linear] — Manage issues, projects & team workflows in Linear. Use when the user wants to read, create or updates tickets in Linear. _(source: openai-curated)_

## productivity / visual-design

- `auto-claude/pixel-art` [auto-claude__pixel-art] — Generate pixel art SVG illustrations for READMEs, docs, or slides. Use when user says "画像素图", "pixel art", "make an SVG illustration", "README hero image", or wants a cute visual. _(source: auto-claude)_

## research / api-documentation

- `openai-curated/openai-docs` [openai-curated__openai-docs] — Use when the user asks how to build with OpenAI products or APIs and needs up-to-date official documentation with citations, help choosing the latest model for a use case, or explicit GPT-5.4 upgrade and prompt-upgrade guidance; prioritize OpenAI docs MCP tools, use bundled references only as helper context, and restrict any fallback browsing to official OpenAI domains. _(source: openai-curated)_
- `openai-system/openai-docs` [openai-system__openai-docs] — Use when the user asks how to build with OpenAI products or APIs and needs up-to-date official documentation with citations, help choosing the latest model for a use case, or explicit GPT-5.4 upgrade and prompt-upgrade guidance; prioritize OpenAI docs MCP tools, use bundled references only as helper context, and restrict any fallback browsing to official OpenAI domains. _(source: openai-system)_

## research / document-authoring

- `auto-claude/paper-compile` [auto-claude__paper-compile] — Compile LaTeX paper to PDF, fix errors, and verify output. Use when user says \"编译论文\", \"compile paper\", \"build PDF\", \"生成PDF\", or wants to compile LaTeX into a submission-ready PDF. _(source: auto-claude)_
- `auto-claude/paper-plan` [auto-claude__paper-plan] — Generate a structured paper outline from review conclusions and experiment results. Use when user says \"写大纲\", \"paper outline\", \"plan the paper\", \"论文规划\", or wants to create a paper plan before writing. _(source: auto-claude)_
- `auto-claude/paper-write` [auto-claude__paper-write] — Draft LaTeX paper section by section from an outline. Use when user says \"写论文\", \"write paper\", \"draft LaTeX\", \"开始写\", or wants to generate LaTeX content from a paper plan. _(source: auto-claude)_
- `auto-claude/paper-writing` [auto-claude__paper-writing] — Workflow 3: Full paper writing pipeline. Orchestrates paper-plan → paper-figure → paper-write → paper-compile → ULTRAWORK QA to go from a narrative report to a polished, submission-ready PDF. Use when user says \"写论文全流程\", \"write paper pipeline\", \"从报告到PDF\", \"paper writing\", or wants the complete paper generation workflow. _(source: auto-claude)_
- `docx-workbench` [builtin__docx-workbench__docx-workbench] — Create, edit, and review DOCX documents with reproducible formatting. _(source: builtin:docx-workbench)_
- `openai-curated/doc` [openai-curated__doc] — Use when the task involves reading, creating, or editing `.docx` documents, especially when formatting or layout fidelity matters; prefer `python-docx` plus the bundled `scripts/render_docx.py` for visual checks. _(source: openai-curated)_
- `openai-curated/pdf` [openai-curated__pdf] — Use when tasks involve reading, creating, or reviewing PDF files where rendering and layout matter; prefer visual checks by rendering pages (Poppler) and use Python tools such as `reportlab`, `pdfplumber`, and `pypdf` for generation and extraction. _(source: openai-curated)_
- `pdf-toolkit` [builtin__pdf-toolkit__pdf-toolkit] — Create, extract, and transform PDFs with reproducible layout. _(source: builtin:pdf-toolkit)_

## research / literature-and-web-search

- `auto-claude/arxiv` [auto-claude__arxiv] — Search, download, and summarize academic papers from arXiv using MCP tools. Use when user says "search arxiv", "download paper", "fetch arxiv", "arxiv search", "get paper pdf", or wants to find and save papers from arXiv to the local paper library. _(source: auto-claude)_
- `auto-claude/novelty-check` [auto-claude__novelty-check] — Verify research idea novelty against recent literature. Use when user says "查新", "novelty check", "有没有人做过", "check novelty", or wants to verify a research idea is novel before implementing. _(source: auto-claude)_
- `auto-claude/research-lit` [auto-claude__research-lit] — Search and analyze research papers, find related work, summarize key ideas. Use when user says "find papers", "related work", "literature review", "what does this paper say", or needs to understand academic papers. _(source: auto-claude)_
- `web-research` [builtin__web-research__web-research] — Structured web research and source triage with citations. _(source: builtin:web-research)_

## research / media-transcription

- `openai-curated/transcribe` [openai-curated__transcribe] — Transcribe audio files to text with optional diarization and known-speaker hints. Use when a user asks to transcribe speech from audio/video, extract text from recordings, or label speakers in interviews or meetings. _(source: openai-curated)_

## research / presentation-authoring

- `openai-curated/slides` [openai-curated__slides] — Create and edit presentation slide decks (`.pptx`) with PptxGenJS, bundled layout helpers, and render/validation utilities. Use when tasks involve building a new PowerPoint deck, recreating slides from screenshots/PDFs/reference decks, modifying slide content while preserving editable output, adding charts/diagrams/visuals, or diagnosing layout issues such as overflow, overlaps, and font substitution. _(source: openai-curated)_
- `pptx-studio` [builtin__pptx-studio__pptx-studio] — Generate and edit PPTX decks with structured layouts. _(source: builtin:pptx-studio)_

## research / research-ideation

- `auto-claude/idea-creator` [auto-claude__idea-creator] — Generate and rank research ideas given a broad direction. Use when user says "找idea", "brainstorm ideas", "generate research ideas", "what can we work on", or wants to explore a research area for publishable directions. _(source: auto-claude)_
- `auto-claude/idea-discovery` [auto-claude__idea-discovery] — Workflow 1: Full idea discovery pipeline. Orchestrates research-lit → idea-creator → novelty-check to go from a broad research direction to validated, pilot-tested ideas. Use when user says \"找idea全流程\", \"idea discovery pipeline\", \"从零开始找方向\", or wants the complete idea exploration workflow. _(source: auto-claude)_
- `auto-claude/idea-discovery-robot` [auto-claude__idea-discovery-robot] — Workflow 1 adaptation for robotics and embodied AI. Orchestrates robotics-aware literature survey, idea generation, novelty check, and internal critique to go from a broad robotics direction to benchmark-grounded, simulation-first ideas. Use when user says \"robotics idea discovery\", \"机器人找idea\", \"embodied AI idea\", \"机器人方向探索\", \"sim2real 选题\", or wants ideas for manipulation, locomotion, navigation, drones, humanoids, or general robot learning. _(source: auto-claude)_
- `auto-claude/research-pipeline` [auto-claude__research-pipeline] — Full research pipeline: Workflow 1 (idea discovery) → implementation → Workflow 2 (ULTRAWORK loop). Goes from a broad research direction all the way to a submission-ready paper. Use when user says \"全流程\", \"full pipeline\", \"从找idea到投稿\", \"end-to-end research\", or wants the complete autonomous research lifecycle. _(source: auto-claude)_

## research / theory-writing

- `auto-claude/proof-writer` [auto-claude__proof-writer] — Writes rigorous mathematical proofs for ML/AI theory. Use when asked to prove a theorem, lemma, proposition, or corollary, fill in missing proof steps, formalize a proof sketch, 补全证明, 写证明, 证明某个命题, or determine whether a claimed proof can actually be completed under the stated assumptions. _(source: auto-claude)_
