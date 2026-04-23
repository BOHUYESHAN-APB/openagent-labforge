import type { BuiltinSkill } from "../types"

export const variantCallingSkill: BuiltinSkill = {
  name: "variant-calling",
  description: "Germline, somatic, structural-variant, and cohort variant-calling workflows with correct caller selection, filtering, and annotation handoff",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-variant-calling",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "variant-calling",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Variant Calling

Use this skill when the task is to call, filter, normalize, or summarize variants from aligned sequencing data.

## Caller selection

- Germline short-read SNP/indel: \`GATK HaplotypeCaller\`, \`DeepVariant\`, or \`bcftools\`
- Somatic tumor-normal: \`Mutect2\`
- Structural variants: \`Manta\`, \`Delly\`, or caller appropriate to data type
- Cohort germline: per-sample GVCF followed by joint genotyping
- Long-read variant workflows need long-read-aware callers and different QC

Do not use one caller template for every analysis. Pick the caller by assay, organism, cohort size, and variant class.

## Mandatory workflow

1. Verify reference build, BAM readiness, duplicate handling, and sample roles.
2. Choose calling mode:
- single-sample
- cohort GVCF
- tumor-normal
- structural variant
3. Run caller.
4. Apply filtering strategy:
- VQSR when appropriate
- otherwise explicit hard filters
5. Normalize, index, and summarize the final VCF.
6. Hand off to annotation or clinical interpretation if needed.

## Starter commands

\`\`\`bash
gatk HaplotypeCaller \
  -R reference.fa \
  -I sample.bam \
  -O calls/sample.g.vcf.gz \
  -ERC GVCF
\`\`\`

\`\`\`bash
gatk GenotypeGVCFs \
  -R reference.fa \
  -V cohort.g.vcf.gz \
  -O calls/cohort.vcf.gz
\`\`\`

\`\`\`bash
bcftools stats calls/cohort.vcf.gz > qc/cohort.vcf.stats.txt
\`\`\`

## Guardrails

- Match filtering strategy to organism and cohort size.
- Exome panels and non-human studies often need hard filters, not human VQSR defaults.
- Never mix somatic and germline assumptions.
- Keep annotation as a downstream step; do not blur it with raw calling QC.

## Expected artifacts

- \`calls/*.vcf.gz\`
- \`calls/*.tbi\`
- \`qc/*.stats.txt\`
- filtering decision record
- annotation handoff note when applicable
`,
}
