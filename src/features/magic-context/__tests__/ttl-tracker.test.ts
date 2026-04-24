import { describe, expect, test } from "bun:test"
import { parseCacheTtl, isCacheTtlExpired, getRemainingTtl, formatTtl } from "../ttl-tracker"

describe("TTL Tracker", () => {
  describe("parseCacheTtl", () => {
    test("parses seconds correctly", () => {
      expect(parseCacheTtl("30s")).toBe(30 * 1000)
      expect(parseCacheTtl("45s")).toBe(45 * 1000)
    })

    test("parses minutes correctly", () => {
      expect(parseCacheTtl("5m")).toBe(5 * 60 * 1000)
      expect(parseCacheTtl("10m")).toBe(10 * 60 * 1000)
    })

    test("parses hours correctly", () => {
      expect(parseCacheTtl("1h")).toBe(1 * 60 * 60 * 1000)
      expect(parseCacheTtl("2h")).toBe(2 * 60 * 60 * 1000)
    })

    test("defaults to 5 minutes for invalid format", () => {
      expect(parseCacheTtl("invalid")).toBe(5 * 60 * 1000)
      expect(parseCacheTtl("")).toBe(5 * 60 * 1000)
      expect(parseCacheTtl("5x")).toBe(5 * 60 * 1000)
    })
  })

  describe("isCacheTtlExpired", () => {
    test("returns false when TTL not expired", () => {
      const now = Date.now()
      const lastResponseTime = now - 2 * 60 * 1000 // 2 minutes ago
      expect(isCacheTtlExpired(lastResponseTime, "5m")).toBe(false)
    })

    test("returns true when TTL expired", () => {
      const now = Date.now()
      const lastResponseTime = now - 6 * 60 * 1000 // 6 minutes ago
      expect(isCacheTtlExpired(lastResponseTime, "5m")).toBe(true)
    })

    test("returns true when exactly at TTL boundary", () => {
      const now = Date.now()
      const lastResponseTime = now - 5 * 60 * 1000 // exactly 5 minutes ago
      expect(isCacheTtlExpired(lastResponseTime, "5m")).toBe(false)
    })
  })

  describe("getRemainingTtl", () => {
    test("returns remaining time correctly", () => {
      const now = Date.now()
      const lastResponseTime = now - 2 * 60 * 1000 // 2 minutes ago
      const remaining = getRemainingTtl(lastResponseTime, "5m")
      expect(remaining).toBeGreaterThan(2.9 * 60 * 1000)
      expect(remaining).toBeLessThanOrEqual(3 * 60 * 1000)
    })

    test("returns 0 when TTL expired", () => {
      const now = Date.now()
      const lastResponseTime = now - 6 * 60 * 1000 // 6 minutes ago
      expect(getRemainingTtl(lastResponseTime, "5m")).toBe(0)
    })
  })

  describe("formatTtl", () => {
    test("formats seconds", () => {
      expect(formatTtl(30 * 1000)).toBe("30s")
      expect(formatTtl(45 * 1000)).toBe("45s")
    })

    test("formats minutes", () => {
      expect(formatTtl(5 * 60 * 1000)).toBe("5m")
      expect(formatTtl(2 * 60 * 1000 + 30 * 1000)).toBe("2m 30s")
    })

    test("formats hours", () => {
      expect(formatTtl(1 * 60 * 60 * 1000)).toBe("1h")
      expect(formatTtl(1 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe("1h 30m")
    })

    test("returns 0s for zero or negative", () => {
      expect(formatTtl(0)).toBe("0s")
      expect(formatTtl(-1000)).toBe("0s")
    })
  })
})
