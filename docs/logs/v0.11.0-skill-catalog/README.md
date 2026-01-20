# v0.11.0-skill-catalog

## 方案文档

- `docs/plans/2026-01-19-skill-catalog-design.md`

## 迭代完成说明

- 新增 Catalog 数据模型与扫描状态表，支持大规模 GitHub 仓库索引落库。
- Registry Worker 新增 Catalog API（列表/详情/仓库视角）与 Admin 扫描入口。
- 新增 R2 快照存储（SKILL.md/README/meta.json），便于前端快速展示。
- Console 新增 Auto Catalog 页面与详情页，支持搜索与安装命令复制。
- Console Catalog 页面展示线上结果总量。
- Console 支持分类浏览：分类入口 + 独立路由。
- 新增脚本 `scripts/catalog/build-repo-index.mjs`，用于生成 repo-index 分片。
- 扫描任务支持开关与限额配置，优先 catalog 扫描并降低 GitHub API 资源占用。
- 修复 frontmatter 解析，支持 `description: |`/`>` 多行描述。
- 新增 Admin 重置扫描游标接口，支持全量回扫。
- 新增未变更仓库跳过扫描（基于 pushed_at + TTL），减少重复请求。
- 增加分类模型与 API（category 列表/筛选）。
- 新增 AI 自动打标：后台定时补齐缺失分类并记录 model/digest，允许 AI 生成新分类并持久化。
- Catalog 前端区分展示 Category / Risk / Tags，避免混淆。
- Admin 打标接口支持 force/repo/skillId 精准回补或重打标。
- force 模式允许覆盖已有分类，便于纠正误标。
- 补充 Blockchain 分类，提升垂直领域识别准确性。
- Blockchain 关键词做兜底归类，避免 AI 误判。
- 定时任务会在缺失分类处理完后，逐步重打标 `other`，降低泛化比例。
- 扫描流程不再依赖规则归类，避免覆盖已打标分类。

## 测试 / 验证 / 验收方式

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## 发布 / 部署方式

- 远程迁移：`pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry`
- 发布 Registry Worker：`pnpm deploy:registry`
- 发布 Console：`pnpm deploy:console`
