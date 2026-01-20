# v0.11.0-skill-catalog

## 方案文档

- `docs/plans/2026-01-19-skill-catalog-design.md`

## 迭代完成说明

- 新增 Catalog 数据模型与扫描状态表，支持大规模 GitHub 仓库索引落库。
- Registry Worker 新增 Catalog API（列表/详情/仓库视角）与 Admin 扫描入口。
- 新增 R2 快照存储（SKILL.md/README/meta.json），便于前端快速展示。
- Console 新增 Auto Catalog 页面与详情页，支持搜索与安装命令复制。
- Console Catalog 页面展示线上结果总量。
- 新增脚本 `scripts/catalog/build-repo-index.mjs`，用于生成 repo-index 分片。
- 扫描任务支持开关与限额配置，优先 catalog 扫描并降低 GitHub API 资源占用。

## 测试 / 验证 / 验收方式

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## 发布 / 部署方式

- 远程迁移：`pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry`
- 发布 Registry Worker：`pnpm deploy:registry`
- 发布 Console：`pnpm deploy:console`
