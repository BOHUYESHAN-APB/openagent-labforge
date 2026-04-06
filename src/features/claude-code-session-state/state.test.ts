import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import {
  setSessionAgent,
  getSessionAgent,
  clearSessionAgent,
  updateSessionAgent,
  isAutonomousSessionAgent,
  isUltraworkAutonomousSession,
  setMainSession,
  getMainSessionID,
  _resetForTesting,
} from "./state"
import { getAgentDisplayName, setAgentDisplayLanguage } from "../../shared/agent-display-names"

describe("claude-code-session-state", () => {
  beforeEach(() => {
    // given - clean state before each test
    _resetForTesting()
    setAgentDisplayLanguage("en")
  })

  afterEach(() => {
    // then - cleanup after each test to prevent pollution
    _resetForTesting()
  })

  describe("setSessionAgent", () => {
    test("should store config key for display-name agent input", () => {
      // given
      const sessionID = "test-session-1"
      const agent = "探索者"

      // when
      setSessionAgent(sessionID, agent)

      // then
      expect(getSessionAgent(sessionID)).toBe("explore")
    })

    test("should NOT overwrite existing agent (first-write wins)", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, "探索者")

      // when - try to overwrite
      setSessionAgent(sessionID, "sisyphus")

      // then - first agent preserved
      expect(getSessionAgent(sessionID)).toBe("explore")
    })

    test("should return undefined for unknown session", () => {
      // given - no session set

      // when / then
      expect(getSessionAgent("unknown-session")).toBeUndefined()
    })
  })

  describe("updateSessionAgent", () => {
    test("should overwrite existing agent and normalize to config key", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, "Prometheus (Planner)")

      // when - force update
      updateSessionAgent(sessionID, "总调度器 (超脑)")

      // then
      expect(getSessionAgent(sessionID)).toBe("sisyphus")
    })
  })

  describe("autonomous session agents", () => {
    test("recognizes built-in autonomous agent keys", () => {
      expect(isAutonomousSessionAgent("wase")).toBe(true)
      expect(isAutonomousSessionAgent("bio-autopilot")).toBe(true)
      expect(isAutonomousSessionAgent("sisyphus")).toBe(false)
    })

    test("marks ultrawork autonomy when autonomous agent is stored", () => {
      const sessionID = "autonomous-session"

      setSessionAgent(sessionID, "bio-autopilot")

      expect(getSessionAgent(sessionID)).toBe("bio-autopilot")
      expect(isUltraworkAutonomousSession(sessionID)).toBe(true)
    })

    test("clears ultrawork autonomy when agent is updated to non-autonomous", () => {
      const sessionID = "switched-session"

      setSessionAgent(sessionID, "wase")
      expect(isUltraworkAutonomousSession(sessionID)).toBe(true)

      updateSessionAgent(sessionID, "sisyphus")

      expect(getSessionAgent(sessionID)).toBe("sisyphus")
      expect(isUltraworkAutonomousSession(sessionID)).toBe(false)
    })
  })

  describe("clearSessionAgent", () => {
    test("should remove agent from session", () => {
      // given
      const sessionID = "test-session-1"
      setSessionAgent(sessionID, getAgentDisplayName("prometheus"))
      expect(getSessionAgent(sessionID)).toBe("prometheus")

      // when
      clearSessionAgent(sessionID)

      // then
      expect(getSessionAgent(sessionID)).toBeUndefined()
    })

    test("should also clear autonomous session state", () => {
      const sessionID = "autonomous-clear"
      setSessionAgent(sessionID, "wase")
      expect(isUltraworkAutonomousSession(sessionID)).toBe(true)

      clearSessionAgent(sessionID)

      expect(getSessionAgent(sessionID)).toBeUndefined()
      expect(isUltraworkAutonomousSession(sessionID)).toBe(false)
    })
  })

  describe("mainSessionID", () => {
    test("should store and retrieve main session ID", () => {
      // given
      const mainID = "main-session-123"

      // when
      setMainSession(mainID)

      // then
      expect(getMainSessionID()).toBe(mainID)
    })

    test("should return undefined when not set", () => {
      // given - explicit reset to ensure clean state (parallel test isolation)
      _resetForTesting()
      // then
      expect(getMainSessionID()).toBeUndefined()
    })
  })

  describe("prometheus-md-only integration scenario", () => {
    test("should correctly identify Prometheus agent for permission checks", () => {
      // given - Prometheus session
      const sessionID = "test-prometheus-session"
      const prometheusAgent = getAgentDisplayName("prometheus")

      // when - agent is set (simulating chat.message hook)
      setSessionAgent(sessionID, prometheusAgent)

      // then - getSessionAgent returns correct agent for prometheus-md-only hook
      const agent = getSessionAgent(sessionID)
      expect(agent).toBe("prometheus")
      expect(["prometheus"].includes(agent!)).toBe(true)
    })

    test("should return undefined when agent not set (bug scenario)", () => {
      // given - session exists but no agent set (the bug)
      const sessionID = "test-prometheus-session"

      // when / then - this is the bug: agent is undefined
      expect(getSessionAgent(sessionID)).toBeUndefined()
    })
  })

  describe("issue #893: custom agent switch reset", () => {
    test("should preserve custom agent when default agent is sent on subsequent messages", () => {
      // given - user switches to custom agent "MyCustomAgent"
      const sessionID = "test-session-custom"
      const customAgent = "MyCustomAgent"
      const defaultAgent = "sisyphus"

      // User switches to custom agent (via UI)
      setSessionAgent(sessionID, customAgent)
      expect(getSessionAgent(sessionID)).toBe("mycustomagent")

      // when - first message after switch sends default agent
      // This simulates the bug: input.agent = "Sisyphus" on first message
      // Using setSessionAgent (first-write wins) should preserve custom agent
      setSessionAgent(sessionID, defaultAgent)

      // then - custom agent should be preserved, NOT overwritten
      expect(getSessionAgent(sessionID)).toBe("mycustomagent")
    })

    test("should allow explicit agent update via updateSessionAgent", () => {
      // given - custom agent is set
      const sessionID = "test-session-explicit"
      const customAgent = "MyCustomAgent"
      const newAgent = "AnotherAgent"

      setSessionAgent(sessionID, customAgent)

      // when - explicit update (user intentionally switches)
      updateSessionAgent(sessionID, newAgent)

      // then - should be updated
      expect(getSessionAgent(sessionID)).toBe("anotheragent")
    })
  })
})
