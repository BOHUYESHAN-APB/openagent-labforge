import type { BuiltinSkill } from "../types"

export const readQcSkill: BuiltinSkill = {
  name: "read-qc",
  description: "FASTQ preprocessing, adapter trimming, contamination checks, and FastQC/MultiQC read-quality review for sequencing pipelines",
  license: "MIT",
  metadata: {
    category: "research/bioinformatics-read-qc",
    domain: "bioinformatics",
    imported_from: "GPTomics/bioSkills",
    source_category: "read-qc",
  },
  // agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Read QC

Use this skill when a task starts from FASTQ files and needs quality inspection, trimming, filtering, or preprocessing before alignment or quantification.

## Core workflow

1. Inspect raw inputs:
- layout: single-end vs paired-end
- read length
- lane or sample naming
- compression status
2. Run QC before trimming:
- FastQC on raw reads
- MultiQC when multiple samples exist
3. Preprocess reads:
- adapter trimming
- quality trimming
- length filtering
- poly-G or poly-X cleanup when relevant
4. Re-run QC on cleaned reads and compare raw vs cleaned metrics.
5. Only then hand cleaned FASTQ files to alignment or quantification.

## Preferred tools

- \`fastp\` for all-in-one preprocessing
- \`FastQC\` for per-sample reports
- \`MultiQC\` for cohort summaries

## Starter commands

\`\`\`bash
fastp \
  -i raw_R1.fastq.gz -I raw_R2.fastq.gz \
  -o clean_R1.fastq.gz -O clean_R2.fastq.gz \
  --detect_adapter_for_pe \
  --cut_right --cut_right_window_size 4 --cut_right_mean_quality 20 \
  -q 20 -l 36 \
  -h qc/sample_fastp.html -j qc/sample_fastp.json
\`\`\`

\`\`\`bash
fastqc -t 8 raw_R1.fastq.gz raw_R2.fastq.gz clean_R1.fastq.gz clean_R2.fastq.gz -o qc/fastqc
multiqc qc -o qc/multiqc
\`\`\`

## Quality gates

- Adapter or poly-G contamination should drop after preprocessing.
- Keep an eye on duplication rate, overrepresented sequences, and base quality tails.
- If contamination or severe quality failure remains, stop and surface it before continuing.
- Do not silently trim reads into unusable lengths.

## Expected artifacts

- \`reads/clean/*.fastq.gz\`
- \`qc/fastqc/*\`
- \`qc/multiqc/*\`
- \`qc/sample_fastp.html\`
- \`qc/sample_fastp.json\`
- concise note about any samples that fail acceptance
`,
}
