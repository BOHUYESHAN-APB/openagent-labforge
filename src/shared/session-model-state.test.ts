import { describe, expect, test } from "bun:test"
import {
  clearSessionForcedModel,
  clearSessionModel,
  clearSessionModelLock,
  getSessionForcedModel,
  getSessionModel,
  getSessionModelLock,
  setSessionForcedModel,
  setSessionModel,
  setSessionModelLock,
} from "./session-model-state"

describe("session-model-state", () => {
  test("stores and retrieves a session model", () => {
    //#given
    const sessionID = "ses_test"

    //#when
    setSessionModel(sessionID, { providerID: "github-copilot", modelID: "gpt-4.1" })

    //#then
    expect(getSessionModel(sessionID)).toEqual({
      providerID: "github-copilot",
      modelID: "gpt-4.1",
    })
  })

  test("clears a session model", () => {
    //#given
    const sessionID = "ses_clear"
    setSessionModel(sessionID, { providerID: "anthropic", modelID: "gpt-5.3-codex" })

    //#when
    clearSessionModel(sessionID)

    //#then
    expect(getSessionModel(sessionID)).toBeUndefined()
  })

  test("stores and clears session model lock", () => {
    //#given
    const sessionID = "ses_lock"

    //#when
    setSessionModelLock(sessionID, { providerID: "gmn", modelID: "gpt-5.3-codex" })

    //#then
    expect(getSessionModelLock(sessionID)).toEqual({
      providerID: "gmn",
      modelID: "gpt-5.3-codex",
    })

    //#when
    clearSessionModelLock(sessionID)

    //#then
    expect(getSessionModelLock(sessionID)).toBeUndefined()
  })

  test("clearSessionModel clears both model and lock", () => {
    //#given
    const sessionID = "ses_clear_both"
    setSessionModel(sessionID, { providerID: "openai", modelID: "gpt-5.4" })
    setSessionModelLock(sessionID, { providerID: "openai", modelID: "gpt-5.4" })

    //#when
    clearSessionModel(sessionID)

    //#then
    expect(getSessionModel(sessionID)).toBeUndefined()
    expect(getSessionModelLock(sessionID)).toBeUndefined()
  })

  test("stores and clears forced model marker", () => {
    //#given
    const sessionID = "ses_forced"

    //#when
    setSessionForcedModel(sessionID, { providerID: "openai", modelID: "gpt-5.4" })

    //#then
    expect(getSessionForcedModel(sessionID)).toEqual({
      providerID: "openai",
      modelID: "gpt-5.4",
    })

    //#when
    clearSessionForcedModel(sessionID)

    //#then
    expect(getSessionForcedModel(sessionID)).toBeUndefined()
  })
})
