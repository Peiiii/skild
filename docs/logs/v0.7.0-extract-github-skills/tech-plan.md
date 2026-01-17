# 技术方案：v0.7.0-extract-github-skills

## 目标
- 新增 `skild extract-github-skills`，从 GitHub 解析技能树并导出完整技能目录。
- 复用 Markdown 解析 + skill 发现能力，避免重复逻辑。

## 方案概览
- CLI 新命令：`extract-github-skills <source>`
- 解析阶段复用 `discoverMarkdownSkillsFromSource`
- 目录输出：
  - 根目录输出 `catalog.json`
  - 每个技能目录包含完整文件 + `skill.json`
- 支持参数：`--out`、`--force`、`--depth`、`--scan-depth`、`--max-skills`

## 关键设计
- **树形结构**：使用 Markdown 解析树，已折叠单子节点；若无 Markdown，则按 relPath 生成树并折叠。
- **路径稳定性**：基于节点 label 进行 slug 化，冲突自动追加后缀。
- **完整导出**：对每个 skill 复制目录内全部文件。
- **缓存优化**：同仓库多技能只 materialize 一次。

## 变更点
- CLI 新命令文件：`packages/cli/src/commands/extract-github-skills.ts`
- CLI 注册命令：`packages/cli/src/index.ts`
- Markdown 发现模块更名并导出解析能力：`packages/cli/src/commands/markdown-discovery.ts`
- 文档与命令索引更新：`docs/usage.md`、`skills/skild/commands.md`、`commands/commands.md`

## 验证计划
- `pnpm release:check`
- 冒烟（在 `/tmp/skild-smoke` 执行）：
  - `node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js extract-github-skills https://github.com/ComposioHQ/awesome-claude-skills --max-skills 5 --out /tmp/skild-smoke/export --force`
