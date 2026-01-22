# v0.11.7-unified-entry

## 迭代完成说明

- 发现页统一为单入口（Discover），技能与 Skillsets 通过同一页面切换。
- `/catalog` 与 `/catalog/category` 重定向到 Discover，分类筛选用 `category` 参数完成。
- Discover 列表支持按 `category` 过滤，并保留 catalog 详情页作为子页面。

## 测试 / 验证 / 验收方式

- `pnpm release:check`

验收点：

- 顶部导航仅保留 Discover 入口。
- `/skills?type=skillset` 能显示 Skillsets 视图。
- `/skills?category=<id>` 能过滤出对应分类的 catalog 技能。

## 发布 / 部署方式

后端 + Console 变更，按闭环执行：

```bash
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote
pnpm deploy:registry
pnpm deploy:console

# 线上冒烟
curl -fsS "https://registry.skild.sh/discover?category=testing&limit=5" | jq -e '.items[0].type == "catalog"'
```
