# 自动 Skills 注册机制

## 概述

为了避免在 OpenCode 配置文件中手动注册大量 skills，插件在安装时会自动配置生物信息学 skills bundle。

## 工作原理

### 1. Skills 组织结构

插件的 skills 分为两类：

- **内建 Skills (51 个)**：高频使用的 skills，以 TypeScript 代码形式存储在 `src/features/builtin-skills/skills/`
  - 包括：playwright, frontend-ui-ux, git-master, bio-tools, blast-search 等
  - 这些 skills 总是被加载，无需配置

- **文本 Skills (469 个)**：低频使用的生物信息学 skills，以 Markdown 形式存储
  - 位置：`generated/skills-bundles/bio/skills/`
  - 包括 65 个类别，涵盖：
    - alignment, variant-calling, differential-expression
    - single-cell, spatial-transcriptomics, metagenomics
    - proteomics, metabolomics, phylogenetics
    - 等等

### 2. 自动配置机制

在 `npm install` 或 `bun install` 时，`postinstall.mjs` 脚本会：

1. 检测 OpenCode 配置目录：
   - Windows: `%APPDATA%\opencode\`
   - macOS: `~/Library/Application Support/ai.opencode.desktop/`
   - Linux: `~/.config/opencode/`

2. 创建或更新 `openagent-labforge.json` 配置文件

3. 自动添加 bio skills bundle 配置：
   ```json
   {
     "skills": {
       "bundle": "bio"
     }
   }
   ```

### 3. Bundle 选项

配置中的 `skills.bundle` 支持三个值：

- `"bio"`: 加载 469 个生物信息学 skills
- `"paper"`: 加载论文写作相关的 skills
- `"full"`: 加载所有 skills（bio + paper）

## 优势

### ✅ 避免配置文件混乱
- 不需要在配置文件中列出 469 个 skill 名称
- 只需一行配置：`"bundle": "bio"`

### ✅ 插件更新更方便
- 插件添加/删除 skills 时，用户无需修改配置
- Skills 的管理完全由插件控制

### ✅ 按需加载
- 只有配置了 bundle 的 skills 才会被加载
- 减少内存占用和启动时间

### ✅ 自动化
- 用户安装插件后无需手动配置
- 开箱即用

## 手动配置

如果自动配置失败，或者需要自定义配置，可以手动编辑配置文件：

### 全局配置
编辑 `~/.config/opencode/openagent-labforge.json`（或对应平台的路径）：

```json
{
  "skills": {
    "bundle": "bio"
  }
}
```

### 项目级配置
在项目根目录创建 `.opencode/openagent-labforge.json`：

```json
{
  "skills": {
    "bundle": "bio"
  }
}
```

项目级配置会覆盖全局配置。

## 自定义 Skills 源

如果需要加载自定义的 skills 目录，可以使用 `sources` 配置：

```json
{
  "skills": {
    "bundle": "bio",
    "sources": [
      "/path/to/custom/skills",
      {
        "path": "/path/to/another/skills",
        "recursive": true,
        "glob": "**/*.skill.md"
      }
    ]
  }
}
```

## 验证配置

安装插件后，可以通过以下方式验证 skills 是否正确加载：

1. **查看配置文件**：
   ```bash
   cat ~/.config/opencode/openagent-labforge.json
   ```

2. **在 OpenCode 中调用 skill**：
   ```
   skill(name="research/bioinformatics/alignment/bwa-mem")
   ```

3. **查看错误信息**：
   如果 skill 不存在，错误信息会列出所有可用的 skills，包括 bio bundle 中的 skills

## 技术细节

### Skills 发现流程

1. **内建 Skills**：
   - `createBuiltinSkills()` 创建 51 个 TS skills
   - 这些 skills 的 scope 是 `"builtin"`

2. **Bundle Skills**：
   - `discoverConfigSourceSkills()` 根据 `skills.bundle` 配置
   - 从 `generated/skills-bundles/{bundle}/skills/` 加载 Markdown skills
   - 这些 skills 的 scope 是 `"config"`

3. **合并 Skills**：
   - `mergeSkills()` 将所有 skills 合并
   - 优先级：project > user > opencode > builtin/plugin

4. **Skill Tool**：
   - `createSkillTool()` 使用合并后的 skills
   - 生成包含所有可用 skills 的描述
   - 提供 skill 执行功能

### 配置优先级

1. 项目级配置（`.opencode/openagent-labforge.json`）
2. 全局配置（`~/.config/opencode/openagent-labforge.json`）
3. 默认配置（由 postinstall 创建）

## 故障排除

### Skills 没有被加载

1. 检查配置文件是否存在：
   ```bash
   ls -la ~/.config/opencode/openagent-labforge.json
   ```

2. 检查配置内容：
   ```bash
   cat ~/.config/opencode/openagent-labforge.json
   ```

3. 手动运行 postinstall：
   ```bash
   node postinstall.mjs
   ```

4. 重启 OpenCode

### 配置文件被覆盖

如果你有自定义配置，postinstall 脚本不会覆盖已存在的 `skills.bundle` 配置。

如果需要重置配置，删除配置文件后重新运行 postinstall：
```bash
rm ~/.config/opencode/openagent-labforge.json
node postinstall.mjs
```

## 相关文件

- `postinstall.mjs` - 自动配置脚本
- `src/plugin/skill-context.ts` - Skills 上下文创建
- `src/features/opencode-skill-loader/config-source-discovery.ts` - Bundle 发现逻辑
- `src/tools/skill/tools.ts` - Skill tool 实现
- `generated/skills-bundles/bio/INDEX.md` - Bio bundle 索引
