import { describe, test, expect } from "bun:test"
import { createOracleAgent } from "./oracle"
import { createLibrarianAgent } from "./librarian"
import { createExploreAgent } from "./explore"
import { createMomusAgent } from "./momus"
import { createMetisAgent } from "./metis"
import { createAtlasAgent } from "./atlas"
import { createArticleWriterAgent } from "./article-writer"
import { createBioOrchestratorAgent } from "./bio-orchestrator"
import { createBioMethodologistAgent } from "./bio-methodologist"
import { createWetLabDesignerAgent } from "./wet-lab-designer"
import { createBioPipelineOperatorAgent } from "./bio-pipeline-operator"
import { createPaperEvidenceSynthesizerAgent } from "./paper-evidence-synthesizer"
import { createScientificWriterAgent } from "./scientific-writer"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("read-only agent tool restrictions", () => {
  const FILE_WRITE_TOOLS = ["write", "edit", "apply_patch"]

  describe("Oracle", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createOracleAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })

    test("denies task but allows call_omo_agent for research", () => {
      // given
      const agent = createOracleAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBeUndefined()
    })
  })

  describe("Librarian", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createLibrarianAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Explore", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createExploreAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Momus", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createMomusAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Metis", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createMetisAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Atlas", () => {
    test("allows delegation tools for orchestration", () => {
      // given
      const agent = createAtlasAgent({ model: TEST_MODEL })

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["task"]).toBeUndefined()
      expect(permission["call_omo_agent"]).toBeUndefined()
    })
  })

  describe("Article Writer", () => {
    test("denies delegation tools for focused writing", () => {
      // given
      const agent = createArticleWriterAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })

  describe("Bio Orchestrator", () => {
    test("keeps task available but blocks compatibility delegation wrapper", () => {
      // given
      const agent = createBioOrchestratorAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["question"]).toBe("allow")
      expect(permission["task"]).toBeUndefined()
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })

  describe("Bio Methodologist", () => {
    test("is now a specialist subagent only", () => {
      // given
      const agent = createBioMethodologistAgent(TEST_MODEL)

      // then
      expect(createBioMethodologistAgent.mode).toBe("subagent")
      expect(agent.mode).toBe("subagent")
    })

    test("denies file-writing and delegation tools", () => {
      // given
      const agent = createBioMethodologistAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["write"]).toBe("deny")
      expect(permission["edit"]).toBe("deny")
      expect(permission["apply_patch"]).toBe("deny")
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })

  describe("Wet Lab Designer", () => {
    test("stays read-only and planning-focused", () => {
      // given
      const agent = createWetLabDesignerAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["write"]).toBe("deny")
      expect(permission["edit"]).toBe("deny")
      expect(permission["apply_patch"]).toBe("deny")
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })

  describe("Bio Pipeline Operator", () => {
    test("is available as both main agent and subagent", () => {
      // given
      const agent = createBioPipelineOperatorAgent(TEST_MODEL)

      // then
      expect(createBioPipelineOperatorAgent.mode).toBe("all")
      expect(agent.mode).toBe("all")
    })

    test("denies delegation tools but allows execution tools", () => {
      // given
      const agent = createBioPipelineOperatorAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
      expect(permission["write"]).toBeUndefined()
      expect(permission["edit"]).toBeUndefined()
    })
  })

  describe("Paper Evidence Synthesizer", () => {
    test("stays read-only and focused", () => {
      // given
      const agent = createPaperEvidenceSynthesizerAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["write"]).toBe("deny")
      expect(permission["edit"]).toBe("deny")
      expect(permission["apply_patch"]).toBe("deny")
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })

  describe("Scientific Writer", () => {
    test("denies delegation tools for focused scientific writing", () => {
      // given
      const agent = createScientificWriterAgent(TEST_MODEL)

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["task"]).toBe("deny")
      expect(permission["call_omo_agent"]).toBe("deny")
    })
  })
})
