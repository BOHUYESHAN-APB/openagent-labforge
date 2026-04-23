// Test name fixing logic
const testCases = [
  { original: "bio-alignment-io", dir: "alignment-io", category: "alignment", expected: "alignment-io" },
  { original: "alignment-msa-parsing", dir: "msa-parsing", category: "alignment", expected: "msa-parsing" },
  { original: "alignment-io", dir: "alignment-io", category: "alignment", expected: "alignment-io" },
  { original: "bio-rna-seq-deseq2", dir: "deseq2", category: "rna-seq", expected: "deseq2" },
]

for (const test of testCases) {
  let name = test.original
  
  // Remove bio- prefix
  name = name.replace(/^bio-/, "")
  
  // If name still has category prefix, remove it
  // But only if the remaining part matches the directory name
  const categoryPrefix = `${test.category}-`
  if (name.startsWith(categoryPrefix)) {
    const withoutCategory = name.substring(categoryPrefix.length)
    if (withoutCategory === test.dir) {
      name = withoutCategory
    }
  }
  
  const match = name === test.expected ? "✓" : "✗"
  console.log(`${match} ${test.original} -> ${name} (expected: ${test.expected})`)
}
