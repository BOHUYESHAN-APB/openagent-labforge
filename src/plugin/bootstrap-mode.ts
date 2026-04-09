import type {
  SessionBootstrapMode,
  SessionBootstrapSelection,
  BootstrapModeCategory,
} from "../features/claude-code-session-state"

type BootstrapModePreset = SessionBootstrapMode & {
  tokens: string[]
  recommended?: boolean
  exampleZh: string
  exampleEn: string
}

const ENGINEERING_BOOTSTRAP_PRESETS: BootstrapModePreset[] = [
  {
    category: "engineering",
    key: "product-app-workspace",
    labelZh: "产品工作台仓",
    labelEn: "product app / workspace repo",
    summaryZh: "按产品仓方式起骨架，优先 app 结构、状态流、页面层次、验证路径和用户可见交付。",
    summaryEn: "Treat the repo as a product workspace and prioritize app structure, state flow, visible user surfaces, and real verification.",
    exampleZh: "例：后台、桌面端、数据大屏、用户工作台",
    exampleEn: "Examples: dashboard, desktop app, workspace, admin console",
    tokens: ["1", "product", "workspace", "dashboard", "app", "产品", "工作台", "仪表盘", "应用"],
  },
  {
    category: "engineering",
    key: "library-plugin-sdk",
    labelZh: "库 / 插件 / SDK 仓",
    labelEn: "library / plugin / SDK repo",
    summaryZh: "按可复用能力仓设计，优先 API 契约、扩展点、兼容性、示例和公开文档。",
    summaryEn: "Treat the repo as a reusable library/plugin/SDK and prioritize contracts, extension points, compatibility, examples, and docs.",
    exampleZh: "例：OpenCode 插件、CLI 工具库、二次开发 SDK",
    exampleEn: "Examples: plugin, reusable package, SDK, extension",
    tokens: ["2", "library", "plugin", "sdk", "库", "插件"],
  },
  {
    category: "engineering",
    key: "backend-service-tooling",
    labelZh: "后端 / 服务 / 工具链仓",
    labelEn: "backend / service / tooling repo",
    summaryZh: "按服务端工程体系起步，优先模块边界、配置、运行链路、验证和可观测性。",
    summaryEn: "Treat the repo as backend/service/tooling and prioritize module boundaries, config, runtime paths, verification, and observability.",
    exampleZh: "例：API 服务、任务调度器、数据处理后端、开发工具链",
    exampleEn: "Examples: API service, worker, scheduler, tooling backend",
    tokens: ["3", "backend", "service", "tooling", "后端", "服务", "工具链"],
  },
  {
    category: "engineering",
    key: "docs-knowledge-base",
    labelZh: "文档 / 知识库仓",
    labelEn: "documentation / knowledge-base repo",
    summaryZh: "按文档仓组织，优先总览、索引、读者入口页和产物目录约束。",
    summaryEn: "Treat the repo as a docs/knowledge-base repo and prioritize overview pages, indexes, reader entry points, and output layout.",
    exampleZh: "例：项目文档站、FAQ、教程、说明手册",
    exampleEn: "Examples: docs site, guidebook, FAQ, tutorial repo",
    tokens: ["4", "documentation", "docs", "knowledge", "文档", "知识库"],
  },
  {
    category: "engineering",
    key: "research-prototype-spike",
    labelZh: "研究 / 原型 / Spike 仓",
    labelEn: "research / prototype / spike repo",
    summaryZh: "按探索性仓组织，优先假设、实验记录、最小验证链和后续收敛路径。",
    summaryEn: "Treat the repo as a research/prototype/spike repo and prioritize hypotheses, experiment logs, minimal verification, and convergence paths.",
    exampleZh: "例：验证想法、算法试验、原型探索",
    exampleEn: "Examples: prototype, experiment, spike, concept validation",
    tokens: ["5", "research", "prototype", "spike", "研究", "原型"],
  },
  {
    category: "engineering",
    key: "bootstrap-first-scaffold",
    labelZh: "工程骨架优先（推荐）",
    labelEn: "bootstrap-first scaffold",
    summaryZh: "先把目录、规则、计划、验证和交付路径搭干净，再开始长期自动化推进。",
    summaryEn: "Establish a clean scaffold for directories, rules, plans, verification, and delivery before starting long-running autonomous work.",
    exampleZh: "例：刚建仓，先定目录、约束、文档和验证路径",
    exampleEn: "Examples: clean repo bootstrap, long-running engineering setup",
    tokens: ["6", "bootstrap", "scaffold", "骨架", "长期", "工程骨架"],
    recommended: true,
  },
]

const BIO_BOOTSTRAP_PRESETS: BootstrapModePreset[] = [
  {
    category: "bio",
    key: "mainline-material-pack",
    labelZh: "综合主线材料包（推荐）",
    labelEn: "mainline material pack",
    summaryZh: "按主线材料包 + 波次推进制 + 资产子包组织，适合像 swxxx 这种长期迭代生信主线。",
    summaryEn: "Treat the repo as a mainline material pack with wave-based progression and asset subpacks for long-running bio iteration.",
    exampleZh: "例：主线材料包、下一波范围、正式报告链、图件子包",
    exampleEn: "Examples: mainline pack, next-wave notes, formal report chain, asset subpacks",
    tokens: ["1", "mainline", "material", "pack", "主线材料包", "综合主线", "swxxx"],
    recommended: true,
  },
  {
    category: "bio",
    key: "bio-drylab-pipeline",
    labelZh: "干实验流程仓",
    labelEn: "bio dry-lab pipeline workspace",
    summaryZh: "优先搭建可复现分析流程、输入输出目录、脚本、日志和中间产物规范。",
    summaryEn: "Prioritize reproducible dry-lab pipelines, input/output layout, scripts, logs, and intermediate artifacts.",
    exampleZh: "例：RNA-seq、变异分析、注释流程、批处理脚本",
    exampleEn: "Examples: RNA-seq pipeline, annotation flow, batch dry-lab runs",
    tokens: ["2", "dry-lab", "pipeline", "干实验", "流程"],
  },
  {
    category: "bio",
    key: "literature-evidence",
    labelZh: "文献 / 证据综合仓",
    labelEn: "literature / evidence synthesis workspace",
    summaryZh: "优先做论文检索、证据分层、claim discipline 和综述型交付。",
    summaryEn: "Prioritize literature search, evidence layering, claim discipline, and review-style outputs.",
    exampleZh: "例：综述、证据矩阵、研究现状盘点",
    exampleEn: "Examples: review, evidence matrix, literature synthesis",
    tokens: ["3", "literature", "evidence", "文献", "证据"],
  },
  {
    category: "bio",
    key: "bio-figure-assets",
    labelZh: "图件 / 投稿资产仓",
    labelEn: "bio figure / submission-asset workspace",
    summaryZh: "优先建立图件、表格、脚本和投稿材料资产目录。",
    summaryEn: "Prioritize figures, tables, scripts, and submission asset organization.",
    exampleZh: "例：机制图、结果图、投稿图版、答辩资产包",
    exampleEn: "Examples: figure panels, submission assets, defense figures",
    tokens: ["4", "figure", "visualization", "submission", "图件", "投稿"],
  },
  {
    category: "bio",
    key: "bio-exploratory-proof",
    labelZh: "轻量探索 / 证明型仓",
    labelEn: "lightweight exploratory proof repo",
    summaryZh: "优先做小规模探索、资源盘点、可行性审计和最小证明链。",
    summaryEn: "Prioritize lightweight exploration, resource audits, feasibility checks, and minimal proof chains.",
    exampleZh: "例：先做资源可用性审计、小样本探索、前期证明链",
    exampleEn: "Examples: feasibility check, scouting repo, minimal proof path",
    tokens: ["5", "exploratory", "proof", "scouting", "探索", "证明"],
  },
  {
    category: "bio",
    key: "bio-bootstrap-scaffold",
    labelZh: "清爽工程骨架优先",
    labelEn: "bootstrap-first bio scaffold",
    summaryZh: "先把目录、缓存、临时记忆、图件与文档产物规则搭清楚，再进入长时间自动分析。",
    summaryEn: "Establish a clean engineering scaffold for caches, runtime memory, figures, and document outputs before long-running bio automation.",
    exampleZh: "例：先定缓存、计划、图件、文档和交付目录",
    exampleEn: "Examples: set caches, plans, figures, and document outputs first",
    tokens: ["6", "bootstrap", "bio scaffold", "骨架", "清爽", "长期生信"],
  },
]

function createAiDesignedMode(category: BootstrapModeCategory): SessionBootstrapMode {
  return {
    category,
    key: "ai-designed-posture",
    labelZh: "让 AI 自行设计工程姿态",
    labelEn: "let AI derive the repo posture",
    summaryZh: "根据用户首条需求，按固定量表自动推导仓库主类型、主交付物、执行节奏、产物组织方式、验证强度、用户参与强度和提问策略。",
    summaryEn: "Derive the repo posture from the initial request using a fixed scale: repo type, primary deliverable, execution rhythm, artifact organization, verification strength, user involvement, and question policy.",
  }
}

function getBootstrapPresets(category: BootstrapModeCategory): BootstrapModePreset[] {
  return category === "bio" ? BIO_BOOTSTRAP_PRESETS : ENGINEERING_BOOTSTRAP_PRESETS
}

export function getBootstrapModeCategory(agent: string | undefined): BootstrapModeCategory {
  if (agent === "bio-autopilot" || agent === "bio-orchestrator") {
    return "bio"
  }
  return "engineering"
}

export function buildBootstrapChoicesBlock(agent: string | undefined): string[] {
  const category = getBootstrapModeCategory(agent)
  const presetLines = getBootstrapPresets(category).map((preset, index) => {
    const recommended = preset.recommended ? " [Recommended / 推荐]" : ""
    return [
      `  ${index + 1}. ${preset.labelZh} | ${preset.labelEn}${recommended}`,
      `     - ${preset.exampleZh}`,
      `     - ${preset.exampleEn}`,
    ].join("\n")
  })
  const aiDesigned = createAiDesignedMode(category)
  presetLines.push(
    `  7. ${aiDesigned.labelZh} | ${aiDesigned.labelEn}\n     - 例：用户只给目标，让 AI 先按固定量表推导工程体系\n     - Example: let AI infer the repo posture from the first real request`
  )
  return presetLines
}

function createCustomMode(category: BootstrapModeCategory, text: string): SessionBootstrapMode {
  return {
    category,
    key: "custom",
    labelZh: "自定义工程姿态",
    labelEn: "custom project posture",
    summaryZh: `按用户自定义姿态执行：${text}`,
    summaryEn: `Follow the user-defined project posture: ${text}`,
    isCustom: true,
    customInstruction: text,
  }
}

function dedupeModes(modes: SessionBootstrapMode[]): SessionBootstrapMode[] {
  const seen = new Set<string>()
  const result: SessionBootstrapMode[] = []
  for (const mode of modes) {
    if (seen.has(mode.key)) continue
    seen.add(mode.key)
    result.push(mode)
  }
  return result
}

export function parseBootstrapModeSelection(
  agent: string | undefined,
  promptText: string,
): SessionBootstrapSelection | null {
  const category = getBootstrapModeCategory(agent)
  const presets = getBootstrapPresets(category)
  const normalized = promptText.trim().toLowerCase()
  const selected: SessionBootstrapMode[] = []

  const numberMatches = Array.from(normalized.matchAll(/\b([1-7])\b/g)).map((match) => Number(match[1]))
  for (const index of numberMatches) {
    if (index >= 1 && index <= 6 && presets[index - 1]) {
      selected.push({ ...presets[index - 1] })
    }
    if (index === 7) {
      selected.push(createAiDesignedMode(category))
    }
  }

  for (const preset of presets) {
    if (preset.tokens.some((token) => normalized.includes(token.toLowerCase()))) {
      selected.push({ ...preset })
    }
  }

  if (/(?:^|\b)(?:7|ai|让ai|让 ai|自行设计|auto design|ai design)(?:\b|$)/iu.test(promptText)) {
    selected.push(createAiDesignedMode(category))
  }

  const customMatch = promptText.match(/(?:^|\b)(?:8|custom|自定义)\s*[:：-]?\s*(.+)$/iu)
  if (customMatch?.[1]?.trim()) {
    selected.push(createCustomMode(category, customMatch[1].trim()))
  }

  const deduped = dedupeModes(selected)
  if (deduped.length === 0) return null

  return {
    category,
    primary: deduped[0],
    secondary: deduped.slice(1),
  }
}

export function buildBootstrapModeStickyContext(selection: SessionBootstrapSelection): string {
  const lines = [
    "[bootstrap-mode]",
    `- Primary repo posture: ${selection.primary.labelZh} | ${selection.primary.labelEn}`,
    `- Primary guidance: ${selection.primary.summaryZh}`,
    `- Primary guidance (EN): ${selection.primary.summaryEn}`,
  ]

  if (selection.secondary.length > 0) {
    lines.push("- Companion postures:")
    for (const mode of selection.secondary) {
      lines.push(`  - ${mode.labelZh} | ${mode.labelEn}`)
    }
  }

  lines.push(
    "- Keep using this repo posture set until the user explicitly changes it.",
    "- Do not re-ask the bootstrap question every turn once the posture is set.",
  )

  if (selection.primary.isCustom && selection.primary.customInstruction) {
    lines.push(`- Custom instruction: ${selection.primary.customInstruction}`)
  }

  return lines.join("\n")
}
