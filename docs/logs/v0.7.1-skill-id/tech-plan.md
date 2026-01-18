## 迭代：v0.7.1-skill-id

### 方案概述
- 在 `skills` 表新增 `id` 字段并回填历史数据。
- 发布时生成 `id`（`crypto.randomUUID()`），并在 upsert 中保留已有 id。
- `GET /skills`、`GET /publisher/skills`、`GET /skills/:scope/:skill` 返回 `id`。
- `/discover` 与 `/linked-items` cursor 升级为 `v2|...|id`，旧 cursor 兼容解析。
- `GET /skills` 列表标记为 deprecated，引导使用 `/discover`。
- Console API 类型同步 `id` 字段，保持前后端一致。

### 数据库变更
- 新增 migration：`workers/registry/migrations/0012_skill_id.sql`
  - `ALTER TABLE skills ADD COLUMN id TEXT`
  - `UPDATE skills SET id = lower(hex(randomblob(16))) WHERE id IS NULL OR id = ''`
  - `CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_id_unique ON skills(id)`

### 关键实现
- Registry publish：生成 `skillId`，`INSERT INTO skills (id, ...)`，冲突更新时 `id = COALESCE(skills.id, excluded.id)`。
- Registry 查询：skills 列表与详情 SQL 增加 `id` 字段。
- Discover 分页：cursor 使用 `type:source_id` 作为稳定 `id`，排序条件同步更新。
- Linked-items 分页：cursor 使用 `id` 并增加 `v2` 前缀。
- `/skills` 列表返回 `deprecated` 提示。
- Console 类型：`MySkillItem` / `SkillListItem` / `SkillDetail` 增加 `id`。

### 发布/验收
- 迁移（remote）：`pnpm deploy:registry`（自动 migrations apply）。
- 部署：`pnpm deploy:registry`，如需前端同步再执行 `pnpm deploy:console`。
- 线上冒烟：调用 `/skills` 和 `/publisher/skills` 确认 `id` 字段存在。
