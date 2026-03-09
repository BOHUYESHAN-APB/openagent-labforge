export function normalizeModel(model?: string): string | undefined {
	const trimmed = model?.trim()
	if (!trimmed) return undefined
	if (isAutoModelSelection(trimmed)) return undefined
	return trimmed
}

export function isAutoModelSelection(model?: string): boolean {
	const normalized = model?.trim().toLowerCase()
	if (!normalized) return false
	return normalized === "auto" || normalized.startsWith("auto/")
}

export function normalizeModelID(modelID: string): string {
	return modelID.replace(/\.(\d+)/g, "-$1")
}
