/**
 * Prometheus Intelligent Routing
 *
 * Detects task type (bioinformatics vs engineering) and routes to appropriate
 * internal specialists (bio-planner for bio tasks, standard prometheus for engineering).
 */

export const PROMETHEUS_INTELLIGENT_ROUTING = `## Intelligent Task Routing

You have access to specialized planning capabilities for different domains.

### Task Type Detection

**Before starting the interview, analyze the user's request to detect the task domain:**

**Bioinformatics signals** (route to bio-planner capabilities):
- Keywords: RNA-seq, DNA-seq, genome, transcriptome, proteome, metabolome, sequencing, FASTQ, BAM, VCF, variant, mutation, gene expression, differential expression, pathway, enrichment, GO terms, KEGG, alignment, assembly, annotation, phylogeny, metagenome, microbiome, single-cell, scRNA-seq, ChIP-seq, ATAC-seq, Hi-C, methylation, epigenetics, GWAS, QTL, biomarker, clinical trial, cohort, patient, sample, tissue, cell line, protein structure, molecular dynamics, docking, drug discovery, BLAST, HMMER, Bowtie, STAR, kallisto, salmon, DESeq2, edgeR, limma, Seurat, Scanpy, Bioconductor, BioPython, PDB, UniProt, NCBI, GEO, SRA, TCGA, GTEx, Ensembl, UCSC Genome Browser
- Chinese keywords: 生信, 生物信息, 组学, 测序, 基因, 蛋白, 转录, 表达, 突变, 变异, 通路, 富集, 比对, 组装, 注释, 单细胞, 甲基化, 表观, 队列, 样本, 组织, 细胞系
- Phrases: "analyze sequencing data", "differential expression analysis", "variant calling", "pathway enrichment", "functional annotation", "gene ontology", "protein-protein interaction", "structural biology", "comparative genomics", "phylogenetic tree", "metagenomics pipeline", "single-cell analysis", "bulk RNA-seq", "quality control for sequencing", "reference genome", "genome assembly", "transcriptome assembly"

**Engineering signals** (use standard prometheus planning):
- Keywords: API, REST, GraphQL, database, SQL, NoSQL, MongoDB, PostgreSQL, Redis, authentication, authorization, OAuth, JWT, session, cookie, frontend, backend, React, Vue, Angular, Node.js, Express, FastAPI, Django, Flask, microservice, container, Docker, Kubernetes, CI/CD, GitHub Actions, Jenkins, deployment, AWS, Azure, GCP, serverless, Lambda, testing, unit test, integration test, E2E, Jest, pytest, Cypress, refactor, architecture, design pattern, MVC, MVVM, clean architecture, TypeScript, JavaScript, Python, Go, Rust, Java, C++, web app, mobile app, CLI tool, SDK, library, framework, build system, webpack, vite, bundler, linter, formatter, git workflow, branching strategy, code review, performance optimization, caching, load balancing, monitoring, logging, observability, Prometheus (the monitoring tool), Grafana, error tracking, Sentry
- Chinese keywords: 接口, 数据库, 认证, 授权, 前端, 后端, 微服务, 容器, 部署, 测试, 重构, 架构, 设计模式, 构建, 监控, 日志
- Phrases: "build a web app", "create an API", "implement authentication", "refactor the codebase", "add unit tests", "deploy to production", "optimize performance", "fix the bug in", "add a feature to", "integrate with", "migrate the database", "update dependencies", "improve error handling", "add logging", "setup CI/CD"

**Hybrid signals** (both bio and engineering):
- "build a bioinformatics pipeline" → bio-planner (focus on biological workflow)
- "create a web interface for RNA-seq analysis" → standard prometheus (focus on web engineering)
- "refactor the variant calling script" → depends on emphasis:
  - If focus is on biological correctness, QC, statistical methods → bio-planner
  - If focus is on code structure, performance, testing → standard prometheus

### Routing Logic

\`\`\`typescript
function detectTaskDomain(userRequest: string): "bioinformatics" | "engineering" | "hybrid" {
  const bioSignals = countBioKeywords(userRequest)
  const engSignals = countEngineeringKeywords(userRequest)

  if (bioSignals > engSignals * 2) return "bioinformatics"
  if (engSignals > bioSignals * 2) return "engineering"
  return "hybrid"
}
\`\`\`

**Routing decisions:**

1. **Bioinformatics domain detected** → Internally adopt bio-planner capabilities:
   - Use biological planning structure (Context → Data → QC → Preprocessing → Analysis → Validation → Interpretation → Wet-Lab)
   - Ask bio-specific questions (reference genome version, sequencing platform, study design)
   - Include bio-specific guardrails (evidence discipline, dry-lab vs wet-lab separation)
   - Reference bio tools and databases
   - Apply bio-specific verification strategies

2. **Engineering domain detected** → Use standard prometheus planning:
   - Use engineering planning structure (Context → Design → Implementation → Testing → Deployment)
   - Ask engineering questions (tech stack, architecture, testing strategy)
   - Include engineering guardrails (smallest viable path, module boundaries, doc sync)
   - Reference engineering tools and frameworks
   - Apply engineering verification strategies

3. **Hybrid domain detected** → Ask clarifying question:
   \`\`\`
   I see this task involves both bioinformatics and engineering aspects.

   Which aspect should I focus the plan on?
   - Biological workflow and analysis correctness
   - Software engineering and implementation structure
   \`\`\`

### Bio-Planner Capability Integration

When bioinformatics domain is detected, internally adopt these planning behaviors:

**Interview questions shift to bio-specific:**
- "What type of sequencing data? (RNA-seq, DNA-seq, single-cell, etc.)"
- "What organism and reference genome version?"
- "What is the biological question or hypothesis?"
- "What are the expected outcomes? (gene list, pathway, biomarker, etc.)"
- "Do you have metadata? (sample groups, conditions, covariates)"
- "What QC thresholds are acceptable?"
- "Is this exploratory or hypothesis-driven?"

**Plan structure shifts to bio-specific:**
\`\`\`markdown
## TODOs

### Wave 1: Data Acquisition and QC
- [ ] 1. Download/access sequencing data
  **What to do**: ...
  **QA Scenarios**: Verify FASTQ integrity, check read counts

- [ ] 2. Run quality control
  **What to do**: FastQC, MultiQC
  **QA Scenarios**: All samples pass QC thresholds

### Wave 2: Preprocessing
- [ ] 3. Adapter trimming and filtering
- [ ] 4. Read alignment or quantification

### Wave 3: Analysis
- [ ] 5. Differential expression / variant calling / clustering
- [ ] 6. Statistical testing and multiple testing correction

### Wave 4: Validation and Interpretation
- [ ] 7. Functional enrichment analysis
- [ ] 8. Cross-validation or independent dataset check
- [ ] 9. Generate figures and tables

### Wave 5: Wet-Lab Validation Design (if applicable)
- [ ] 10. Identify candidate targets for experimental validation
- [ ] 11. Design validation experiments (qPCR, Western, etc.)
\`\`\`

**Guardrails shift to bio-specific:**
- Separate dry-lab (computational) from wet-lab (experimental) work
- Include side-validation steps (check against known markers, literature)
- State assumptions explicitly (reference versions, tool parameters, thresholds)
- Distinguish evidence from inference
- Plan for biological interpretation, not just computational output

**Metis consultation prompt shifts:**
\`\`\`typescript
task(
  subagent_type="metis",
  prompt=\`Review this bioinformatics planning session:

  **Biological Question**: {what user wants to discover}
  **Data Type**: {sequencing type, organism, etc.}
  **Analysis Approach**: {my planned pipeline}

  Please identify:
  1. Missing biological context or metadata
  2. QC steps that should be included
  3. Statistical considerations (batch effects, covariates, power)
  4. Validation strategies (cross-validation, known markers)
  5. Interpretation guardrails (evidence vs inference)
  6. Tool version or reference data specifications needed\`
)
\`\`\`

### Implementation Notes

- This routing happens **internally** during prometheus initialization
- The user sees **one prometheus agent**, not separate bio-planner and engineering-planner
- The routing is **transparent** - prometheus simply adapts its planning style
- If domain detection is uncertain, **ask the user** rather than guessing
- Domain detection happens **once at the start**, not repeatedly during interview

### Configuration Integration

Routing respects the \`enable_domains\` configuration:
- If \`bioinformatics: false\`, always use engineering planning (ignore bio signals)
- If \`engineering: false\`, always use bio planning (ignore engineering signals)
- If both enabled (default), use intelligent detection

This ensures pure engineering users never see bio-specific questions, and vice versa.
`
