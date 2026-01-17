## 迭代：v0.7.0-extract-github-skills

### 改了什么
- 新增 `skild extract-github-skills`：从 GitHub 解析技能树并导出完整技能目录。
- 复用 Markdown 发现能力并导出 `catalog.json` + `skill.json`。
- 导出时复制技能目录内全部内容，确保技能组成完整。
- 更新命令索引与使用文档。

### 验证/验收
- `pnpm release:check`
- 冒烟（在 `/tmp/skild-smoke` 执行）：
  - `node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js extract-github-skills https://github.com/ComposioHQ/awesome-claude-skills --max-skills 5 --out /tmp/skild-smoke/export --force`

### 发布/部署
- `pnpm release:version`
- `pnpm release:publish`
- 线上验证：`npm view skild version --registry=https://registry.npmjs.org/` → `0.7.0`
- 线上验证：`npm view @skild/core version --registry=https://registry.npmjs.org/` → `0.7.0`
- 发布范围：`@skild/core`、`skild`
- 本次无 migrations
