# Skills 自动注册功能实现总结

## 问题背景

用户报告 OpenCode 在查找 skills 时，只显示 OpenCode 内置的 skills（playwright, frontend-ui-ux 等），而看不到插件提供的 469 个生物信息学 skills。

### 根本原因

插件的 skills 分为两类：
1. **51 个内建 skills**（TS 代码）：总是被加载
2. **469 个文本 skills**（Markdown）：需要配置 `skills.bundle: "bio"` 才能加载

但是插件没有自动配置 bio bundle，导致文本 skills 不可用。

## 解决方案

### 实现自动配置机制

修改 `postinstall.mjs`，在插件安装时自动配置 bio skills bundle：

**关键功能**：
1. 检测 OpenCode 配置目录（跨平台）
2. 创建或更新 `openagent-labforge.json` 配置文件
3. 自动添加 `"skills": { "bundle": "bio" }` 配置
4. 不覆盖已存在的配置

**优势**：
- ✅ 用户安装插件后无需手动配置
- ✅ 避免在配置文件中列出 469 个 skill 名称
- ✅ 插件更新 skills 时用户无需修改配置
- ✅ 开箱即用

## 修改的文件

### 1. `postinstall.mjs`
添加了 `autoConfigureBioSkills()` 函数：
- 获取 OpenCode 配置目录
- 读取现有配置（如果存在）
- 检查是否需要添加 bio bundle 配置
- 写入配置文件

### 2. `docs/AUTO-SKILLS-REGISTRATION.md`
创建了完整的文档，说明：
- Skills 组织结构
- 自动配置机制
- Bundle 选项
- 手动配置方法
- 故障排除

## 测试结果

```bash
$ node postinstall.mjs
✓ openagent-labforge binary installed for win32-x64 (openagent-labforge-windows-x64)
✓ Auto-configured bio skills bundle in C:\Users\BoHuYeShan\AppData\Roaming\opencode\openagent-labforge.json
  This enables 469 bioinformatics skills from the plugin
```

生成的配置文件：
```json
{
  "skills": {
    "bundle": "bio"
  }
}
```

## 使用方式

### 自动配置（推荐）
用户安装插件时自动配置：
```bash
npm install @bohuyeshan/openagent-labforge-core
# 或
bun install @bohuyeshan/openagent-labforge-core
```

### 手动配置
如果需要自定义，编辑配置文件：
```json
{
  "skills": {
    "bundle": "bio",  // 或 "paper", "full"
    "sources": [      // 可选：自定义 skills 目录
      "/path/to/custom/skills"
    ]
  }
}
```

## Bio Skills Bundle 内容

**469 个生物信息学 skills**，分布在 65 个类别：

- alignment (5 skills)
- variant-calling (13 skills)
- differential-expression (6 skills)
- single-cell (14 skills)
- spatial-transcriptomics (11 skills)
- metagenomics (7 skills)
- proteomics (9 skills)
- metabolomics (8 skills)
- phylogenetics (8 skills)
- ... 等等

完整列表见 `generated/skills-bundles/bio/INDEX.md`

## 配置路径（跨平台）

- **Windows**: `%APPDATA%\opencode\openagent-labforge.json`
- **macOS**: `~/Library/Application Support/ai.opencode.desktop/openagent-labforge.json`
- **Linux**: `~/.config/opencode/openagent-labforge.json`

## 验证方法

1. **检查配置文件**：
   ```bash
   cat ~/.config/opencode/openagent-labforge.json
   ```

2. **在 OpenCode 中测试**：
   ```
   skill(name="research/bioinformatics/alignment/bwa-mem")
   ```

3. **查看可用 skills**：
   调用不存在的 skill，错误信息会列出所有可用 skills

## 技术细节

### Skills 加载流程

1. `loadPluginConfig()` 加载配置文件
2. `createSkillContext()` 创建 skills 上下文
3. `loadMergedSkills()` 合并所有 skills：
   - `createBuiltinSkills()` → 51 个内建 skills
   - `discoverConfigSourceSkills()` → 根据 bundle 配置加载文本 skills
   - `mergeSkills()` → 合并并去重
4. `createSkillTool()` 创建 skill tool
5. 插件通过 `tool: tools` 暴露给 OpenCode

### 配置优先级

1. 项目级配置（`.opencode/openagent-labforge.json`）
2. 全局配置（`~/.config/opencode/openagent-labforge.json`）
3. 默认值（由 postinstall 创建）

## 后续改进建议

1. **添加配置验证**：在插件启动时检查 bio bundle 是否正确加载
2. **提供 CLI 命令**：`openagent-labforge config skills --bundle bio`
3. **支持多个 bundles**：`"bundle": ["bio", "paper"]`
4. **Skills 搜索功能**：提供命令行工具搜索可用 skills
5. **Skills 文档生成**：自动生成 skills 使用文档

## 相关问题修复

本次修复同时解决了之前的问题：
- ✅ Git snapshot 持续失败（已清理 .opencode/ 目录）
- ✅ 插件提示词注入清理（已修复 undo 残留）
- ✅ 粘贴占位符泄露（已清理）
- ✅ Skills 注册问题（本次修复）

所有修复的详细信息见：
- `ISSUE-DIAGNOSIS-REPORT.md`
- `BUGFIX-PROMPT-INJECTION.md`
- `AUTO-SKILLS-REGISTRATION.md`
