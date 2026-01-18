## 迭代：v0.7.5-cli-add-alias

### 改了什么
- CLI 支持 npm 风格别名：`skild add` 等价于 `skild install` / `skild i`（单实现复用）。
- 文档补充别名说明：`docs/usage*`、`packages/cli/README.md`、`skills/skild/commands.md`。

### 验证/验收
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 冒烟：`node packages/cli/dist/index.js add https://github.com/anthropics/skills/tree/main/skills/pdf --help`（解析为 install 选项）

### 发布/部署
- npm：`skild@0.10.0` 已发布（流程：`pnpm changeset` → `pnpm release:version` → `pnpm release:publish`，含 build/lint/typecheck）。
- 无后端/数据库变更。
