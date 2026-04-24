/**
 * Parse cache TTL string to milliseconds
 * Supports formats: "5m", "10m", "1h", "30s"
 */
export function parseCacheTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)([smh])$/)
  if (!match) {
    // Default to 5 minutes if invalid format
    return 5 * 60 * 1000
  }

  const value = Number.parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case "s":
      return value * 1000
    case "m":
      return value * 60 * 1000
    case "h":
      return value * 60 * 60 * 1000
    default:
      return 5 * 60 * 1000
  }
}

/**
 * Check if cache TTL has expired
 */
export function isCacheTtlExpired(lastResponseTime: number, cacheTtl: string): boolean {
  const ttlMs = parseCacheTtl(cacheTtl)
  const elapsedTime = Date.now() - lastResponseTime
  return elapsedTime > ttlMs
}

/**
 * Get remaining TTL in milliseconds
 */
export function getRemainingTtl(lastResponseTime: number, cacheTtl: string): number {
  const ttlMs = parseCacheTtl(cacheTtl)
  const elapsedTime = Date.now() - lastResponseTime
  return Math.max(0, ttlMs - elapsedTime)
}

/**
 * Format TTL for display (e.g., "2m 30s", "45s")
 */
export function formatTtl(ms: number): string {
  if (ms <= 0) return "0s"

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return `${seconds}s`
}
