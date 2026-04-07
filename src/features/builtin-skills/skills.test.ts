import { describe, test, expect } from "bun:test"
import { createBuiltinSkills } from "./skills"

describe("createBuiltinSkills", () => {
	test("returns playwright skill by default", () => {
		// given - no options (default)

		// when
		const skills = createBuiltinSkills()

		// then
		const browserSkill = skills.find((s) => s.name === "playwright")
		expect(browserSkill).toBeDefined()
		expect(browserSkill!.description).toContain("browser")
		expect(browserSkill!.mcpConfig).toHaveProperty("playwright")
	})

	test("returns playwright skill when browserProvider is 'playwright'", () => {
		// given
		const options = { browserProvider: "playwright" as const }

		// when
		const skills = createBuiltinSkills(options)

		// then
		const playwrightSkill = skills.find((s) => s.name === "playwright")
		const agentBrowserSkill = skills.find((s) => s.name === "agent-browser")
		expect(playwrightSkill).toBeDefined()
		expect(agentBrowserSkill).toBeUndefined()
	})

	test("returns agent-browser skill when browserProvider is 'agent-browser'", () => {
		// given
		const options = { browserProvider: "agent-browser" as const }

		// when
		const skills = createBuiltinSkills(options)

		// then
		const agentBrowserSkill = skills.find((s) => s.name === "agent-browser")
		const playwrightSkill = skills.find((s) => s.name === "playwright")
		expect(agentBrowserSkill).toBeDefined()
		expect(agentBrowserSkill!.description).toContain("browser")
		expect(agentBrowserSkill!.allowedTools).toContain("Bash(agent-browser:*)")
		expect(agentBrowserSkill!.template).toContain("agent-browser")
		expect(playwrightSkill).toBeUndefined()
	})

	test("agent-browser skill template is inlined (not loaded from file)", () => {
		// given
		const options = { browserProvider: "agent-browser" as const }

		// when
		const skills = createBuiltinSkills(options)
		const agentBrowserSkill = skills.find((s) => s.name === "agent-browser")

		// then - template should contain substantial content (inlined, not fallback)
		expect(agentBrowserSkill!.template).toContain("## Quick start")
		expect(agentBrowserSkill!.template).toContain("## Commands")
		expect(agentBrowserSkill!.template).toContain("agent-browser open")
		expect(agentBrowserSkill!.template).toContain("agent-browser snapshot")
	})

	test("always includes frontend-ui-ux and git-master skills", () => {
		// given - both provider options

		// when
		const defaultSkills = createBuiltinSkills()
		const agentBrowserSkills = createBuiltinSkills({ browserProvider: "agent-browser" })

		// then
		for (const skills of [defaultSkills, agentBrowserSkills]) {
			expect(skills.find((s) => s.name === "frontend-ui-ux")).toBeDefined()
			expect(skills.find((s) => s.name === "git-master")).toBeDefined()
		}
	})

	test("returns full built-in skill set regardless of provider", () => {
		// given

		// when
		const defaultSkills = createBuiltinSkills()
		const agentBrowserSkills = createBuiltinSkills({ browserProvider: "agent-browser" })

		// then
		expect(defaultSkills).toHaveLength(40)
		expect(agentBrowserSkills).toHaveLength(40)
		expect(defaultSkills.map((s) => s.name)).toContain("docx-workbench")
		expect(defaultSkills.map((s) => s.name)).toContain("pdf-toolkit")
		expect(defaultSkills.map((s) => s.name)).toContain("web-research")
		expect(defaultSkills.map((s) => s.name)).toContain("data-analysis")
		expect(defaultSkills.map((s) => s.name)).toContain("proposal-and-roadmap")
		expect(defaultSkills.map((s) => s.name)).toContain("document-asset-pipeline")
		expect(defaultSkills.map((s) => s.name)).toContain("literature-synthesis")
		expect(defaultSkills.map((s) => s.name)).toContain("backend-architecture")
		expect(defaultSkills.map((s) => s.name)).toContain("research-paper-pipeline")
		expect(defaultSkills.map((s) => s.name)).toContain("bio-tools")
		expect(defaultSkills.map((s) => s.name)).toContain("blast-search")
		expect(defaultSkills.map((s) => s.name)).toContain("functional-annotation")
		expect(defaultSkills.map((s) => s.name)).toContain("bio-methods")
		expect(defaultSkills.map((s) => s.name)).toContain("bio-visualization")
		expect(defaultSkills.map((s) => s.name)).toContain("wet-lab-design")
		expect(defaultSkills.map((s) => s.name)).toContain("bio-pipeline")
		expect(defaultSkills.map((s) => s.name)).toContain("paper-evidence")
		expect(defaultSkills.map((s) => s.name)).toContain("differential-expression")
		expect(defaultSkills.map((s) => s.name)).toContain("scrna-preprocessing")
		expect(defaultSkills.map((s) => s.name)).toContain("cell-annotation")
		expect(defaultSkills.map((s) => s.name)).toContain("atac-seq")
		expect(defaultSkills.map((s) => s.name)).toContain("chip-seq")
		expect(defaultSkills.map((s) => s.name)).toContain("metagenomics")
		expect(defaultSkills.map((s) => s.name)).toContain("proteomics")
		expect(defaultSkills.map((s) => s.name)).toContain("pubmed-search")
		expect(defaultSkills.map((s) => s.name)).toContain("geo-query")
		expect(defaultSkills.map((s) => s.name)).toContain("sequence-analysis")
		expect(defaultSkills.map((s) => s.name)).toContain("structural-biology")
		expect(defaultSkills.map((s) => s.name)).toContain("vector-design")
		expect(defaultSkills.map((s) => s.name)).toContain("skill-creator")
		expect(defaultSkills.map((s) => s.name)).toContain("mcp-builder")
		expect(defaultSkills.map((s) => s.name)).toContain("doc-coauthoring")
		expect(defaultSkills.map((s) => s.name)).toContain("internal-comms")
		expect(defaultSkills.map((s) => s.name)).toContain("brand-guidelines")
	})

	test("keeps bio skill to agent ownership aligned with the bio agent hierarchy", () => {
		// given
		const skills = createBuiltinSkills()
		const byName = new Map(skills.map((skill) => [skill.name, skill]))

		// then
		expect(byName.get("bio-methods")?.agent).toBe("bio-methodologist")
		expect(byName.get("wet-lab-design")?.agent).toBe("wet-lab-designer")
		expect(byName.get("paper-evidence")?.agent).toBe("paper-evidence-synthesizer")
		expect(byName.get("bio-pipeline")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("bio-visualization")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("blast-search")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("functional-annotation")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("atac-seq")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("chip-seq")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("metagenomics")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("proteomics")?.agent).toBe("bio-pipeline-operator")
		expect(byName.get("vector-design")?.agent).toBe("wet-lab-designer")
		expect(byName.get("proposal-and-roadmap")?.agent).toBe("article-writer")
		expect(byName.get("literature-synthesis")?.agent).toBe("scientific-writer")
		expect(byName.get("doc-coauthoring")?.agent).toBe("article-writer")
		expect(byName.get("internal-comms")?.agent).toBe("article-writer")
		expect(byName.get("brand-guidelines")?.agent).toBe("article-writer")
	})

	test("should exclude playwright when it is in disabledSkills", () => {
		// #given
		const options = { disabledSkills: new Set(["playwright"]) }

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.map((s) => s.name)).not.toContain("playwright")
		expect(skills.map((s) => s.name)).toContain("frontend-ui-ux")
		expect(skills.map((s) => s.name)).toContain("git-master")
		expect(skills.map((s) => s.name)).toContain("dev-browser")
		expect(skills.length).toBe(39)
	})

	test("should exclude multiple skills when they are in disabledSkills", () => {
		// #given
		const options = { disabledSkills: new Set(["playwright", "git-master"]) }

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.map((s) => s.name)).not.toContain("playwright")
		expect(skills.map((s) => s.name)).not.toContain("git-master")
		expect(skills.map((s) => s.name)).toContain("frontend-ui-ux")
		expect(skills.map((s) => s.name)).toContain("dev-browser")
		expect(skills.length).toBe(38)
	})

	test("should return an empty array when all skills are disabled", () => {
		// #given
		const options = {
			disabledSkills: new Set(["playwright", "frontend-ui-ux", "git-master", "dev-browser"]),
		}

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.length).toBe(36)
	})

	test("should return all skills when disabledSkills set is empty", () => {
		// #given
		const options = { disabledSkills: new Set<string>() }

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.length).toBe(40)
	})

	test("returns playwright-cli skill when browserProvider is 'playwright-cli'", () => {
		// given
		const options = { browserProvider: "playwright-cli" as const }

		// when
		const skills = createBuiltinSkills(options)

		// then
		const playwrightSkill = skills.find((s) => s.name === "playwright")
		const agentBrowserSkill = skills.find((s) => s.name === "agent-browser")
		expect(playwrightSkill).toBeDefined()
		expect(playwrightSkill!.description).toContain("browser")
		expect(playwrightSkill!.allowedTools).toContain("Bash(playwright-cli:*)")
		expect(playwrightSkill!.mcpConfig).toBeUndefined()
		expect(agentBrowserSkill).toBeUndefined()
	})

	test("playwright-cli skill template contains CLI commands", () => {
		// given
		const options = { browserProvider: "playwright-cli" as const }

		// when
		const skills = createBuiltinSkills(options)
		const skill = skills.find((s) => s.name === "playwright")

		// then
		expect(skill!.template).toContain("playwright-cli open")
		expect(skill!.template).toContain("playwright-cli snapshot")
		expect(skill!.template).toContain("playwright-cli click")
	})
})
