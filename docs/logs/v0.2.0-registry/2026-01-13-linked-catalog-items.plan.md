# 2026-01-13 Iteration Plan：Linked Catalog Items（GitHub 收录条目，非托管）

## 背景 / 问题

我们要在最短时间内冷启动供给侧：市面上大量高质量 Agent Skills 目前托管在 GitHub（官方/社区/公司仓库），把内容“搬运/托管/重新发布”会遇到 license、归属、维护成本和速度问题。

因此需要一种 **不占用作者命名空间、不冒充作者、不改变现有 install 逻辑** 的“收录机制”：

- Registry/Console 提供可搜索、可分享、可运营的条目（Item）
- 用户安装仍走现有：`skild install <github url | shorthand>`（CLI 已支持）
- 该条目没有“作者账号”，只有“添加者/贡献者”（谁提交的）

## 目标（本迭代一次性交付）

- 在 `registry.skild.sh` 引入 `linked_items`（Catalog Items）：
  - Public：列表/搜索/详情（Discover）
  - Authed：新增收录（Submit）
  - 不做 mirror，不生成 tarball，不参与 `@publisher/skill` 包解析（避免争议与复杂度）
- Console 增加 Catalog 页面：
  - 查看热门/最新收录（含 GitHub upstream、安装命令复制）
  - 登录后可提交 GitHub 收录条目
- 数据可追溯：每个条目明确展示 `source`（repo/path/ref/url）+ `submittedBy`（publisher handle）+ `createdAt`

## 非目标（本迭代不做）

- 不把 linked item 变成 registry 包（不提供 `@publisher/skill` 安装）
- 不做内容抓取/校验/镜像（mirror/import pipeline）
- 不做 repo 归属验证（Verified/Unverified）
- 不做审核流/风控（先默认直接发布；后续可加 moderation）
- 不做评分/排序算法（先 latest 优先）

## 核心原则（必须遵守）

- **唯一性**：linked item 是独立对象，不复用/污染 `skills` / `skill_versions` 的语义。
- **UI 不依赖业务逻辑**：Console 页面只做调用 API 与展示；业务规则在 `workers/registry`。
- **不抢占命名空间**：不为 GitHub skill 分配 `@anthropic/*` 等包名，避免归属争议。

## 术语与对象模型

- `Package`：现有 registry 包（`@publisher/skill[@version]`，可安装、可解析）
- `LinkedItem`：新增收录条目（可发现、可分享、可运营；安装通过 GitHub 链接）

## 数据模型（D1）

新增 migration：`workers/registry/migrations/0004_linked_items.sql`

表：`linked_items`

- `id`：UUID（主键）
- `source_provider`：目前仅 `github`
- `source_repo`：`owner/repo`
- `source_path`：repo 内路径（可选，默认 repo root）
- `source_ref`：branch/tag/commit（可选，默认 `main`）
- `source_url`：可选（若用户提供完整 URL，保存以便展示）
- `title`：展示名（必填，<= 80）
- `description`：简介（必填，<= 500）
- `license`：可选（<= 120）
- `tags_json`：JSON array（<= 20 tags）
- `category`：可选（<= 40）
- `submitted_by_publisher_id`：提交者 publisherId（必填）
- `created_at`：ISO string
- `updated_at`：ISO string

唯一性（去重）：

- `(source_provider, source_repo, source_path)` 唯一（同一个 upstream 只出现一次）

## API 设计（Registry）

### Public

- `GET /linked-items?q=&limit=`：搜索/列表（按 `created_at DESC`）
- `GET /linked-items/:id`：详情（返回 `source` + `submittedBy`）

### Authed（Session）

- `POST /linked-items`
  - auth：**session only**（Console 登录态），不允许 publish token（避免把 token 管理能力扩散到脚本侧）
  - body：
    - `source: { provider, repo, path?, ref?, url? }`
    - `title, description, license?, tags?, category?`
  - 返回：创建后的 item

错误约定：

- 409：duplicate upstream
- 400：参数不合法

## Console 设计（apps/console）

路由：

- `/linked`：Catalog 列表（public）
- `/linked/:id`：详情（public）
- `/linked/new`：提交表单（RequireAuth）

页面能力：

- 列表页支持搜索（`q`）与 copy install command
- 详情页展示 upstream repo/path/ref + “submitted by” + tags/category
- 提交页支持填写 GitHub repo/path/ref + title/description/tags

## 验证（必须）

```bash
pnpm lint
pnpm typecheck
pnpm build

# 本地联调冒烟
pnpm dev:smoke
```

验收点：

- Console `/linked` 可加载列表；无 CORS 错误
- 登录后 `/linked/new` 可提交；列表立即可见
- 每个 item 展示 upstream + submittedBy + 安装命令

