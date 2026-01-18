## 迭代：v0.7.6-discover-cursor-fix

### 改了什么
- 修复 `/discover` 分页 cursor 对排序字段的过滤未生效问题（WHERE 子句不再依赖 SELECT alias，使用实际排序表达式），避免重复返回第一页。

### 验证/验收
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 冒烟：`curl "https://registry.skild.sh/discover?cursor=<上页返回的cursor>&sort=downloads_7d&limit=20"` 返回下一页且 `nextCursor` 变化。

### 发布/部署
- registry：需要发布 `skild-workers`。
- 步骤：`pnpm changeset` → `pnpm release:version` → `pnpm release:publish`（含 build/lint/typecheck）→ 部署 registry。
