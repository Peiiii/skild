## 迭代：v0.6.2-repo-skill-scan

### 改了什么
- `--depth` 仅用于 Markdown 文档递归，默认 0。
- 新增 `--scan-depth` 用于目录扫描，仓库链接可发现子目录 skills。
- 多 skill 结果按子目录层级展开，并折叠单子节点层级。
- 提取 `SKILL.md` 元数据并在选择树中展示技能描述。
- 更新安装文档与命令参数说明。
- 新增 `dev:console:remote-registry` 便于本地前端连接远程 registry。

### 验证/验收
- `pnpm release:check`
- 冒烟（在 `/tmp/skild-smoke` 目录执行）：
  - `node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install https://github.com/ComposioHQ/awesome-claude-skills --depth 0 --scan-depth 2 --max-skills 5 --yes --target claude --local`

### 发布/部署
- `pnpm release:version`
- `pnpm release:publish`
- 线上验证：`npm view skild version --registry=https://registry.npmjs.org/` → 待发布
- 发布范围：`skild`
- 本次无 migrations
