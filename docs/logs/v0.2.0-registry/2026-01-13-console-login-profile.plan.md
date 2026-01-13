# 2026-01-13 规划：Skild Console 登录态 + 个人主页（Dashboard / Account）

> 目标：把 `console.skild.sh` 从“无持久登录态的工具页集合”升级为“npm-like 的 Publisher Console”：登录一次即可完成 token 管理、账号信息、发布资产查看与基础治理；同时保持 **业务规则唯一性**（只在 `workers/registry`），UI 只负责展示/交互。

## 1) 背景 / 问题

- 当前 Console MVP（`/signup`, `/token/new`, `/verify-email/*`）是 **stateless**：每次操作都要求输入密码；这会显著降低转化与留存（尤其是 token 管理与后续更多“需要鉴权的操作”）。
- `POST /auth/login` 被用作“创建 publish token”，但缺少：
  - token 列表/撤销/审计
  - 浏览器端安全的长期会话（避免把 publish token 当成 web session）
- Console 需要一个清晰的“个人主页”：用户登录后第一眼看到自己的状态（邮箱是否验证、token 是否存在、已发布 skills、下一步动作）。

## 2) 本阶段目标（终态优先，不考虑成本）

### 产品目标

- Console 支持 **持久登录态**（登录一次 → 关闭浏览器后仍可恢复）
- 提供 **个人主页（Dashboard）**：
  - 当前登录 publisher（handle / email / emailVerified）
  - token 管理入口（列表/创建/撤销）
  - “我发布的 skills” 列表与基础指标（最新更新时间、版本数）
  - 明确下一步：发布指引、邮箱验证、创建 token

### 架构目标（强约束）

- **唯一性**：鉴权/权限/风控等规则只在 `workers/registry` 实现一次；Console 只调用 API。
- **UI 组件不依赖业务逻辑**：`apps/console/src/components/ui/*` 仅做纯展示；业务编排放在 `features/*` 或 `lib/*`。
- “publish token” 与 “console session” **分离**：
  - publish token：给 CLI/CI 用的 bearer token（可撤销，可审计）
  - console session：给浏览器用的 HttpOnly cookie（短期/可刷新/可撤销）

## 3) 非目标（本阶段不做，但预留）

- 组织/团队/权限矩阵（仅个人 publisher）
- 2FA / Passkey（先预留数据模型与 UI 入口）
- OAuth/SSO（GitHub/Google）
- 私有包/付费/配额体系（但 token/audit 的设计要能承载）

## 4) 信息架构（IA）/ 路由规划

### Public（无需登录）

- `/skills`、`/skills/:scope/:skill`（现有）
- `/signup`（现有，注册后可自动登录）
- `/login`（新增）

### Authed（需要登录）

- `/me`：Dashboard（新增，默认落地页）
- `/me/tokens`：Token 管理（新增：列表/创建/撤销）
- `/me/skills`：我的 Skills（新增：列表 + 跳转详情）
- `/me/settings`：账号设置（新增：邮箱验证状态、改密码入口等）
- `/logout`：登出（可作为 action route 或按钮）

路由守卫策略：

- 通过 `AuthProvider` 在应用启动时请求 `/auth/me` 恢复会话
- `RequireAuth` 只做“是否已登录”的判断与跳转，不承载权限逻辑

## 5) 认证方案（推荐终态）

### 5.1 Cookie Session（浏览器）

- `POST /auth/session/login`：email/handle + password 登录
  - 返回：`{ ok: true, publisher }`
  - Side effect：`Set-Cookie: skild_session=<id>.<secret>; HttpOnly; Secure; SameSite=Lax; Path=/; Domain=.skild.sh`
- `POST /auth/session/logout`：撤销当前 session + 清 cookie
- `GET /auth/me`：支持两种鉴权方式（统一返回 publisher）
  1) `Authorization: Bearer <tokenId>.<secret>`（CLI/脚本）
  2) `Cookie: skild_session=...`（Console）

关键收益：

- Console 不需要把任何敏感 token 放在 `localStorage`（降低 XSS 破坏面）
- 可做 session 轮转、风控、设备管理（未来扩展）

### 5.2 CORS + Credentials（必须升级）

- Registry CORS 需要支持 `credentials`：
  - `access-control-allow-origin: <exact origin>`（已有）
  - `access-control-allow-credentials: true`（新增）
  - `OPTIONS` 同样返回 `allow-credentials`
- Console 侧 fetch 统一：`credentials: 'include'`

### 5.3 CSRF 防护（最小可用但可靠）

- 因为是同站点（`*.skild.sh`），Cookie 可使用 `SameSite=Lax`，同时：
  - 对所有 **写** 请求（POST/PUT/PATCH/DELETE）强制校验 `Origin` 在 allowlist（Registry 已有 `isAllowedOrigin`，需要把“允许则写入 header”升级为“写请求不允许则直接拒绝”）
  - 不引入双 token CSRF（未来如需再加）

## 6) API 设计（Console 所需最小闭环）

### 6.1 Session

- `POST /auth/session/login`
- `POST /auth/session/logout`
- `GET /auth/me`（已存在，需要支持 cookie session）

### 6.2 Token 管理（替代用 `/auth/login` 充当“创建 token”）

- `GET /tokens`：列出当前 publisher 的 tokens（不返回 secret）
  - 返回：`[{ id, name, createdAt, lastUsedAt, revokedAt? }]`
- `POST /tokens`：创建 publish token（仅返回一次 secret）
  - 入参：`{ name?: string }`
  - 返回：`{ ok: true, token: "<id>.<secret>", tokenMeta: {...} }`
- `DELETE /tokens/:id`：撤销 token

### 6.3 Publisher / Skills（个人主页数据）

- `GET /publisher/skills`：列出当前 publisher 的 skills
  - 返回：`[{ name, description, updatedAt, versionsCount }]`
- `GET /publisher/stats`（可选）：用于 Dashboard 摘要（发布总数、最近 7 天更新等）

## 7) 数据模型（D1 migrations）

新增 migration：`workers/registry/migrations/0003_console_sessions_and_token_mgmt.sql`

建议新增表：

- `sessions`
  - `id TEXT PRIMARY KEY`
  - `publisher_id TEXT NOT NULL`
  - `session_salt TEXT NOT NULL`
  - `session_hash TEXT NOT NULL`（只存 hash，不存 secret）
  - `created_at TEXT NOT NULL`
  - `expires_at TEXT NOT NULL`
  - `last_seen_at TEXT`
  - `revoked_at TEXT`
  - `ip TEXT`, `user_agent TEXT`（审计/风控）
- `tokens`（现有表增量）
  - 增加：`revoked_at TEXT`（撤销而非硬删）
  - 可选：`last_used_ip TEXT`, `last_used_ua TEXT`

## 8) Console 端代码落点（文件级规划）

> 原则：业务逻辑集中在 `features/*`，页面只做编排，`components/ui` 只做展示。

### 8.1 新增/调整目录

- `apps/console/src/features/auth/`
  - `auth-api.ts`：调用 session endpoints（login/logout/me）
  - `auth-store.tsx`：`AuthProvider` + `useAuth()`
  - `RequireAuth.tsx`：路由守卫组件（只做跳转）
- `apps/console/src/features/tokens/`
  - `tokens-api.ts`：list/create/revoke
- `apps/console/src/features/publisher/`
  - `publisher-api.ts`：`/publisher/skills`、`/publisher/stats`

### 8.2 页面（新增）

- `apps/console/src/ui/pages/LoginPage.tsx`
- `apps/console/src/ui/pages/MePage.tsx`
- `apps/console/src/ui/pages/TokensPage.tsx`
- `apps/console/src/ui/pages/MySkillsPage.tsx`
- `apps/console/src/ui/pages/SettingsPage.tsx`

### 8.3 需要修改的现有文件

- `apps/console/src/router.tsx`
  - 新增 `/login`、`/me/*` 路由
  - 将 `/token/new` 定位为“创建 token 的 legacy 快捷入口”（可重定向到 `/me/tokens/new`）
- `apps/console/src/ui/AppLayout.tsx`
  - TopNav 从“Signup/Token”切换为“Discover/Publish/Dashboard”，右侧展示登录状态（Login 按钮或用户菜单）
- `apps/console/src/lib/http.ts`
  - `fetchJson` 统一加 `credentials: 'include'`（保证 cookie session 生效）

## 9) Registry 端代码落点（文件级规划）

- `workers/registry/src/auth.ts`
  - 抽象为 `requirePublisherAuth()`：支持 Bearer token + cookie session（二选一）
- `workers/registry/src/index.ts`
  - 新增 session/token 管理 endpoints
  - CORS 增加 `access-control-allow-credentials: true`
  - 对写请求做 Origin allowlist 强校验
- `workers/registry/src/db.ts`
  - 增加 sessions CRUD、token list/revoke
- （可选）新增 `workers/registry/src/session.ts`：集中处理 cookie / session 轮转逻辑

## 10) 验证（每阶段至少一次）

### 工程检查

```bash
pnpm build
pnpm lint
pnpm typecheck
```

### 本地联调冒烟（推荐）

```bash
pnpm dev:registry
pnpm dev:console
```

验收点（最小闭环）：

- Console：`/login` 登录成功后可访问 `/me`
- `/me` 能展示 publisher 信息与邮箱验证状态
- `/me/tokens` 可创建 token（只显示一次）+ 列表可见 + 可撤销
- 登出后受保护页面会跳回 `/login`

