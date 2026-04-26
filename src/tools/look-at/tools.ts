import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, extname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { tool, type PluginInput, type ToolDefinition } from "@opencode-ai/plugin"
import JSZip from "jszip"
import { LOOK_AT_DESCRIPTION, MULTIMODAL_LOOKER_AGENT } from "./constants"
import type { LookAtArgs } from "./types"
import { log, promptSyncWithModelSuggestionRetry } from "../../shared"
import { getRuntimeAgentName } from "../../shared/agent-display-names"
import { extractLatestAssistantText } from "./assistant-message-extractor"
import type { LookAtArgsWithAlias } from "./look-at-arguments"
import { normalizeArgs, validateArgs } from "./look-at-arguments"
import {
  extractBase64Data,
  inferMimeTypeFromBase64,
  inferMimeTypeFromFilePath,
} from "./mime-type-inference"
import { resolveMultimodalLookerAgentMetadata } from "./multimodal-agent-metadata"
import {
  needsConversion,
  convertImageToJpeg,
  convertBase64ImageToJpeg,
  cleanupConvertedImage,
} from "./image-converter"
import {
  supportsNativePdf,
  supportsNativePptx,
  getUnsupportedFileTypeMessage,
} from "./model-capability"

type FilePart = { type: "file"; mime: string; url: string; filename: string }

const MAX_FILE_PARTS = 20

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".heic",
  ".heif",
  ".cr2",
  ".crw",
  ".nef",
  ".nrw",
  ".arw",
  ".sr2",
  ".srf",
  ".pef",
  ".orf",
  ".raw",
  ".raf",
  ".dng",
  ".psd",
  ".svg",
  ".avif",
])

const OFFICE_MEDIA_PREFIX: Record<string, string> = {
  ".docx": "word/media/",
  ".pptx": "ppt/media/",
}

async function isDirectoryPath(filePath: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath)
    return fileStats.isDirectory()
  } catch {
    return false
  }
}

function isOfficeDocumentPath(filePath: string): boolean {
  const extension = extname(filePath).toLowerCase()
  return extension === ".docx" || extension === ".pptx"
}

async function collectImageFilesFromDirectory(directoryPath: string, maxCount = MAX_FILE_PARTS): Promise<string[]> {
  const collected: string[] = []
  const pendingDirectories: string[] = [directoryPath]

  while (pendingDirectories.length > 0 && collected.length < maxCount) {
    const currentDirectory = pendingDirectories.pop()
    if (!currentDirectory) {
      break
    }

    const entries = await readdir(currentDirectory, { withFileTypes: true })
    for (const entry of entries) {
      if (collected.length >= maxCount) {
        break
      }

      const fullPath = join(currentDirectory, entry.name)
      if (entry.isDirectory()) {
        pendingDirectories.push(fullPath)
        continue
      }

      const extension = extname(entry.name).toLowerCase()
      if (IMAGE_EXTENSIONS.has(extension)) {
        collected.push(fullPath)
      }
    }
  }

  return collected
}

async function createFilePartFromPath(filePath: string, tempFilesToCleanup: string[]): Promise<FilePart> {
  let mimeType = inferMimeTypeFromFilePath(filePath)
  let actualFilePath = filePath

  if (needsConversion(mimeType)) {
    try {
      const convertedPath = convertImageToJpeg(filePath, mimeType)
      tempFilesToCleanup.push(convertedPath)
      actualFilePath = convertedPath
      mimeType = "image/jpeg"
    } catch (conversionError) {
      const failedConversionPath = getTemporaryConversionPath(conversionError)
      if (failedConversionPath) {
        tempFilesToCleanup.push(failedConversionPath)
      }
      const message = conversionError instanceof Error ? conversionError.message : String(conversionError)
      throw new Error(`Failed to convert image format for '${filePath}': ${message}`)
    }
  }

  return {
    type: "file",
    mime: mimeType,
    url: pathToFileURL(actualFilePath).href,
    filename: basename(actualFilePath),
  }
}

async function extractEmbeddedMediaFromOfficeFile(filePath: string): Promise<{ embeddedImagePaths: string[]; tempDirectory: string | null }> {
  const extension = extname(filePath).toLowerCase()
  const mediaPrefix = OFFICE_MEDIA_PREFIX[extension]
  if (!mediaPrefix) {
    return { embeddedImagePaths: [], tempDirectory: null }
  }

  const fileData = await readFile(filePath)
  const zip = await JSZip.loadAsync(fileData)
  const mediaEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.startsWith(mediaPrefix))
    .slice(0, MAX_FILE_PARTS)

  if (mediaEntries.length === 0) {
    return { embeddedImagePaths: [], tempDirectory: null }
  }

  const tempDirectory = await mkdtemp(join(tmpdir(), "look-at-office-media-"))
  const embeddedImagePaths: string[] = []

  for (const entry of mediaEntries) {
    const bytes = await entry.async("nodebuffer")
    const outputPath = join(tempDirectory, basename(entry.name))
    await writeFile(outputPath, bytes)

    const mimeType = inferMimeTypeFromFilePath(outputPath)
    if (mimeType.startsWith("image/")) {
      embeddedImagePaths.push(outputPath)
    }
  }

  return {
    embeddedImagePaths,
    tempDirectory,
  }
}

function getTemporaryConversionPath(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null
  }

  const temporaryOutputPath = Reflect.get(error, "temporaryOutputPath")
  if (typeof temporaryOutputPath === "string" && temporaryOutputPath.length > 0) {
    return temporaryOutputPath
  }

  const temporaryDirectory = Reflect.get(error, "temporaryDirectory")
  if (typeof temporaryDirectory === "string" && temporaryDirectory.length > 0) {
    return temporaryDirectory
  }

  return null
}

export { normalizeArgs, validateArgs } from "./look-at-arguments"

export function createLookAt(ctx: PluginInput): ToolDefinition {
  return tool({
    description: LOOK_AT_DESCRIPTION,
    args: {
      file_path: tool.schema.string().optional().describe("Absolute path to the file to analyze"),
      image_data: tool.schema.string().optional().describe("Base64 encoded image data (for clipboard/pasted images)"),
      goal: tool.schema.string().describe("What specific information to extract from the file"),
    },
    async execute(rawArgs: LookAtArgs, toolContext) {
      const args = normalizeArgs(rawArgs as LookAtArgsWithAlias)
      const validationError = validateArgs(args)
      if (validationError) {
        log(`[look_at] Validation failed: ${validationError}`)
        return validationError
      }

      const isBase64Input = Boolean(args.image_data)
      const sourceDescription = isBase64Input ? "clipboard/pasted image" : args.file_path
      log(`[look_at] Analyzing ${sourceDescription}, goal: ${args.goal}`)

      const imageData = args.image_data
      const filePath = args.file_path

      let fileParts: FilePart[] = []
      let promptTargetDescription = isBase64Input ? "image" : "file"
      const sourceNotes: string[] = []
      let tempFilesToCleanup: string[] = []
      const tempDirectoriesToCleanup: string[] = []

      try {
        if (imageData) {
          const mimeType = inferMimeTypeFromBase64(imageData)
          
          let finalBase64Data = extractBase64Data(imageData)
          let finalMimeType = mimeType
          
          if (needsConversion(mimeType)) {
            log(`[look_at] Detected unsupported Base64 format: ${mimeType}, converting to JPEG...`)
            try {
              const { base64, tempFiles } = convertBase64ImageToJpeg(finalBase64Data, mimeType)
              finalBase64Data = base64
              finalMimeType = "image/jpeg"
              tempFilesToCleanup = tempFiles
              log(`[look_at] Base64 conversion successful`)
            } catch (conversionError) {
              log(`[look_at] Base64 conversion failed: ${conversionError}`)
              return `Error: Failed to convert Base64 image format. ${conversionError}`
            }
          }
          
          fileParts = [{
            type: "file",
            mime: finalMimeType,
            url: `data:${finalMimeType};base64,${finalBase64Data}`,
            filename: `clipboard-image.${finalMimeType.split("/")[1] || "png"}`,
          }]
        } else if (filePath) {
          if (await isDirectoryPath(filePath)) {
            const imagePaths = await collectImageFilesFromDirectory(filePath)
            if (imagePaths.length === 0) {
              return `Error: No supported image files found in directory '${filePath}'.`
            }

            fileParts = await Promise.all(
              imagePaths.map((imagePath) => createFilePartFromPath(imagePath, tempFilesToCleanup)),
            )
            promptTargetDescription = `${fileParts.length} images from directory`
            sourceNotes.push(`Directory scan included ${fileParts.length} image(s).`)
          } else {
            const primaryPart = await createFilePartFromPath(filePath, tempFilesToCleanup)
            fileParts = [primaryPart]

            if (isOfficeDocumentPath(filePath)) {
              const { embeddedImagePaths, tempDirectory } = await extractEmbeddedMediaFromOfficeFile(filePath)
              if (tempDirectory) {
                tempDirectoriesToCleanup.push(tempDirectory)
              }
              if (embeddedImagePaths.length > 0) {
                const embeddedParts = await Promise.all(
                  embeddedImagePaths.map((imagePath) => createFilePartFromPath(imagePath, tempFilesToCleanup)),
                )
                fileParts.push(...embeddedParts)
                sourceNotes.push(`Embedded images extracted: ${embeddedParts.length}.`)
              }
            }
          }
        } else {
          return "Error: Must provide either 'file_path' or 'image_data'."
        }

        if (fileParts.length === 0) {
          return "Error: No analyzable media content found."
        }

        // Check model capability for PDF/PPTX files
        if (filePath && !isBase64Input) {
          const fileExt = extname(filePath).toLowerCase()
          const { agentModel } = await resolveMultimodalLookerAgentMetadata(ctx)
          const modelID = agentModel 
            ? `${agentModel.providerID}/${agentModel.modelID}` 
            : "unknown"
          
          if (fileExt === ".pdf" && !supportsNativePdf(modelID)) {
            log(`[look_at] PDF not supported by model: ${modelID}`)
            return getUnsupportedFileTypeMessage(".pdf", modelID)
          }
          
          if (fileExt === ".pptx" && !supportsNativePptx(modelID)) {
            log(`[look_at] PPTX not supported by model: ${modelID}`)
            return getUnsupportedFileTypeMessage(".pptx", modelID)
          }
        }

      const prompt = `Analyze this ${promptTargetDescription} and extract the requested information.

Goal: ${args.goal}

Source context:
${sourceNotes.length > 0 ? sourceNotes.join("\n") : "No extra context."}

Provide ONLY the extracted information that matches the goal.
Be thorough on what was requested, concise on everything else.
If the requested information is not found, clearly state what is missing.`

      log(`[look_at] Creating session with parent: ${toolContext.sessionID}`)
      const parentSession = await ctx.client.session.get({
        path: { id: toolContext.sessionID },
      }).catch(() => null)
      const parentDirectory = parentSession?.data?.directory ?? ctx.directory

      const createResult = await ctx.client.session.create({
        body: {
          parentID: toolContext.sessionID,
          title: `look_at: ${args.goal.substring(0, 50)}`,
        },
        query: { directory: parentDirectory },
      })

      if (createResult.error) {
        log(`[look_at] Session create error:`, createResult.error)
        const errorStr = String(createResult.error)
        if (errorStr.toLowerCase().includes("unauthorized")) {
          return `Error: Failed to create session (Unauthorized). This may be due to:
1. OAuth token restrictions (e.g., Claude Code credentials are restricted to Claude Code only)
2. Provider authentication issues
3. Session permission inheritance problems

Try using a different provider or API key authentication.

Original error: ${createResult.error}`
        }
        return `Error: Failed to create session: ${createResult.error}`
      }

      const sessionID = createResult.data.id
      log(`[look_at] Created session: ${sessionID}`)

      const { agentModel, agentVariant } = await resolveMultimodalLookerAgentMetadata(ctx)

      log(`[look_at] Sending prompt with ${fileParts.length} media part(s) to session ${sessionID}`)
      try {
        await promptSyncWithModelSuggestionRetry(ctx.client, {
          path: { id: sessionID },
          body: {
            agent: getRuntimeAgentName(MULTIMODAL_LOOKER_AGENT),
            tools: {
              task: false,
              call_omo_agent: false,
              look_at: false,
              read: false,
            },
            parts: [
              { type: "text", text: prompt },
              ...fileParts,
            ],
            ...(agentModel ? { model: { providerID: agentModel.providerID, modelID: agentModel.modelID } } : {}),
            ...(agentVariant ? { variant: agentVariant } : {}),
          },
        })
      } catch (promptError) {
        log(`[look_at] Prompt error (ignored, will still fetch messages):`, promptError)
      }

      log(`[look_at] Fetching messages from session ${sessionID}...`)

      const messagesResult = await ctx.client.session.messages({
        path: { id: sessionID },
      })

      if (messagesResult.error) {
        log(`[look_at] Messages error:`, messagesResult.error)
        return `Error: Failed to get messages: ${messagesResult.error}`
      }

      const messages = messagesResult.data
      log(`[look_at] Got ${messages.length} messages`)

      const responseText = extractLatestAssistantText(messages)
      if (!responseText) {
        log("[look_at] No assistant message found")
        return "Error: No response from multimodal-looker agent"
      }

        log(`[look_at] Got response, length: ${responseText.length}`)
        return responseText
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        log(`[look_at] Unexpected error analyzing ${sourceDescription}:`, error)
        return `Error: Failed to analyze ${sourceDescription}: ${errorMessage}`
      } finally {
        tempFilesToCleanup.forEach((file) => {
          cleanupConvertedImage(file)
        })
        await Promise.all(
          tempDirectoriesToCleanup.map((directory) => rm(directory, { recursive: true, force: true }).catch(() => undefined)),
        )
      }
    },
  })
}
