# Tier 1 数据驱动 - 前端对接交接文档

> 适用版本：v0.3.0
> 目标：前端基于新统计接口完成 Discover/详情页/排行榜展示

---

## 1) 基础信息

- Registry base: `https://registry.skild.sh`
- Console base: `https://console.skild.sh`
- 统一实体：
  - `registry`：`@scope/name`（skills）
  - `linked`：`linked_items.id`

---

## 2) Discover 列表（混合 registry + linked）

### 请求
`GET /discover?sort=updated|new|downloads_7d|downloads_30d&q=&cursor=&limit=`

- `sort` 默认 `updated`
- `limit` 默认 20
- `cursor` 为后端生成的 opaque 字符串，前端只透传

### 返回（示例）
```json
{
  "ok": true,
  "items": [
    {
      "type": "registry",
      "sourceId": "@scope/name",
      "title": "@scope/name",
      "description": "...",
      "tags": [],
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
      "description": "...",
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

### 前端要点
- 跳转：
  - `registry` -> `/skills/:scope/:skill`（用 `sourceId` 拆解）
  - `linked` -> `/linked/:id`（用 `sourceId`）
- 复制安装命令：直接使用 `install` 字段
- 热度展示：
  - 列表页用 `downloadsTotal` 或 `downloads7d`/`downloads30d`
- 时间展示：`discoverAt`（最近更新排序）、`createdAt`（新上架排序）

---

## 3) 详情页统计（趋势 + 总量）

### Registry skill
`GET /stats/registry/:scope/:skill?window=7d|30d|90d|180d`

### Linked item
`GET /stats/linked-items/:id?window=7d|30d|90d|180d`

### 返回
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

### 前端要点
- `trend` 已由后端补齐缺失天（不会缺 day）
- `total` 用于详情页 “下载次数”
- `window` 默认 30d，可前端切换口径

---

## 4) 排行榜

### 请求
`GET /leaderboard?type=all|registry|linked&period=7d|30d|90d&limit=20`

### 返回
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

### 前端要点
- 按 `downloads` 排序，直接渲染
- `install` 直接用于复制
- `type/sourceId` 用于跳转

---

## 5) 错误处理

- 错误结构统一：`{ ok: false, error: string }`
- 分页结束：`nextCursor` 为 `null`

---

## 6) 注意事项

- **前端不负责上报下载**；安装成功时由 CLI 自动调用 `/stats/downloads`
- 若 `downloads*` 字段缺失/为 0，应正常显示 `0`
- 所有时间字段为 ISO 字符串（UTC）

---

## 7) 快速验证（后端已上线）

```bash
curl -s "https://registry.skild.sh/discover?limit=1&sort=downloads_7d"
curl -s "https://registry.skild.sh/stats/linked-items/<id>?window=7d"
curl -s "https://registry.skild.sh/leaderboard?type=all&period=7d&limit=10"
```
