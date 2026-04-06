import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  playwrightSkill,
  agentBrowserSkill,
  playwrightCliSkill,
  frontendUiUxSkill,
  backendArchitectureSkill,
  gitMasterSkill,
  devBrowserSkill,
  docxSkill,
  pdfSkill,
  pptxSkill,
  xlsxSkill,
  proposalAndRoadmapSkill,
  documentAssetPipelineSkill,
  literatureSynthesisSkill,
  webResearchSkill,
  dataAnalysisSkill,
  researchPaperPipelineSkill,
  bioToolsSkill,
  blastSearchSkill,
  functionalAnnotationSkill,
  bioMethodsSkill,
  bioVisualizationSkill,
  wetLabDesignSkill,
  bioPipelineSkill,
  paperEvidenceSkill,
  differentialExpressionSkill,
  scrnaPreprocessingSkill,
  cellAnnotationSkill,
  atacSeqSkill,
  chipSeqSkill,
  metagenomicsSkill,
  proteomicsSkill,
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
    backendArchitectureSkill,
    gitMasterSkill,
    devBrowserSkill,
    docxSkill,
    pdfSkill,
    pptxSkill,
    xlsxSkill,
    proposalAndRoadmapSkill,
    documentAssetPipelineSkill,
    literatureSynthesisSkill,
    webResearchSkill,
    dataAnalysisSkill,
    researchPaperPipelineSkill,
    bioToolsSkill,
    blastSearchSkill,
    functionalAnnotationSkill,
    bioMethodsSkill,
    bioVisualizationSkill,
    wetLabDesignSkill,
    bioPipelineSkill,
    paperEvidenceSkill,
    differentialExpressionSkill,
    scrnaPreprocessingSkill,
    cellAnnotationSkill,
    atacSeqSkill,
    chipSeqSkill,
    metagenomicsSkill,
    proteomicsSkill,
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
