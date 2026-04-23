#!/usr/bin/env node
/**
 * Test script to verify that all builtin skills are properly registered
 * and accessible through the skill tool
 */

import { createBuiltinSkills } from "../src/features/builtin-skills/skills"
import { createSkillTool } from "../src/tools/skill/tools"

async function testSkillRegistration() {
  console.log("=== Testing Skill Registration ===\n")

  // 1. Check builtin skills
  const builtinSkills = createBuiltinSkills()
  console.log(`✓ Total builtin skills: ${builtinSkills.length}`)

  const bioSkills = builtinSkills.filter(s =>
    s.name.startsWith("bio-") ||
    s.metadata?.domain === "bioinformatics" ||
    s.metadata?.category?.includes("bioinformatics")
  )
  console.log(`✓ Bioinformatics skills: ${bioSkills.length}`)

  console.log("\n=== Bioinformatics Skills ===")
  bioSkills.forEach(skill => {
    console.log(`  - ${skill.name}: ${skill.description.slice(0, 60)}...`)
  })

  // 2. Check skill tool
  console.log("\n=== Testing Skill Tool ===")
  const skillTool = createSkillTool({ skills: builtinSkills })

  // Get the description which should list all available skills
  const description = skillTool.description
  console.log(`\nSkill tool description length: ${description.length} chars`)

  // Check if bio skills are in the description
  const missingSkills: string[] = []
  bioSkills.forEach(skill => {
    if (!description.includes(skill.name)) {
      missingSkills.push(skill.name)
    }
  })

  if (missingSkills.length > 0) {
    console.log(`\n❌ Missing skills in tool description:`)
    missingSkills.forEach(name => console.log(`  - ${name}`))
  } else {
    console.log(`\n✓ All ${bioSkills.length} bioinformatics skills found in tool description`)
  }

  // 3. Test skill execution
  console.log("\n=== Testing Skill Execution ===")
  try {
    const result = await skillTool.execute({ name: "bio-tools" })
    console.log(`✓ Successfully executed 'bio-tools' skill`)
    console.log(`  Result length: ${result.length} chars`)
  } catch (error) {
    console.log(`❌ Failed to execute 'bio-tools' skill:`, error)
  }

  // 4. Test non-existent skill
  console.log("\n=== Testing Error Handling ===")
  try {
    await skillTool.execute({ name: "bioinformatics-analysis" })
    console.log(`❌ Should have thrown error for non-existent skill`)
  } catch (error: any) {
    console.log(`✓ Correctly threw error for non-existent skill`)
    console.log(`  Error message: ${error.message.slice(0, 200)}...`)

    // Check if error message includes our bio skills
    const errorIncludesBioSkills = bioSkills.some(s => error.message.includes(s.name))
    if (errorIncludesBioSkills) {
      console.log(`✓ Error message includes bioinformatics skills`)
    } else {
      console.log(`❌ Error message does NOT include bioinformatics skills`)
    }
  }
}

testSkillRegistration().catch(console.error)
