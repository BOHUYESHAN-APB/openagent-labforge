import { describe, expect, test } from "bun:test"

import { createSisyphusAgent } from "./sisyphus"
import { createWaseAgent } from "./wase"
import { createHephaestusAgent } from "./hephaestus"
import { createAtlasAgent } from "./atlas"
import { getPrometheusPrompt } from "./prometheus"
import { createMetisAgent } from "./metis"
import { createMomusAgent } from "./momus"
import { createBioOrchestratorAgent } from "./bio-orchestrator"
import { createBioMethodologistAgent } from "./bio-methodologist"
import { createBioPipelineOperatorAgent } from "./bio-pipeline-operator"
import { createPaperEvidenceSynthesizerAgent } from "./paper-evidence-synthesizer"
import { createWetLabDesignerAgent } from "./wet-lab-designer"

describe("engineering capability layering", () => {
  test("sisyphus includes orchestration and execution capability blocks", () => {
    const agent = createSisyphusAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_orchestration_capability>")
    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("Delegation packet:")
    expect(agent.prompt).toContain("Completion evidence:")
    expect(agent.prompt).toContain("default to product-grade output unless the user explicitly asks for a prototype")
    expect(agent.prompt).toContain("for frontend work, default to visual specialists plus UI verification skills")
  })

  test("wase inherits engineering capability blocks through sisyphus", () => {
    const agent = createWaseAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_orchestration_capability>")
    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("<wase-autonomous-mode>")
    expect(agent.prompt).toContain("Autonomy quality bar:")
    expect(agent.prompt).toContain("Default todo size for substantial work is 5-15 concrete items")
    expect(agent.prompt).toContain("do NOT stop to ask \"should I continue\"")
    expect(agent.prompt).toContain("When the remaining backlog drops below 3 actionable items")
    expect(agent.prompt).toContain("Never replace real follow-through with prose like \"next I would...\"")
  })

  test("hephaestus includes execution capability block", () => {
    const agent = createHephaestusAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("do not grow central or high-churn modules casually")
    expect(agent.prompt).toContain("update the relevant docs in the same change")
    expect(agent.prompt).toContain("Frontend delivery standards:")
    expect(agent.prompt).toContain("Backend and architecture standards:")
    expect(agent.prompt).toContain("<hephaestus_execution_contract>")
  })

  test("atlas includes orchestration capability block", () => {
    const agent = createAtlasAgent({ model: "openai/gpt-5.4" })

    expect(agent.prompt).toContain("<engineering_orchestration_capability>")
    expect(agent.prompt).toContain("Orchestrator responsibilities:")
    expect(agent.prompt).toContain("<atlas_execution_audit>")
  })

  test("prometheus includes planning capability block", () => {
    const prompt = getPrometheusPrompt("openai/gpt-5.4")

    expect(prompt).toContain("<engineering_planning_capability>")
    expect(prompt).toContain("Plan quality bar:")
    expect(prompt).toContain("if the change touches a central module")
    expect(prompt).toContain("for backend tasks, plan contracts, schema changes, migrations, and operational verification")
    expect(prompt).toContain("## Planning Guardrails")
  })

  test("metis includes planning capability block", () => {
    const agent = createMetisAgent("anthropic/claude-opus-4-6")

    expect(agent.prompt).toContain("<engineering_planning_capability>")
    expect(agent.prompt).toContain("Flag module-boundary churn, doc drift, and output-contract drift")
  })

  test("momus includes review capability block", () => {
    const agent = createMomusAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_review_capability>")
    expect(agent.prompt).toContain("Review checklist:")
    expect(agent.prompt).toContain("was user-visible behavior changed without updating docs")
    expect(agent.prompt).toContain("does the frontend still read like a temporary dev panel")
    expect(agent.prompt).toContain("### 5. Engineering Drift Checks")
  })

  test("bio-orchestrator includes bio data and environment capability blocks", () => {
    const agent = createBioOrchestratorAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("main bio entrypoints: `bio-orchestrator`, `bio-pipeline-operator`")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("<bio_engineering_execution_capability>")
    expect(agent.prompt).toContain("private sequencing data")
  })

  test("bio-methodologist includes planning, data request, and environment safety capability blocks", () => {
    const agent = createBioMethodologistAgent("openai/gpt-5.4")

    expect(agent.mode).toBe("subagent")
    expect(agent.prompt).toContain("<engineering_planning_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Loading Protocol")
  })

  test("bio-pipeline-operator includes execution, data request, and environment safety capability blocks", () => {
    const agent = createBioPipelineOperatorAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("<bio_engineering_execution_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Loading Protocol")
  })

  test("paper-evidence-synthesizer includes review and data request capability blocks", () => {
    const agent = createPaperEvidenceSynthesizerAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_review_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("## Bio Skill Loading Protocol")
  })

  test("wet-lab-designer includes planning, data request, and environment safety capability blocks", () => {
    const agent = createWetLabDesignerAgent("openai/gpt-5.4")

    expect(agent.mode).toBe("subagent")
    expect(agent.prompt).toContain("<engineering_planning_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Loading Protocol")
  })
})
