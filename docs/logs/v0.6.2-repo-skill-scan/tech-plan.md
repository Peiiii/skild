# 技术方案：v0.6.2-repo-skill-scan

## 设计
- 新增 `--scan-depth` 控制 `SKILL.md` 目录扫描深度，默认 `6`。
- `--depth` 仅控制 Markdown 文档递归深度，默认 `0`。
- Markdown 解析中拆分 `maxDocDepth` / `maxSkillDepth`：
  - 文档递归使用 `maxDocDepth`。
  - 仓库/目录扫描使用 `maxSkillDepth`，保证仓库链接可发现子目录 skills。
- 多 skill 结果根据 `relPath` 构建路径树，最终通过单子节点折叠收敛层级。
- 读取 `SKILL.md` frontmatter 提取 name/description，用于树中技能节点展示描述。

## 变更点
- `packages/cli/src/index.ts`：新增 `--scan-depth`，更新 `--depth` 描述。
- `packages/cli/src/commands/install.ts`：上下文拆分文档深度与扫描深度。
- `packages/cli/src/commands/markdown-discovery.ts`：拆分深度并应用到技能扫描。
- `docs/*` 与 `skills/skild/commands.md`：更新参数说明。
- changeset + changelog。

## 验证计划
- `pnpm release:check`
- 冒烟（在 `/tmp/skild-smoke` 目录执行）：
  - `node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install https://github.com/ComposioHQ/awesome-claude-skills --depth 0 --scan-depth 2 --max-skills 5 --yes --target claude --local`
