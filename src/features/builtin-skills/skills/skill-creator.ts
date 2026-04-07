import type { BuiltinSkill } from "../types"

export const skillCreatorSkill: BuiltinSkill = {
  name: "skill-creator",
  description:
    "Design, write, and iteratively refine reusable skills with tight trigger descriptions, compact instructions, bundled resources, and validation cases",
  metadata: {
    category: "engineering/skill-authoring",
    domain: "skill-authoring",
  },
  allowedTools: ["Read(*)", "Bash(*)"],
  template: `# Skill Creator

Use this skill when:
- creating a new skill
- restructuring an existing skill
- refining when a skill should trigger
- turning repeated prompts or workflows into reusable skill form

## Mission

Turn one-off prompting into a reusable, compact skill with:
- a strong trigger description
- a lean instruction body
- optional supporting resources
- realistic validation cases

## Design rules

1. Keep the always-loaded metadata short and high-signal.
2. Put only core workflow guidance in the main skill body.
3. Move bulky examples, scripts, and reference material into separate resources.
4. Prefer a few precise trigger examples over long generic explanation.
5. Do not create a giant skill when several smaller skills would compose better.

## Required workflow

1. Define the skill's exact job.
2. Define what user requests should trigger it.
3. Decide what must stay in the main skill body vs. what should become:
- scripts
- references
- assets
4. Write the minimal body that still preserves reliability.
5. Create 3-5 realistic trigger examples and 2-3 non-trigger examples.
6. Review whether the skill is:
- too broad
- too verbose
- too fragile
- duplicating another skill

## Trigger-writing checklist

- name the domain clearly
- state when to use the skill
- state what kind of output or workflow it supports
- include concrete task phrases users might actually say
- avoid vague words like "general help" or "miscellaneous"

## Validation checklist

- can a user understand when to use it
- is the trigger description specific enough to activate reliably
- is the body short enough to avoid wasting context
- are examples or references moved out when they do not need to be always loaded
- does it complement existing skills instead of colliding with them

## Output contract

- skill purpose
- trigger description
- body outline
- what belongs in references/scripts/assets
- validation examples
- overlap or collision risks with existing skills`,
}
