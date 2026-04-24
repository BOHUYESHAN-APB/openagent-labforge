import { describe, expect, test } from "bun:test"
import {
  parseTagRange,
  formatTag,
  extractTagNumber,
  hasTag,
  extractAllTags,
} from "../tagger"

describe("Tagger", () => {
  describe("parseTagRange", () => {
    test("parses single numbers", () => {
      expect(parseTagRange("1,2,9")).toEqual([1, 2, 9])
    })

    test("parses ranges", () => {
      expect(parseTagRange("3-5")).toEqual([3, 4, 5])
    })

    test("parses mixed ranges and singles", () => {
      expect(parseTagRange("3-5,12")).toEqual([3, 4, 5, 12])
      expect(parseTagRange("1,5-7,10")).toEqual([1, 5, 6, 7, 10])
    })

    test("handles duplicates", () => {
      expect(parseTagRange("1,2,2,3")).toEqual([1, 2, 3])
    })

    test("sorts results", () => {
      expect(parseTagRange("9,1,5")).toEqual([1, 5, 9])
    })

    test("handles whitespace", () => {
      expect(parseTagRange(" 1 , 2 , 3 ")).toEqual([1, 2, 3])
      expect(parseTagRange("3 - 5")).toEqual([3, 4, 5])
    })
  })

  describe("formatTag", () => {
    test("formats tag correctly", () => {
      expect(formatTag(1)).toBe("§1§")
      expect(formatTag(42)).toBe("§42§")
    })
  })

  describe("extractTagNumber", () => {
    test("extracts tag number", () => {
      expect(extractTagNumber("§1§")).toBe(1)
      expect(extractTagNumber("§42§")).toBe(42)
    })

    test("returns null for invalid format", () => {
      expect(extractTagNumber("no tag")).toBeNull()
      expect(extractTagNumber("§§")).toBeNull()
    })
  })

  describe("hasTag", () => {
    test("detects tags", () => {
      expect(hasTag("§1§ some text")).toBe(true)
      expect(hasTag("text §42§ more text")).toBe(true)
    })

    test("returns false when no tag", () => {
      expect(hasTag("no tag here")).toBe(false)
    })
  })

  describe("extractAllTags", () => {
    test("extracts all tags from content", () => {
      expect(extractAllTags("§1§ text §2§ more §3§")).toEqual([1, 2, 3])
    })

    test("returns empty array when no tags", () => {
      expect(extractAllTags("no tags")).toEqual([])
    })
  })
})
