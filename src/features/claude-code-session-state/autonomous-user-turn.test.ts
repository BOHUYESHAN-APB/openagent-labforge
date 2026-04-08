import { beforeEach, describe, expect, test } from "bun:test"

import {
  clearAutonomousUserTurnState,
  noteAutonomousAssistantTurn,
  noteAutonomousTodoCommit,
  recordAutonomousUserTurn,
  resetAutonomousUserTurnStateForTesting,
} from "./autonomous-user-turn"

describe("autonomous-user-turn", () => {
  beforeEach(() => {
    resetAutonomousUserTurnStateForTesting()
  })

  test("treats the first autonomous user prompt as initial instead of follow-up guidance", () => {
    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-1",
      promptText: "Build a new dashboard.",
      now: 1_000,
    })

    expect(assessment.mode).toBe("initial")
    expect(assessment.promptChanged).toBe(true)
    expect(assessment.likelyUndoFailed).toBe(false)
  })

  test("classifies a second prompt before assistant work as a precommit revision", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-2",
      promptText: "Build a dashboard.",
      now: 1_000,
    })

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-2",
      promptText: "Build a dashboard, but focus on API latency only.",
      now: 2_000,
    })

    expect(assessment.mode).toBe("precommit-revision")
    expect(assessment.elapsedMs).toBe(1_000)
    expect(assessment.promptChanged).toBe(true)
    expect(assessment.likelyUndoFailed).toBe(false)
  })

  test("marks a late precommit correction as likely undo failure when the session stayed busy", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-3",
      promptText: "Analyze this dataset.",
      now: 1_000,
    })

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-3",
      promptText: "Analyze this dataset, but only the RNA-seq branch.",
      now: 7_500,
    })

    expect(assessment.mode).toBe("precommit-revision")
    expect(assessment.likelyUndoFailed).toBe(true)
  })

  test("classifies new user guidance after assistant activity as postcommit guidance", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-4",
      promptText: "Run the initial bio pipeline.",
      now: 1_000,
    })
    noteAutonomousAssistantTurn("auto-4", 1_500)

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-4",
      promptText: "Actually prioritize differential expression first.",
      now: 2_000,
    })

    expect(assessment.mode).toBe("postcommit-guidance")
  })

  test("classifies new user guidance after todo commit as postcommit guidance", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-5",
      promptText: "Refactor the backend.",
      now: 1_000,
    })
    noteAutonomousTodoCommit("auto-5", 1_300)

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-5",
      promptText: "Refactor only the auth module.",
      now: 2_000,
    })

    expect(assessment.mode).toBe("postcommit-guidance")
  })

  test("ignores immediate duplicate retries before any work was committed", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-6",
      promptText: "Write the build plan.",
      now: 1_000,
    })

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-6",
      promptText: "Write the build plan.",
      now: 2_000,
    })

    expect(assessment.mode).toBe("repeat")
    expect(assessment.promptChanged).toBe(false)
  })

  test("can clear a single session state", () => {
    recordAutonomousUserTurn({
      sessionID: "auto-7",
      promptText: "Draft the roadmap.",
      now: 1_000,
    })
    clearAutonomousUserTurnState("auto-7")

    const assessment = recordAutonomousUserTurn({
      sessionID: "auto-7",
      promptText: "Draft the roadmap again.",
      now: 2_000,
    })

    expect(assessment.mode).toBe("initial")
  })
})
