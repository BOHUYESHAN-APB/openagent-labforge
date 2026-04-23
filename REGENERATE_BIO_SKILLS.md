# Bio Skills Bundle 重新生成指南

## 问题背景

原有的 bio skills bundle 中的 469 个 skills 都带有 `discovery_hidden: "true"` 标记，导致它们在 OpenCode 中不可见。

## 解决方案

从新的 bioSkills 仓库（`Future/clone/bioSkills`）重新生成 bio bundle，该仓库包含 439 个没有 `discovery_hidden` 标记的 skills。

## 重新生成步骤

1. 运行重新生成脚本：
   ```bash
   cd scripts
   bun regenerate-bio-bundle.ts
   ```

2. 替换旧的 bio bundle：
   ```bash
   cd ..
   rm -rf generated/skills-bundles/bio-old
   mv generated/skills-bundles/bio generated/skills-bundles/bio-old
   mv generated/skills-bundles/bio-new generated/skills-bundles/bio
   ```

3. 验证加载：
   ```bash
   bun verify-bio-skills.ts
   ```

## 关键修复

### 1. 路径问题
脚本需要从 `scripts/` 目录运行，但要正确引用项目根目录的路径。

### 2. 名称验证问题
OpenCode 的 skill 验证器要求 skill 的 `name` 字段必须与目录名完全匹配。

原始 bioSkills 中的命名：
- `bio-alignment-io` (目录: `alignment-io`)
- `bio-alignment-msa-parsing` (目录: `msa-parsing`)
- `bio-alignment-multiple` (目录: `multiple-alignment`)

解决方案：在复制时将 `name` 字段替换为目录名。

### 3. 目录结构
```
generated/skills-bundles/bio/skills/
├── alignment/
│   ├── alignment-io/
│   │   ├── SKILL.md (name: alignment-io)
│   │   ├── usage-guide.md
│   │   └── examples/
│   ├── msa-parsing/
│   └── ...
├── alignment-files/
└── ...
```

## 结果

- ✓ 成功加载 439 个 bio skills
- ✓ 所有 skills 的名称与目录名匹配
- ✓ Skills 按类别组织（64 个类别）
- ✓ postinstall 自动配置正常工作

## 类别分布（前 10）

1. workflows: 41 skills
2. single-cell: 14 skills
3. variant-calling: 13 skills
4. data-visualization: 12 skills
5. database-access: 11 skills
6. spatial-transcriptomics: 11 skills
7. clinical-databases: 10 skills
8. alignment-files: 9 skills
9. proteomics: 9 skills
10. sequence-io: 9 skills
