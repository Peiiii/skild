## 迭代：v0.5.0-skill-discovery-metrics

### 目标
- 提供可信的发现信号：下载量（总/30天）、GitHub Stars（总/30天增量），并接入 discover 排序。
- 自动发现 GitHub 上的 SKILL（Search API），写入 discover_items 供精选/趋势。

### 范围（当前进度）
- ✅ 数据模型：新增 `repo_metrics`、`repo_stars_daily`、`discovered_skills` 迁移。
- ✅ API & 采集：
  - `POST /admin/refresh-repo-metrics`：扫描 discover_items 的 repo，拉取 GitHub stars，更新 metrics（需 `x-admin-token`）。
  - `POST /admin/discover-github-skills`：调用 GitHub Search API（filename:SKILL.md），落库并写入 discover_items（type=linked，source_id=github:...）。
  - `/discover` 返回 `starsTotal`/`stars30d`，支持 `sort=stars|stars_30d`。
- ✅ 文档：技术方案补充。
- ❗ UI/CLI 展示未改（等待后续需求）。

### 验收/验证
- `pnpm build && pnpm lint && pnpm typecheck` 已通过。
- 手工调用/冒烟：待部署后用 ADMIN_TOKEN/GITHUB_TOKEN 触发 `/admin/*` 接口验证。

### 发布/部署
- 迁移：运行到 `0011_discovered_skills.sql`（包含 0010_repo_metrics）。
- 配置：
  - `GITHUB_TOKEN`：GitHub API token。
  - `ADMIN_TOKEN`：保护 `/admin/*`。
- 建议：为 Worker 配置 Cron 触发 refresh/discover（或先用手动接口）。

### 待办/风险
- GitHub API 配额：已做节流参数，需关注 403 速率限制。
- 自动发现仅依赖 Search API，未做 HTML 爬虫。
