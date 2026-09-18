# 2026-09-18 Discover D1 Read Optimization

## 背景 / 问题

- `skild-registry` 的 `/discover` 成为 Cloudflare D1 当日读行数最大来源。
- 单次请求会对 `download_daily` 分别计算 7 天和 30 天聚合，并为精确总数再次执行大部分相同的联合查询。
- 相同的公开发现页请求没有边缘缓存，重复访问会持续读取 D1。

## 决策

- 新增按实体预计算的 7 天/30 天下载汇总表，每日 UTC 日期切换后由现有 Cron 重建一次，新下载事件实时递增。
- `/discover` 只连接汇总表，不再为每次请求扫描 `download_daily`。
- 精确总数继续保留，由列表查询的窗口计数一并返回；仅空游标页回退独立计数，保持公开 API 兼容。
- 对完整查询 URL 和允许来源增加 300 秒 Cache API 缓存，避免跨来源 CORS 响应串用。

## 变更内容

- 新增 `0016_discover_download_rollups.sql`，初始化下载窗口汇总及维护状态。
- 下载事件写入时同步递增当天有效的 7 天/30 天汇总。
- 每日首次 Cron 执行时原子重建滚动窗口。
- `/discover` 返回 `x-skild-cache: MISS|HIT`；Cache API 内部副本缓存 300 秒，客户端响应使用 `no-store`，避免区域浏览器 TTL 规则造成长时间陈旧数据。
- 常规列表请求不再执行第二条精确计数 SQL。

## 功能说明

- 目标：显著降低发现页的 D1 rows read，同时保持筛选、排序、游标与 `total` 行为不变。
- 输入：`GET /discover` 的现有 `q/limit/cursor/sort/skillset/category` 参数。
- 输出：响应 JSON 结构不变；新增缓存诊断响应头。
- 默认策略：缓存 300 秒，可通过 `DISCOVER_CACHE_TTL_SECONDS` 设置为 0～3600 秒。
- 边界与失败模式：Cache API 写入失败不影响当前响应；每日汇总刷新失败时保留上一版汇总并在下一分钟 Cron 重试。

## 使用方式

```bash
# 默认发现页
curl -i 'https://registry.skild.sh/discover?limit=20&sort=downloads_7d'

# 验证同一查询命中边缘缓存
curl -i 'https://registry.skild.sh/discover?limit=20&sort=downloads_7d'
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test

curl -fsS 'https://registry.skild.sh/health'
curl -fsS 'https://registry.skild.sh/discover?limit=2&sort=downloads_7d'
```

验收点：

- build、lint、typecheck、test 全部通过。
- 远程 migration 成功，汇总表存在且刷新状态为当天 UTC 日期。
- `/discover` 连续请求返回相同业务数据，第二次响应为 `x-skild-cache: HIT`。
- `downloads_7d`、`downloads_30d`、`total` 与发布前响应语义一致。

本地验收结果：

- `pnpm build`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 均通过。
- 在仓库外的临时 D1 中完整执行 0001～0016 migrations，新增表与维护状态校验通过。
- Worker 冒烟数据返回 `downloadsTotal=100`、`downloads7d=7`、`downloads30d=30`、`total=1`。
- 相同请求第一次返回 `x-skild-cache: MISS`（23ms），第二次返回 `x-skild-cache: HIT`（1ms）。

## 发布 / 部署

```bash
pnpm deploy:registry
```

- 发布脚本按顺序执行远程 D1 migrations、部署 `skild-registry`、检查生产 `/health`。

## 影响范围 / 风险

- Breaking change：否。
- 影响组件：仅 registry Worker 与 `skild-registry` D1。
- 风险：发现页下载排序最多存在 5 分钟边缘缓存延迟；每日窗口切换最多存在 1 分钟 Cron 延迟。
- 回滚：回退 Worker 代码即可恢复旧查询；新增表可保留，不影响旧版本。
