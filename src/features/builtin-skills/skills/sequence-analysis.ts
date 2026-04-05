import type { BuiltinSkill } from "../types"

export const sequenceAnalysisSkill: BuiltinSkill = {
  name: "sequence-analysis",
  description: "DNA/RNA/protein sequence analysis including composition, translation, ORFs, and motif-oriented checks",
  metadata: {
    category: "research/sequence-analysis",
    domain: "sequence-biology",
  },
  agent: "bio-pipeline-operator",
  allowedTools: ["Read(*)", "Bash(python:*)", "Bash(*)"],
  template: `# Sequence Analysis

Use this skill for DNA/RNA/protein sequence properties and sequence-centric downstream analysis.

## Preferred tools

- BioPython
- seqtk
- optional alignment tools for multi-sequence work

## Common tasks

- length and GC content
- reverse complement
- translation
- ORF finding
- restriction site inspection
- primer-oriented checks
- construct sanity checks before BLAST or vector work

## Starter pattern

\`\`\`python
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction

seq = Seq("ATGCGATCGATCG")
print(len(seq))
print(gc_fraction(seq) * 100)
print(seq.reverse_complement())
print(seq.translate())
\`\`\`

## Useful extensions

- ORF finding across strands and frames
- restriction site maps with \`Bio.Restriction\`
- approximate primer sanity checks with GC% and melting temperature
- pairwise alignment for quick comparisons before heavier homology workflows

## Hard rules

- report strand and frame assumptions
- do not overstate ORF confidence from naive scanning alone
- if the task needs homology or domain evidence, escalate to \`blast-search\` or \`functional-annotation\`
- if the task is cloning or plasmid-oriented, pair with \`vector-design\`

## Expected artifacts

- \`results/sequence/sequence_summary.tsv\`
- \`results/sequence/orf_summary.tsv\`
- \`results/sequence/restriction_sites.tsv\`
- optional \`results/sequence/primer_candidates.tsv\``,
}
