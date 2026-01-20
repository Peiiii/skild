# 2026-01-19 Skill Catalog 方案

## 背景与目标

- 覆盖范围必须不小于竞争对手，且可量化审计。
- 只做客观记录与展示，不新增规范约束、不做准入。
- 暂不做综合评分，仅收集可信元数据与来源信息。

## 关键原则

- 覆盖优先：全量枚举 + 增量更新是主路径。
- 单一事实来源：仓库级 meta 与技能目录记录分离，避免混淆。
- 可审计：保留 raw index 与来源字段，支持覆盖率对比。
- UI 不承载业务逻辑：仅消费 API 展示与筛选。

## 架构（Cloudflare 现状 + 扩展）

- Worker：`workers/registry`（新增 catalog API + Cron 消费分片）。
- D1：索引表与扫描状态。
- R2：技能快照与仓库枚举分片。
- Cron：驱动增量扫描与热入口补充。
- 可选：Cloudflare Queues（后期用于批量扫描任务，降低超时风险）。

## 覆盖与持续更新方案

1) **全量枚举入口（主）**  
外部离线任务每日生成 public repo 清单与增量（GitHub BigQuery/GH Archive），写入 R2 分片：
`repo-index/YYYY-MM-DD/part-*.json`。

2) **Worker Cron 消费分片**  
从 D1 读取 `repo_scan_cursor`，每次处理一批 repo：
- 拉 `git/trees?recursive=1` 或 `contents`，找所有 `SKILL.md`。
- 过滤安装残留路径（见下文）。
- 生成 `repo@path` 技能记录，写入 D1，R2 保存快照。
- 更新 `last_seen`/`discovered_at`，失败重试并记录错误。

3) **热入口补充（辅）**  
保留 `discoverGithubSkills`（code search）作为趋势入口，不承担覆盖任务。

4) **增量策略**  
先扫当天有 push 的 repo，周期性补跑全量，覆盖面单调逼近全集。

## 数据模型（D1 逻辑结构）

- `repos`：repo、stars_total、updated_at、license、topics、default_branch、is_skill_repo、last_seen。
- `skills`：id、repo、path、name、source_ref、source_url、discovered_at、last_seen、has_skill_md、has_readme、has_code、usage_artifact。
- `skill_sources`：skill_id、source_type（github/registry/competitor/seed）、source_url。
- `repo_scan_state`：repo、last_scanned_at、last_commit、status、error。
- 复用 `discover_items`/`discovered_skills`/`repo_metrics` 作为索引与统计表。

## 存储结构（R2）

- `repo-index/YYYY-MM-DD/part-*.json`：仓库枚举分片。
- `skill-snapshots/<slug>/SKILL.md`：技能原文。
- `skill-snapshots/<slug>/README.md`：可选。
- `skill-snapshots/<slug>/meta.json`：仓库元信息 + 技能路径元信息。

## 安装残留过滤（仅记录，不纳入可安装）

- 黑名单路径：`.agent/skills/**`、`.opencode/skills/**`、`.cursor/skills/**`、`.vscode/skills/**`、`**/node_modules/**`、`**/.skild/**`、`**/.cache/**`。
- 结构判定：仅含 SKILL.md 且无 README/源码/commit 的目录标记为 `usage_artifact=true`。

## 风险标记（简化）

- 仅二元标记：`hasRisk: true|false`。
- 规则扫描：命中 `rm -rf`、`sudo`、`curl|wget`+`bash|sh`、`chmod/chown`、`/etc`、`~/.ssh`、`token|secret|apikey`、`eval`、`exec` 即标记。
- `riskEvidence` 记录命中片段，仅用于展示。

## AI 打标（全量补全）

- 所有记录最终都跑一遍 AI（离线批处理，与采集解耦）。
- 字段：`tagSource`、`aiTaggedAt`、`aiModel`、`promptDigest`、`auto_tags`、`final_tags`、`overrides`。
- AI 仅做补全与结构化，不作为准入或评分依据。

## 前端与 CLI

- Worker API：
  - `GET /catalog/skills` 支持过滤（domain/task/type/risk/source）。
  - `GET /catalog/skills/:id` 返回 meta + R2 内容。
  - `GET /catalog/repos/:repo` 返回仓库视角汇总。
- 前端：列表走 D1，详情走 R2，CDN 缓存 + ETag。
- CLI：`skild search` 直连 catalog API；官方 `skild-catalog` skill 为 Agent 统一入口。

## 可靠性与幂等

- `repo@path` 作为幂等主键，重复扫描只更新 `last_seen`。
- 失败记录写入 `repo_scan_state`，指数退避重试。
- 429/ABUSE 退避，降低 API 失败波动。

## 验证与验收

- 覆盖指标：raw index 规模、增量覆盖率、重复率、失败率。
- 抽样验证：随机抽样 repo 与 path，验证 SKILL.md 命中正确。
- 前端验证：能在 catalog 页快速打开 SKILL.md 与 meta。

## 里程碑（建议）

1) R2 分片与 Worker Cron 消费跑通。
2) D1 索引与 catalog API 输出可用。
3) 前端列表与详情页加载顺畅。
4) CLI 搜索/官方 skill 接入 catalog API。
