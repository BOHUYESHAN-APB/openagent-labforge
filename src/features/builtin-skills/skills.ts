import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  playwrightSkill,
  agentBrowserSkill,
  playwrightCliSkill,
  frontendUiUxSkill,
  gitMasterSkill,
  devBrowserSkill,
  docxSkill,
  pdfSkill,
  pptxSkill,
  xlsxSkill,
  webResearchSkill,
  dataAnalysisSkill,
  bioToolsSkill,
  bioMethodsSkill,
  bioVisualizationSkill,
  wetLabDesignSkill,
  bioPipelineSkill,
  paperEvidenceSkill,
  differentialExpressionSkill,
  scrnaPreprocessingSkill,
  cellAnnotationSkill,
  pubmedSearchSkill,
  geoQuerySkill,
  sequenceAnalysisSkill,
  structuralBiologySkill,
  vectorDesignSkill,
} from "./skills/index"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills } = options

  let browserSkill: BuiltinSkill
  if (browserProvider === "agent-browser") {
    browserSkill = agentBrowserSkill
  } else if (browserProvider === "playwright-cli") {
    browserSkill = playwrightCliSkill
  } else {
    browserSkill = playwrightSkill
  }

  const skills = [
    browserSkill,
    frontendUiUxSkill,
    gitMasterSkill,
    devBrowserSkill,
    docxSkill,
    pdfSkill,
    pptxSkill,
    xlsxSkill,
    webResearchSkill,
    dataAnalysisSkill,
    bioToolsSkill,
    bioMethodsSkill,
    bioVisualizationSkill,
    wetLabDesignSkill,
    bioPipelineSkill,
    paperEvidenceSkill,
    differentialExpressionSkill,
    scrnaPreprocessingSkill,
    cellAnnotationSkill,
    pubmedSearchSkill,
    geoQuerySkill,
    sequenceAnalysisSkill,
    structuralBiologySkill,
    vectorDesignSkill,
  ]

  if (!disabledSkills) {
    return skills
  }

  return skills.filter((skill) => !disabledSkills.has(skill.name))
}
