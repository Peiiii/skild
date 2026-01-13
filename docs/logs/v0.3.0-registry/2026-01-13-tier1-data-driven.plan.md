# 2026-01-13 Iteration Plan：Tier 1 数据驱动（下载次数 / 趋势 / 排行 / 新上架）

> 目标：在 1-2 周内，让 Discover/详情页具备可量化的热度指标，并且做到可扩展、可审计。

---

## 范围与原则

### 覆盖对象
- Registry skills（`@publisher/skill`）
- Linked items（GitHub 收录条目）

### 核心原则
- 统计逻辑在后端完成，UI 只消费结果（不依赖业务逻辑）。
- 事件日志与聚合统计分离，保证可审计与可扩展。
- 统一 ID 体系：`entity_type + entity_id`，避免重复实现。

---

## 数据模型（D1）

### 1) 事件日志（可追溯）
```
DOWNLOAD_EVENTS
- id (uuid)
- entity_type (registry | linked)
- entity_id (skill_name | linked_item_id)
- source (cli | console | api | unknown)
- client_hash (匿名化设备/用户标识，可选)
- ip_hash (可选)
- user_agent (可选)
- created_at (ISO)
```
用途：审计、去重、反作弊分析。

### 2) 日聚合（高频读）
```
DOWNLOAD_DAILY
- entity_type
- entity_id
- day (YYYY-MM-DD)
- downloads (int)
- updated_at
PRIMARY KEY (entity_type, entity_id, day)
```
用途：趋势图、排行榜、详情页日序列。

### 3) 总量聚合（低成本读取）
```
DOWNLOAD_TOTAL
- entity_type
- entity_id
- downloads (int)
- updated_at
PRIMARY KEY (entity_type, entity_id)
```
用途：列表/详情页的 “下载次数”。

> 可选：如果需要小时级趋势，新增 `DOWNLOAD_HOURLY`，策略同 `DOWNLOAD_DAILY`。

---

## 事件采集（写入链路）

### 写入方式（推荐）
- 新增 API：`POST /stats/downloads`
- CLI 在安装成功后上报（registry install + GitHub install 都上报）
- Console 仅用于展示，不参与上报

### 请求体
```json
{
  "entityType": "registry" | "linked",
  "entityId": "@scope/name" | "<linked_item_id>",
  "source": "cli",
  "clientHash": "..." // optional, anonymized
}
```

### 服务端写入策略
- 写 `download_events`
- 同步 `INSERT ... ON CONFLICT` 更新 `download_daily` 与 `download_total`
- 防抖：同一 clientHash + entity + day 可做计数去重（可选）

---

## 读 API 设计

### 1) 详情页统计
- `GET /stats/registry/:scope/:skill`
- `GET /stats/linked-items/:id`

返回：
```json
{
  "ok": true,
  "total": 1234,
  "trend": [
    { "day": "2026-01-10", "downloads": 12 },
    { "day": "2026-01-11", "downloads": 30 }
  ]
}
```

### 2) 排行榜
- `GET /leaderboard?type=all|registry|linked&period=7d|30d|90d&limit=20`

返回：统一结构（与 discover_items 对齐）：
```json
{
  "ok": true,
  "items": [
    { "entityType": "registry", "entityId": "@a/b", "downloads": 123 }
  ]
}
```

### 3) Discover 排序/过滤
- `GET /discover?sort=downloads_7d|downloads_30d|new|updated&q=&cursor=&limit=`
- 后端基于 `discover_items` + `download_daily/total` 聚合返回

---

## 前端对接字段规范（正式口径）

> 约定：所有时间字段为 ISO 字符串（UTC），所有数值字段为 number，缺失时返回 0 或 null（不返回 undefined）。

### 1) Discover 列表（统一入口）
`GET /discover` 返回：
```json
{
  "ok": true,
  "items": [
    {
      "type": "registry",
      "sourceId": "@scope/name",
      "title": "@scope/name",
      "description": "…",
      "tags": ["pdf", "documents"],
      "install": "skild install @scope/name",
      "publisherHandle": "alice",
      "source": null,
      "discoverAt": "2026-01-13T00:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-13T00:00:00.000Z",
      "downloadsTotal": 1234,
      "downloads7d": 120,
      "downloads30d": 560
    },
    {
      "type": "linked",
      "sourceId": "<linked_item_id>",
      "title": "frontend-design",
      "description": "…",
      "tags": ["ui", "design"],
      "install": "skild install owner/repo/path#ref",
      "publisherHandle": "bob",
      "source": {
        "repo": "owner/repo",
        "path": "skills/frontend-design",
        "ref": "main",
        "url": "https://github.com/owner/repo/tree/main/skills/frontend-design"
      },
      "discoverAt": "2026-01-13T00:00:00.000Z",
      "createdAt": "2026-01-13T00:00:00.000Z",
      "updatedAt": "2026-01-13T00:00:00.000Z",
      "downloadsTotal": 42,
      "downloads7d": 8,
      "downloads30d": 30
    }
  ],
  "nextCursor": "opaque"
}
```

字段说明：
- `type`：`registry | linked`，用于 UI 标识与跳转逻辑
- `sourceId`：registry 为 `@scope/name`，linked 为 `linked_items.id`
- `install`：直接可复制的安装命令（UI 不再拼接）
- `downloadsTotal / downloads7d / downloads30d`：若无数据返回 0
- `nextCursor`：后端生成的分页游标，前端只做透传

### 2) 详情页统计（趋势 + 总量）
`GET /stats/registry/:scope/:skill` 与 `GET /stats/linked-items/:id` 返回：
```json
{
  "ok": true,
  "total": 1234,
  "window": "30d",
  "trend": [
    { "day": "2026-01-10", "downloads": 12 },
    { "day": "2026-01-11", "downloads": 30 }
  ]
}
```

字段说明：
- `total`：全量下载次数
- `window`：趋势口径（默认 30d）
- `trend`：按天序列，缺失天补 0 由后端完成

### 3) 排行榜
`GET /leaderboard` 返回：
```json
{
  "ok": true,
  "period": "7d",
  "items": [
    {
      "type": "registry",
      "sourceId": "@scope/name",
      "title": "@scope/name",
      "install": "skild install @scope/name",
      "downloads": 321
    }
  ]
}
```

字段说明：
- `period`：`7d | 30d | 90d`
- `downloads`：所选 period 内的下载量
- `title/install`：直接用于 UI 渲染与复制

---

## 与现有表的关系

- `discover_items`：继续作为统一 Discover 入口。
- `skills` / `linked_items`：作为源数据，避免混表。
- Discover 结果通过 join/聚合得到下载数据（不污染源表）。

---

## 任务拆分（后端）

### Phase 1（基础统计）
- D1 migration：新增 `download_events` / `download_daily` / `download_total`
- API：`POST /stats/downloads` + `GET /stats/registry/:scope/:skill` + `GET /stats/linked-items/:id`
- CLI 上报（安装后调用）

### Phase 2（排行/Discover 排序）
- API：`GET /leaderboard`
- `GET /discover` 支持 sort=downloads_*（基于 download_daily 汇总）

### Phase 3（趋势图增强）
- 支持更长时间区间（90d/180d）
- 如需高精度趋势，可引入 hourly 表

---

## 风控与可靠性

- 基础速率限制（entity + ip_hash / client_hash）
- 保留 event log 30-90 天（可定期归档/清理）
- 统计口径统一：仅以安装成功为一次 download

---

## 验证与发布流程

- 本地：`pnpm build` + `pnpm -C workers/registry typecheck`
- 远程：执行 migration
- 线上：冒烟调用 `/stats/*` 与 `/discover?sort=downloads_7d`

---

## 备注

- 若担心 D1 写入成本，可将 events 落 R2，然后定时聚合入 D1；但实现复杂度更高。
- 目前方案优先保证可落地、可扩展、可审计。
