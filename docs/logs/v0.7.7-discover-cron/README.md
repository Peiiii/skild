## 迭代：v0.7.7-discover-cron

### 改了什么
- Registry 增加 Cloudflare Cron：
  - 每日 02:00 UTC 触发 GitHub 技能发现（`discoverGithubSkills`），使用默认查询 `filename:SKILL.md path:skills`，支持 env 覆盖：`DISCOVER_CRON_QUERY`、`DISCOVER_CRON_PAGES`、`DISCOVER_CRON_PER_PAGE`、`DISCOVER_CRON_DELAY_MS`。
  - 刷新 discover_items 中已知 repo 的星标指标（调用 `refreshRepoMetrics`，默认最多 200 个）。
- Wrangler 配置新增 `[triggers] crons = ["0 2 * * *"]`。

### 验证/验收
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 冒烟：手动调用 `/admin/discover-github-skills` 与 `/admin/refresh-repo-metrics` 路径可用（需 admin 身份/令牌）；cron 逻辑为同一代码路径。

### 发布/部署
- 组件：`workers/registry`（需部署）。
- 步骤：`pnpm deploy:registry`（已执行，当前版本 `4297b712-9f1a-4d89-bb9c-de6840827407`）。
