## 迭代：v0.7.4-sync-logs-ux

### 改了什么
- `skild sync` CLI 输出统一英文，并在开始时按平台提示缺失数量，显示“无需同步”的平台。
- 保持现有缺失矩阵 + 树形选择交互，便于确认同步范围。

### 验证/验收
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 冒烟：`node packages/cli/dist/index.js sync --help`

### 发布/部署
- npm：`pnpm changeset` → `pnpm release:version` → `pnpm release:publish`（含 build/lint/typecheck）。
- 无后端/数据库变更。
