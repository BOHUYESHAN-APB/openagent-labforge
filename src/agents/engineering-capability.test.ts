import { describe, expect, test } from "bun:test"

import { createSisyphusAgent } from "./sisyphus"
import { createWaseAgent } from "./wase"
import { createHephaestusAgent } from "./hephaestus"
import { createAtlasAgent } from "./atlas"
import { getPrometheusPrompt } from "./prometheus"
import { createMetisAgent } from "./metis"
import { createMomusAgent } from "./momus"
import { createAcceptanceReviewerAgent } from "./acceptance-reviewer"
import { createBioAutopilotAgent } from "./bio-autopilot"
import { createBioOrchestratorAgent } from "./bio-orchestrator"
import { createBioMethodologistAgent } from "./bio-methodologist"
import { createBioPipelineOperatorAgent } from "./bio-pipeline-operator"
import { createPaperEvidenceSynthesizerAgent } from "./paper-evidence-synthesizer"
import { createWetLabDesignerAgent } from "./wet-lab-designer"

describe("engineering capability layering", () => {
  test("sisyphus includes orchestration and execution capability blocks", () => {
    const agent = createSisyphusAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<agent-identity>")
    expect(agent.prompt).toContain('Your designated identity for this session is "Sisyphus"')
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<engineering_skill_router_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_orchestration_capability>")
    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("every delegated task must name exact files or modules")
    expect(agent.prompt).toContain("Delegation packet:")
    expect(agent.prompt).toContain("Completion evidence:")
    expect(agent.prompt).toContain("default to product-grade output unless the user explicitly asks for a prototype")
    expect(agent.prompt).toContain("for frontend work, default to visual specialists plus UI verification skills")
    expect(agent.prompt).toContain("backend or API work, load architecture-oriented skills")
    expect(agent.prompt).toContain("<autonomous_acceptance_workflow_capability>")
  })

  test("wase keeps autonomous engineering guardrails in compact staged form", () => {
    const agent = createWaseAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<agent-identity>")
    expect(agent.prompt).toContain('Your designated identity for this session is "WASE"')
    expect(agent.prompt).toContain("<wase-role>")
    expect(agent.prompt).toContain("<wase-autonomous-mode>")
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<engineering_skill_router_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<wase-stage-management>")
    expect(agent.prompt).toContain("Autonomy quality bar:")
    expect(agent.prompt).toContain("Default todo size for substantial work is 5-15 concrete items")
    expect(agent.prompt).toContain("if the runtime workflow state says `light + batch`, do not inflate the first wave")
    expect(agent.prompt).toContain("Use session continuity when resuming delegated work")
    expect(agent.prompt).toContain("<autonomous_acceptance_workflow_capability>")
    expect(agent.prompt).toContain("delegate to `acceptance-reviewer`")
    expect(agent.prompt).toContain("use the `question` tool")
    expect(agent.prompt).toContain("Never invent a simulated project scenario")
    expect(agent.prompt).toContain("Create the install todos and execute them")
    expect(agent.prompt).toContain("customized 4W / WNWC closeout pattern")
    expect(agent.prompt).toContain("WNWC Closeout")
    expect(agent.prompt).toContain("Auto action: ask-user")
    expect(agent.prompt).toContain("- Which:")
  })

  test("hephaestus includes execution capability block", () => {
    const agent = createHephaestusAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<agent-identity>")
    expect(agent.prompt).toContain('Your designated identity for this session is "Hephaestus"')
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<engineering_skill_router_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("identify the narrow write surface before editing")
    expect(agent.prompt).toContain("if the task changes config, CLI behavior, schemas, or user-facing flows")
    expect(agent.prompt).toContain("Operate like a production engineer")
    expect(agent.prompt).toContain("if the task says dashboard, page, app, console, workspace, or panel")
    expect(agent.prompt).toContain("if the task is backend or API-heavy")
    expect(agent.prompt).toContain("if the task is frontend or UI-heavy")
    expect(agent.prompt).toContain("<autonomous_acceptance_workflow_capability>")
    expect(agent.prompt).toContain("<hephaestus_execution_contract>")
  })

  test("atlas includes orchestration capability block", () => {
    const agent = createAtlasAgent({ model: "openai/gpt-5.4" })

    expect(agent.prompt).toContain("<agent-identity>")
    expect(agent.prompt).toContain('Your designated identity for this session is "Atlas"')
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<engineering_skill_router_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_orchestration_capability>")
    expect(agent.prompt).toContain("Orchestrator responsibilities:")
    expect(agent.prompt).toContain("keep session continuity explicit")
    expect(agent.prompt).toContain("preserve a product-grade delivery bar across delegated tasks")
    expect(agent.prompt).toContain("<atlas_execution_audit>")
  })

  test("large engineering prompts stay below previous static prompt sizes", () => {
    const sisyphus = createSisyphusAgent("openai/gpt-5.4")
    const hephaestus = createHephaestusAgent("openai/gpt-5.4")
    const atlas = createAtlasAgent({ model: "openai/gpt-5.4" })

    expect(sisyphus.prompt.length).toBeLessThan(39000)
    expect(hephaestus.prompt.length).toBeLessThan(38000)
    expect(atlas.prompt.length).toBeLessThan(31000)
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

    expect(agent.prompt).toContain("<agent-identity>")
    expect(agent.prompt).toContain('Your designated identity for this session is "Bio-Orchestrator"')
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<engineering_skill_router_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("## Bio Skill Tool Reminder")
    expect(agent.prompt).toContain("## Bio Skill Router")
    expect(agent.prompt).toContain("## Bio Runtime Guidance")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("prefer a small first wave over a sprawling initial backlog")
    expect(agent.prompt).toContain("runtime workflow state explicitly marks the session as heavy/continuous")
    expect(agent.prompt).toContain("private sequencing data")
    expect(agent.prompt).toContain("MUST load `bio-methods`")
    expect(agent.prompt).toContain("blast / homolog / homology / ortholog / synteny / reciprocal best hit")
    expect(agent.prompt).toContain("use the `question` tool early instead of guessing")
    expect(agent.prompt).toContain("real-project posture")
  })

  test("bio-autopilot includes autonomous bio workflow and acceptance-review loop", () => {
    const agent = createBioAutopilotAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<bio-autopilot-mode>")
    expect(agent.prompt).toContain("only escalate to a heavier multi-wave backlog after real progress or explicit heavy workflow state")
    expect(agent.prompt).toContain("after a meaningful execution wave")
    expect(agent.prompt).toContain("use acceptance-reviewer for the final approve/reject decision")
    expect(agent.prompt).toContain("task(subagent_type=\"acceptance-reviewer\"")
    expect(agent.prompt).toContain("install the required minimal toolchain in the current wave")
    expect(agent.prompt).toContain("side validation")
    expect(agent.prompt).toContain("request decisive missing data early with the `question` tool")
    expect(agent.prompt).toContain("do not recast the task as a simulated scenario")
    expect(agent.prompt).toContain("WNWC Closeout")
    expect(agent.prompt).toContain("Auto action: ask-user")
  })

  test("acceptance-reviewer includes review and autonomous acceptance workflow capability blocks", () => {
    const agent = createAcceptanceReviewerAgent("openai/gpt-5.4")

    expect(agent.mode).toBe("subagent")
    expect(agent.prompt).toContain("<engineering_review_capability>")
    expect(agent.prompt).toContain("<autonomous_acceptance_workflow_capability>")
    expect(agent.prompt).toContain("[APPROVE] or [REJECT]")
    expect(agent.prompt).toContain("WHAT was actually delivered")
    expect(agent.prompt).toContain("WHICH was stated clearly enough")
  })

  test("bio-methodologist includes planning, data request, and environment safety capability blocks", () => {
    const agent = createBioMethodologistAgent("openai/gpt-5.4")

    expect(agent.mode).toBe("subagent")
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<information_integrity_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_planning_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Tool Reminder")
    expect(agent.prompt).toContain("## Bio Skill Router")
    expect(agent.prompt).toContain("ask for the minimum decisive additional information with the `question` tool")
    expect(agent.prompt).toContain("real-project posture")
  })

  test("bio-pipeline-operator includes execution, data request, and environment safety capability blocks", () => {
    const agent = createBioPipelineOperatorAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_execution_capability>")
    expect(agent.prompt).toContain("<bio_engineering_execution_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Tool Reminder")
    expect(agent.prompt).toContain("## Bio Skill Router")
  })

  test("paper-evidence-synthesizer includes review and data request capability blocks", () => {
    const agent = createPaperEvidenceSynthesizerAgent("openai/gpt-5.4")

    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_review_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("## Bio Skill Tool Reminder")
    expect(agent.prompt).toContain("## Bio Skill Router")
  })

  test("wet-lab-designer includes planning, data request, and environment safety capability blocks", () => {
    const agent = createWetLabDesignerAgent("openai/gpt-5.4")

    expect(agent.mode).toBe("subagent")
    expect(agent.prompt).toContain("<engineering_micro_kernel_capability>")
    expect(agent.prompt).toContain("<prompt_layering_protocol_capability>")
    expect(agent.prompt).toContain("<engineering_planning_capability>")
    expect(agent.prompt).toContain("<bio_data_interaction_capability>")
    expect(agent.prompt).toContain("<bio_environment_safety_capability>")
    expect(agent.prompt).toContain("## Bio Skill Tool Reminder")
    expect(agent.prompt).toContain("## Bio Skill Router")
  })
})
