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

Use this skill for DNA/RNA/protein sequence properties and basic downstream analysis.

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
- simple primer-oriented checks

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

## Hard rules

- Report the strand/frame assumptions.
- Do not overstate ORF confidence from naive scanning alone.
- If the task needs homology or domain evidence, hand off to BLAST/domain workflows instead of guessing.
`,
}
