#!/usr/bin/env node
/**
 * Test script to verify bio skills are properly loaded after auto-configuration
 */

import { loadPluginConfig } from "../src/plugin-config.js"
import { createSkillContext } from "../src/plugin/skill-context.js"
import { createSkillTool } from "../src/tools/skill/tools.js"

async function testBioSkillsLoading() {
  console.log("=== Testing Bio Skills Auto-Configuration ===\n")

  // 1. Load plugin config
  console.log("1. Loading plugin config...")
  const pluginConfig = loadPluginConfig(process.cwd(), {})
  console.log(`   Skills config:`, pluginConfig.skills)

  // 2. Create skill context
  console.log("\n2. Creating skill context...")
  const skillContext = await createSkillContext({
    directory: process.cwd(),
    pluginConfig,
  })
  console.log(`   Available skills: ${skillContext.availableSkills.length}`)

  // 3. Get merged skills
  console.log("\n3. Loading merged skills...")
  const mergedSkills = await skillContext.getMergedSkills()
  console.log(`   Total merged skills: ${mergedSkills.length}`)

  // Count by scope
  const scopeCounts = {}
  mergedSkills.forEach(skill => {
    scopeCounts[skill.scope] = (scopeCounts[skill.scope] || 0) + 1
  })
  console.log(`   Skills by scope:`, scopeCounts)

  // 4. Check for bio skills
  console.log("\n4. Checking for bio skills...")
  const bioSkills = mergedSkills.filter(skill =>
    skill.name.startsWith("research/bioinformatics/") ||
    skill.metadata?.category?.includes("bioinformatics")
  )
  console.log(`   Bio skills found: ${bioSkills.length}`)

  if (bioSkills.length > 0) {
    console.log(`\n   Sample bio skills:`)
    bioSkills.slice(0, 10).forEach(skill => {
      console.log(`     - ${skill.name}`)
    })
  }

  // 5. Test skill tool
  console.log("\n5. Testing skill tool...")
  const skillTool = createSkillTool({
    getSkills: () => Promise.resolve(mergedSkills),
  })

  const description = skillTool.description
  console.log(`   Skill tool description length: ${description.length} chars`)

  // Check if bio skills are in description
  const hasBioSkills = description.includes("research/bioinformatics/")
  console.log(`   Bio skills in tool description: ${hasBioSkills ? "✓ YES" : "✗ NO"}`)

  // 6. Test skill execution
  console.log("\n6. Testing skill execution...")

  // Try to execute a bio skill
  if (bioSkills.length > 0) {
    const testSkillName = bioSkills[0].name
    console.log(`   Attempting to execute: ${testSkillName}`)

    try {
      const result = await skillTool.execute({ name: testSkillName })
      console.log(`   ✓ Successfully executed skill`)
      console.log(`   Result length: ${result.length} chars`)
    } catch (error) {
      console.log(`   ✗ Failed to execute: ${error.message}`)
    }
  }

  // 7. Test error message for non-existent skill
  console.log("\n7. Testing error message for non-existent skill...")
  try {
    await skillTool.execute({ name: "bioinformatics-analysis" })
    console.log(`   ✗ Should have thrown error`)
  } catch (error) {
    console.log(`   ✓ Correctly threw error`)
    const errorIncludesBioSkills = error.message.includes("research/bioinformatics/")
    console.log(`   Error includes bio skills: ${errorIncludesBioSkills ? "✓ YES" : "✗ NO"}`)

    if (!errorIncludesBioSkills) {
      console.log(`\n   Error message preview:`)
      console.log(`   ${error.message.slice(0, 500)}...`)
    }
  }

  // Summary
  console.log("\n=== Summary ===")
  console.log(`Total skills: ${mergedSkills.length}`)
  console.log(`Bio skills: ${bioSkills.length}`)
  console.log(`Config bundle: ${pluginConfig.skills?.bundle || "not set"}`)

  if (bioSkills.length >= 400) {
    console.log(`\n✓ SUCCESS: Bio skills are properly loaded!`)
  } else if (bioSkills.length > 0) {
    console.log(`\n⚠ PARTIAL: Some bio skills loaded, but expected ~469`)
  } else {
    console.log(`\n✗ FAILED: No bio skills loaded. Check configuration.`)
  }
}

testBioSkillsLoading().catch(console.error)
