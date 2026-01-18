## 迭代：v0.7.1-skill-id

### 背景
前端获取 skills 列表时缺少稳定的 `id` 字段，导致渲染/交互依赖受阻。

### 目标
- 后端为每个 skill 提供稳定的 `id` 字段。
- 现有数据完成回填，新发布的 skill 自动生成 id。
- API 输出统一包含 `id`（skills 列表、publisher skills、skill detail）。
- 列表分页 cursor 统一使用 `id` 作为稳定锚点。
- `/skills` 列表接口标记为 deprecated，避免与 `/discover` 混用。

### 非目标
- 不引入 skill 重命名能力。
- 不调整 discover_items 的 source_id 语义。

### 交付范围
- Registry 数据结构 + API 输出。
- Console 类型定义同步。
