# v0.11.6-unified-index

## 迭代完成说明

- `/discover` 统一为唯一对外索引：registry + linked + auto catalog 都在一个列表里。
- Discover 页展示 catalog 项（含分类/风险/标签），不再需要单独在导航里出现 Catalog。
- Catalog 详情页仍可作为详情入口（从 Discover 跳转）。
- CLI `skild search` 直接查询 `/discover`，与网页索引一致。

## 测试 / 验证 / 验收方式

- `pnpm release:check`

验收点：

- `/discover` 返回 `type=catalog` 的结果。
- Discover 页可见 catalog 项并能跳转到 `/catalog/:id` 详情页。

## 发布 / 部署方式

后端 + Console 变更，按闭环执行：

```bash
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote
pnpm deploy:registry
pnpm deploy:console

# 线上冒烟：取一条 catalog skill，再用 /discover 验证 catalog 合流
node -e "(async()=>{const fetch=globalThis.fetch;const cat=await (await fetch('https://registry.skild.sh/catalog/skills?limit=1')).json();const item=cat.items?.[0];if(!item){throw new Error('no catalog items');}const q=encodeURIComponent(item.repo);const disc=await (await fetch('https://registry.skild.sh/discover?q='+q+'&limit=20')).json();const ok=(disc.items||[]).some(r=>r.type==='catalog');if(!ok){throw new Error('catalog not in discover');}console.log('discover unified ok');})();"
```

npm 包发布（CLI 搜索一致性）：

```bash
pnpm release:version
pnpm release:publish
```
