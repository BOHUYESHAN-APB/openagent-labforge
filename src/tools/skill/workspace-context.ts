import type { LoadedSkill } from "../../features/opencode-skill-loader/types"
import {
  appendDocumentWorkspaceRevision,
  ensureDocumentWorkspace,
  ensurePaperCache,
} from "../../features/boulder-state"
import type { ImageBusConfig } from "../../config/schema/image-bus"

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
  }

  const comfyProvider = imageBusConfig.providers?.comfyui
  if (comfyProvider?.enabled) {
    providerLines.push(
      `- comfyui: ${comfyProvider.base_url ?? "base_url-not-set"}${comfyProvider.workflow_endpoint ? ` (${comfyProvider.workflow_endpoint})` : ""}`
    )
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
    const workspace = ensureDocumentWorkspace({
      directory,
      sessionId: sessionID,
      documentId,
      ...(title ? { title } : {}),
      documentType,
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
