# 2026-01-13 Linked Catalog Items：端到端实现（Registry + Console）

## 背景 / 目标

为了快速冷启动供给侧，我们引入“GitHub 收录条目（LinkedItem）”：

- 平台提供可发现/可运营的 catalog item
- 安装仍走现有 CLI GitHub 安装能力（URL / shorthand），不把它伪装成 `@publisher/skill`
- 条目没有“作者账号”，只有“提交者/贡献者”（publisher）

## 变更内容

### Registry（`workers/registry`）

- D1 migration：
  - `workers/registry/migrations/0004_linked_items.sql`：新增 `linked_items` 表（index-only）
- 新增模块：
  - `workers/registry/src/linked-items.ts`：linked item 的校验、去重、DB 读写、install command 生成
- 新增 API：
  - `GET /linked-items?q=&limit=`：公共列表/搜索
  - `GET /linked-items/:id`：公共详情（包含 `install` 命令）
  - `POST /linked-items`：提交收录（session-only；记录 `submittedBy`）

### Console（`apps/console`）

- 新增页面：
  - `apps/console/src/ui/pages/LinkedItemsPage.tsx`：Catalog 列表 + 搜索 + 复制安装命令
  - `apps/console/src/ui/pages/LinkedItemDetailPage.tsx`：详情页（upstream + submittedBy + install）
  - `apps/console/src/ui/pages/LinkedItemNewPage.tsx`：提交表单（RequireAuth）
- 路由：
  - `apps/console/src/router.tsx`：新增 `/linked`、`/linked/:id`、`/linked/new`
- 导航：
  - `apps/console/src/ui/AppLayout.tsx`：新增 `Catalog` 入口
- API client：
  - `apps/console/src/lib/api.ts`、`apps/console/src/lib/api-types.ts`：新增 linked-items 调用与类型

## 验证

```bash
pnpm lint
pnpm typecheck
pnpm build

# 本地联合冒烟（会自动跑 D1 migrations apply --local）
pnpm dev:smoke
```

验收点：

- Console `/linked` 能加载列表并复制 `skild install https://github.com/...` 命令
- 登录后 `/linked/new` 提交成功后跳转详情页
- Registry API 无 CORS 报错（console origin 可正常请求）

## 后续优化（不在本迭代）

- 审核/风控：pending/rejected 状态、速率限制、举报/下架
- 去重增强：支持把 GitHub URL/short-hand normalize 成同一个 upstream key
- 自动补全 metadata：抓取 GitHub README/SKILL.md frontmatter（title/description/license）
- Verified：repo 文件证明或 GitHub OAuth/App，区分作者/贡献者
- Claim：作者认领后绑定到正式 `@publisher/skill` 包，并提供重定向/别名

