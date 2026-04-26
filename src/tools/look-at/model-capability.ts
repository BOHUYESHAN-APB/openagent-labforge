/**
 * Model capability detection for multimodal features
 */

/**
 * Check if a model supports native PDF reading
 * @param modelID - Full model ID (e.g., "openai/gpt-4o", "anthropic/claude-3-opus")
 * @returns true if the model natively supports PDF files
 */
export function supportsNativePdf(modelID: string): boolean {
  if (!modelID) return false
  
  const lowerModel = modelID.toLowerCase()
  
  // Models known to support PDF natively
  const pdfSupportedPatterns = [
    "gpt-4o",
    "gpt-4-turbo",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
    "claude-3.5-sonnet",
    "claude-3.5-haiku",
  ]
  
  return pdfSupportedPatterns.some(pattern => lowerModel.includes(pattern))
}

/**
 * Check if a model supports native PPTX reading
 * @param modelID - Full model ID
 * @returns true if the model natively supports PPTX files
 */
export function supportsNativePptx(modelID: string): boolean {
  if (!modelID) return false
  
  const lowerModel = modelID.toLowerCase()
  
  // Most models that support PDF also support PPTX
  // But PPTX support is generally less reliable
  const pptxSupportedPatterns = [
    "gpt-4o",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ]
  
  return pptxSupportedPatterns.some(pattern => lowerModel.includes(pattern))
}

/**
 * Get a user-friendly error message for unsupported file types
 * @param fileType - File extension (e.g., ".pdf", ".pptx")
 * @param currentModel - Current model ID
 * @returns Error message with suggestions
 */
export function getUnsupportedFileTypeMessage(fileType: string, currentModel: string): string {
  const ext = fileType.toLowerCase()
  
  if (ext === ".pdf") {
    return `PDF files are not supported by the current model (${currentModel}).

Supported models for PDF:
- GPT-4o (openai/gpt-4o)
- Gemini 1.5 Pro (google/gemini-1.5-pro)
- Claude 3 Opus/Sonnet (anthropic/claude-3-opus, anthropic/claude-3-sonnet)

Alternatives:
1. Switch to a supported model
2. Convert PDF to images first
3. Extract text from PDF and provide as text input`
  }
  
  if (ext === ".pptx") {
    return `PPTX files are not fully supported by the current model (${currentModel}).

Supported models for PPTX:
- GPT-4o (openai/gpt-4o)
- Gemini 1.5 Pro (google/gemini-1.5-pro)

Note: Current implementation extracts embedded images only.

Alternatives:
1. Switch to a supported model
2. Convert PPTX slides to images
3. Export PPTX as PDF first`
  }
  
  return `File type ${fileType} may not be supported by the current model (${currentModel}).`
}
