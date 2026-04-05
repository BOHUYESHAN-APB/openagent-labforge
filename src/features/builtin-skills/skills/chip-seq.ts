import type { BuiltinSkill } from "../types"

export const chipSeqSkill: BuiltinSkill = {
  name: "chip-seq",
  description: "ChIP-seq peak calling, track export, annotation, and motif-oriented downstream review",
  metadata: {
    category: "research/chip-seq",
    domain: "bioinformatics",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# ChIP-seq

Use this skill for TF or histone-mark ChIP-seq when the output should include peaks, tracks, annotation, or motif follow-up.

## Quick route

- TF / narrow marks → narrow peaks first
- H3K27me3, H3K36me3, and similar broad marks → use \`--broad\`
- paired-end BAMs → prefer \`-f BAMPE\`
- no input control → possible, but record the limitation explicitly

## Starter pattern

\`\`\`bash
macs3 callpeak -t chip.bam -c input.bam -f BAMPE -g hs -n sample -q 0.01 --outdir results/peaks
\`\`\`

## Workflow

1. Validate BAMs and assay structure:
- read depth
- duplicates
- narrow vs broad mark
- control availability
- replicate structure

2. Call peaks with assay-appropriate settings.

3. Export normalized signal tracks:
- MACS3 pileup / bedGraph
- convert to bigWig if needed

4. Annotate peaks:
- promoter / gene body / distal mapping
- genome-browser or track-level review

5. Downstream:
- motif analysis
- differential binding
- locus interpretation

## Quality rules

- narrow and broad marks need different settings
- do not present motif hits without showing peak quality
- single noisy replicate is not a trustworthy biological story
- blacklist/artifactual loci should be considered during review

## Expected artifacts

- \`results/peaks/sample_peaks.narrowPeak\` or \`.broadPeak\`
- \`results/peaks/sample_summits.bed\`
- \`results/tracks/sample_treat_pileup.bw\`
- \`results/annotation/peak_annotation.tsv\`
- \`qc/chip_qc_summary.tsv\``,
}
