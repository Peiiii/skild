## 技术方案：Skill 发现质量指标（下载量 + GitHub Stars）

### 背景 & 目标
- 当前 discover 提供技能列表但缺乏质量/热度信号，易出现劣质技能。
- 已有下载计数（download_events/daily/total），缺少 GitHub Stars/趋势。
- 目标：为 discover/search/leaderboard 提供「星标 + 下载」综合指标，支持近期趋势排序，供 CLI/Console/Landing 调用。

### 数据模型
- `repo_metrics`（新增）：`repo`(PK, owner/repo)、`stars_total`、`stars_delta_30d`、`stars_updated_at`、`updated_at`。
- `repo_stars_daily`（新增）：`repo` + `day`(YYYY-MM-DD, PK)、`stars`、`updated_at`，用于计算 30 天增量与趋势。
- `discovered_skills`（新增，用于 GitHub 自动发现）：`id`(PK, `github:{repo}:{skill_dir}`)、`repo`、`skill_dir`、`skill_name`、`source_ref`(可空)、`source_url`、`discovered_at`、`last_seen`、`updated_at`。
- 复用现有下载表：`download_daily`、`download_total`、`download_events`。
- Discover 侧 join：`repo_metrics` 供星标指标；自动发现生成的技能写入 `discover_items`（type=linked，source_id 为合成 id）。

### 采集与刷新
- GitHub Stars：
  - API：`GET https://api.github.com/repos/{owner}/{repo}`，读取 `stargazers_count`，`GITHUB_TOKEN`（env），节流（最少 1 req/sec）+ ETag/If-None-Match。
  - 流程：扫描 `discover_items` 中的 `source_repo` 去重 → 拉 stars → 写 `repo_metrics` + `repo_stars_daily`，重算 `stars_delta_30d`。
  - 触发：`POST /admin/refresh-repo-metrics`（header `x-admin-token`，可 limit/offset），后续可挂 Cron。
- GitHub 自动发现 SKILL：
  - Search API：`GET /search/code?q=filename:SKILL.md+path:skills&sort=updated&order=desc`（可调 q）；分页/limit。
  - 对结果解析 repo/path，推导 skill_dir（去掉 `SKILL.md`）、skill_name（目录名），生成 id `github:{repo}:{skill_dir}`，install 为 `skild install owner/repo/skill_dir`（无 ref 时用默认分支）。
  - Upsert `discovered_skills`，同步写入 `discover_items`（type=linked，publisher/publisher_handle 为空，source_repo/path 填充，install 生成）。
  - 触发：`POST /admin/discover-github-skills`（header `x-admin-token`，支持 limit/page、query），后续可挂 Cron。

### API 输出与排序
- `GET /discover`：新增 `starsTotal`、`stars30d`，支持 `sort=stars`、`sort=stars_30d`；保持 `downloads_7d/30d` 等。
- `GET /leaderboard`：后续可加星标 join（当前重点在 discover/search）。
- 自动发现来源也通过 `discover_items` 输出，install/metadata 统一。

### 算法（评分预留）
- 预留 `score`：`w1*downloads_30d + w2*stars_30d + w3*log(downloads_total+1) + w4*log(stars_total+1)`，权重写死在查询层或配置。
- 首版可不暴露 score，只暴露原始指标 + 排序。

### 配置 & 安全
- 新增 env：
  - `GITHUB_TOKEN`：GitHub 访问令牌。
  - `ADMIN_TOKEN`：用于保护刷新接口。
- Rate limit：简单节流（每次触发批量 limit，默认 50/次），错误回退。

### 流程与组件改动
- DB 迁移：`workers/registry/migrations/0010_repo_metrics.sql`（创建 repo_metrics / repo_stars_daily）。
- 服务端：
  - 新增模块 `github-metrics.ts`：封装 GitHub 拉取与表更新。
  - `index.ts`：新增 `/admin/refresh-repo-metrics` 路由；`/discover` join 星标字段；排序扩展。
- 文档：迭代日志说明 + API 变更说明（后续）。

### 验证计划
- 单测/集成（如有测试框架）：mock GitHub API，验证更新表与 delta 计算。
- 本地冒烟：
  - 跑迁移。
  - 手动调用刷新接口（提供 ADMIN_TOKEN/GITHUB_TOKEN），确认 repo_metrics 写入。
  - 调用 `/discover?sort=stars_30d`，看到字段与排序正确。
- 发布前：`pnpm build && pnpm lint && pnpm typecheck`；registry 部署后，线上再跑一次刷新并检查 API。

### 风险 & 备选
- GitHub 配额不足：支持分批刷新（limit/offset），可退化为每日少量更新。
- 部分技能无 source_repo：无法获取星标，保持空值，不影响输出。
- 星标时间序列缺失：初期 delta 可能为 0，等待累积每日数据。
