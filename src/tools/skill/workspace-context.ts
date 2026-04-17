import type { LoadedSkill } from "../../features/opencode-skill-loader/types"
import {
  appendDocumentWorkspaceRevision,
  ensureDocumentWorkspace,
  ensurePaperCache,
} from "../../features/boulder-state"
import type { ImageBusConfig } from "../../config/schema/image-bus"
import type {
  DocumentWorkspaceAudience,
  DocumentWorkspacePublishTarget,
  DocumentWorkspaceTrackingPolicy,
} from "../../features/boulder-state"

type ProvisionedWorkspaceContext = {
  markdown: string
}

function extractNamedValue(message: string | undefined, names: string[]): string | undefined {
  if (!message) return undefined

  for (const name of names) {
    const patterns = [
      new RegExp(`${name}\\s*[:=]\\s*"([^"]+)"`, "i"),
      new RegExp(`${name}\\s*[:=]\\s*'([^']+)'`, "i"),
      new RegExp(`${name}\\s*[:=]\\s*([^\\s,;]+)`, "i"),
    ]

    for (const pattern of patterns) {
      const match = message.match(pattern)
      const value = match?.[1]?.trim()
      if (value) return value
    }
  }

  return undefined
}

function slugifyDocumentId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`"'“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "document"
}

function deriveDocumentTitle(message: string | undefined): string | undefined {
  const explicitTitle = extractNamedValue(message, ["title", "document_title", "paper_title"])
  if (explicitTitle) return explicitTitle
  const normalized = message?.trim()
  if (!normalized) return undefined
  return normalized.length <= 120 ? normalized : normalized.slice(0, 117).trimEnd() + "..."
}

function deriveDocumentId(skillName: string, message: string | undefined): string {
  const explicitId = extractNamedValue(message, ["document_id", "doc_id", "doc", "paper_id", "paper"])
  if (explicitId) return slugifyDocumentId(explicitId)

  const explicitTitle = deriveDocumentTitle(message)
  if (explicitTitle) return slugifyDocumentId(explicitTitle)

  return slugifyDocumentId(skillName)
}

function deriveDocumentType(skillName: string): string {
  switch (skillName) {
    case "proposal-and-roadmap":
      return "proposal"
    case "document-asset-pipeline":
      return "document-assets"
    case "docx-workbench":
      return "docx"
    case "pdf-toolkit":
      return "pdf"
    case "pptx-studio":
      return "pptx"
    case "literature-synthesis":
      return "literature-review"
    case "research-paper-pipeline":
      return "research-paper"
    case "paper-evidence":
      return "evidence-synthesis"
    default:
      return "document"
  }
}

function deriveDocumentAudience(message: string | undefined): DocumentWorkspaceAudience | undefined {
  const explicitAudience = extractNamedValue(message, ["audience", "document_audience", "doc_audience"])
    ?.toLowerCase()

  if (explicitAudience === "user" || explicitAudience === "end-user" || explicitAudience === "customer") {
    return "end-user"
  }
  if (explicitAudience === "reader" || explicitAudience === "public" || explicitAudience === "public-reader") {
    return "public-reader"
  }
  if (explicitAudience === "internal" || explicitAudience === "team") {
    return "internal"
  }

  return undefined
}

function deriveDocumentTrackingPolicy(message: string | undefined): DocumentWorkspaceTrackingPolicy {
  const explicitTracking = extractNamedValue(message, ["tracking", "tracking_policy", "doc_tracking"])
    ?.toLowerCase()
  if (explicitTracking === "ephemeral" || explicitTracking === "private") {
    return "ephemeral"
  }
  if (
    explicitTracking === "repo" ||
    explicitTracking === "repo-tracked" ||
    explicitTracking === "tracked" ||
    explicitTracking === "main-repo"
  ) {
    return "repo-tracked"
  }
  return "workspace-git"
}

function shouldDefaultToRepoDocs(message: string | undefined): boolean {
  const normalized = message?.toLowerCase() ?? ""
  return [
    "readme",
    "getting-started",
    "getting started",
    "installation",
    "install guide",
    "usage",
    "how to use",
    "documentation",
    "docs/",
    "open-source",
    "opensource",
    "command reference",
    "api guide",
  ].some((token) => normalized.includes(token))
}

function deriveDocumentPublishTarget(
  message: string | undefined,
  audience: DocumentWorkspaceAudience | undefined,
): DocumentWorkspacePublishTarget {
  const explicitTarget = extractNamedValue(message, ["publish_target", "target", "doc_target"])
    ?.toLowerCase()

  if (
    explicitTarget === "repo-docs" ||
    explicitTarget === "repo" ||
    explicitTarget === "readme" ||
    explicitTarget === "docs"
  ) {
    return "repo-docs"
  }

  if (audience === "public-reader" && shouldDefaultToRepoDocs(message)) {
    return "repo-docs"
  }

  return "workspace-private"
}

function derivePreferredRepoPath(
  message: string | undefined,
  documentId: string,
  publishTarget: DocumentWorkspacePublishTarget,
): string | undefined {
  if (publishTarget !== "repo-docs") return undefined

  const explicitPath = extractNamedValue(message, ["repo_path", "target_path", "publish_path", "doc_path"])
  if (explicitPath) return explicitPath

  const normalized = message?.toLowerCase() ?? ""
  if (normalized.includes("readme")) {
    return "README.md"
  }

  return `docs/${documentId}.md`
}

function shouldProvisionDocumentWorkspace(skillName: string): boolean {
  return new Set([
    "proposal-and-roadmap",
    "document-asset-pipeline",
    "docx-workbench",
    "pdf-toolkit",
    "pptx-studio",
    "literature-synthesis",
    "research-paper-pipeline",
    "paper-evidence",
  ]).has(skillName)
}

function shouldProvisionPaperCache(skillName: string): boolean {
  return new Set([
    "literature-synthesis",
    "research-paper-pipeline",
    "paper-evidence",
    "pubmed-search",
  ]).has(skillName)
}

function formatImageBusSection(imageBusConfig?: ImageBusConfig): string | null {
  if (!imageBusConfig?.enabled) return null

  const providerLines: string[] = []
  const googleProvider = imageBusConfig.providers?.google_nano_banana
  if (googleProvider?.enabled) {
    providerLines.push(
      `- google_nano_banana: ${googleProvider.model ?? "model-not-set"} @ ${googleProvider.base_url ?? "base_url-not-set"}`
    )
    if (googleProvider.generate_endpoint) {
      providerLines.push(`- google_nano_banana.generate_endpoint: ${googleProvider.generate_endpoint}`)
    }
  }

  const comfyProvider = imageBusConfig.providers?.comfyui
  if (comfyProvider?.enabled) {
    providerLines.push(
      `- comfyui: ${comfyProvider.base_url ?? "base_url-not-set"}${comfyProvider.workflow_endpoint ? ` (${comfyProvider.workflow_endpoint})` : ""}`
    )
  }

  const stableDiffusionProvider = imageBusConfig.providers?.stable_diffusion
  if (stableDiffusionProvider?.enabled) {
    providerLines.push(
      `- stable_diffusion: ${stableDiffusionProvider.model ?? "model-not-set"} @ ${stableDiffusionProvider.base_url ?? "base_url-not-set"}`
    )
    if (stableDiffusionProvider.txt2img_endpoint) {
      providerLines.push(`- stable_diffusion.txt2img_endpoint: ${stableDiffusionProvider.txt2img_endpoint}`)
    }
  }

  for (const customProvider of imageBusConfig.providers?.custom ?? []) {
    if (!customProvider.enabled) continue
    providerLines.push(
      `- ${customProvider.name ?? "custom"}: ${customProvider.model ?? "model-not-set"} @ ${customProvider.base_url ?? "base_url-not-set"}`
    )
  }

  if (providerLines.length === 0) return null

  return [
    "## Image Bus",
    "",
    `- enabled: \`true\``,
    `- review_with_main_model: \`${imageBusConfig.review_with_main_model === true}\``,
    `- default_output_format: \`${imageBusConfig.default_output_format ?? "svg"}\``,
    `- context_memory.enabled: \`${imageBusConfig.context_memory?.enabled === true}\``,
    `- context_memory.carry_prompt_context: \`${imageBusConfig.context_memory?.carry_prompt_context === true}\``,
    `- context_memory.max_history_turns: \`${imageBusConfig.context_memory?.max_history_turns ?? 5}\``,
    `- context_memory.include_provider_decision_trace: \`${imageBusConfig.context_memory?.include_provider_decision_trace === true}\``,
    `- routing.strategy: \`${imageBusConfig.routing?.strategy ?? "local-first"}\``,
    `- routing.force_google_for_scientific: \`${imageBusConfig.routing?.force_google_for_scientific === true}\``,
    `- routing.allow_google_for_general: \`${imageBusConfig.routing?.allow_google_for_general === true}\``,
    `- subscription.mode: \`${imageBusConfig.subscription?.mode ?? "self-managed"}\``,
    ...providerLines,
  ].join("\n")
}

export function provisionSkillWorkspaceContext(args: {
  directory?: string
  sessionID?: string
  skill: LoadedSkill
  userMessage?: string
  imageBusConfig?: ImageBusConfig
}): ProvisionedWorkspaceContext | null {
  const { directory, sessionID, skill, userMessage, imageBusConfig } = args
  if (!directory || !sessionID) return null

  const sections: string[] = []

  if (shouldProvisionDocumentWorkspace(skill.name)) {
    const documentId = deriveDocumentId(skill.name, userMessage)
    const title = deriveDocumentTitle(userMessage)
    const documentType = deriveDocumentType(skill.name)
    const audience = deriveDocumentAudience(userMessage)
    const publishTarget = deriveDocumentPublishTarget(userMessage, audience)
    const preferredRepoPath = derivePreferredRepoPath(userMessage, documentId, publishTarget)
    const trackingPolicy = (() => {
      const explicit = deriveDocumentTrackingPolicy(userMessage)
      if (explicit !== "workspace-git") return explicit
      if (publishTarget === "repo-docs") return "repo-tracked"
      return explicit
    })()
    const workspace = ensureDocumentWorkspace({
      directory,
      sessionId: sessionID,
      documentId,
      ...(title ? { title } : {}),
      documentType,
      ...(audience ? { audience } : {}),
      trackingPolicy,
      publishTarget,
      ...(preferredRepoPath ? { preferredRepoPath } : {}),
    })
    appendDocumentWorkspaceRevision({
      paths: workspace,
      summary: `Loaded skill ${skill.name}`,
      metadata: {
        source: "skill-tool",
        ...(userMessage ? { user_message: userMessage } : {}),
      },
    })

    sections.push(
      [
        "## Document Workspace",
        "",
        `- document_id: \`${documentId}\``,
        `- document_type: \`${documentType}\``,
        `- audience: \`${audience ?? "internal"}\``,
        `- tracking_policy: \`${trackingPolicy}\``,
        `- publish_target: \`${publishTarget}\``,
        `- main_repo_tracking: \`${trackingPolicy === "repo-tracked" ? "enabled" : "disabled"}\``,
        `- preferred_repo_path: \`${preferredRepoPath ?? "(none)"}\``,
        `- root: \`${workspace.rootDir}\``,
        `- source: \`${workspace.sourceDir}\``,
        `- sections: \`${workspace.sectionsDir}\``,
        `- diagrams: \`${workspace.diagramsDir}\``,
        `- figures: \`${workspace.figuresDir}\``,
        `- assets: \`${workspace.assetsDir}\``,
        `- rendered: \`${workspace.renderedDir}\``,
        `- output: \`${workspace.outputDir}\``,
        `- manifest: \`${workspace.manifestFile}\``,
      ].join("\n"),
    )
  }

  if (shouldProvisionPaperCache(skill.name)) {
    const paperCache = ensurePaperCache({
      directory,
      sessionId: sessionID,
    })

    sections.push(
      [
        "## Paper Cache",
        "",
        `- root: \`${paperCache.rootDir}\``,
        `- pdf: \`${paperCache.pdfDir}\``,
        `- markdown: \`${paperCache.markdownDir}\``,
        `- notes: \`${paperCache.notesDir}\``,
        `- citations: \`${paperCache.citationsDir}\``,
        `- manifest: \`${paperCache.manifestFile}\``,
      ].join("\n"),
    )
  }

  const imageBusSection = formatImageBusSection(imageBusConfig)
  if (imageBusSection) {
    sections.push(imageBusSection)
  }

  if (sections.length === 0) return null

  return {
    markdown: sections.join("\n\n"),
  }
}
