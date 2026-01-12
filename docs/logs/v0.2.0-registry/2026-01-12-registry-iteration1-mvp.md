# 2026-01-12 v0.2 Iteration 1：纯托管 Registry MVP（Cloudflare Workers + D1 + R2）

## 背景 / 问题

- skills 生态爆发，但分发缺少统一平台；目前主要靠 GitHub 链接分散传播
- 我们需要一个“npm-like”的托管分发平台：可发布、可安装、多版本、可复现
- 本次迭代不与 GitHub 身份体系绑定（先把 registry 核心闭环做稳）

## 决策

- 公网 API 资源命名使用 `/skills`（领域语言一致）
- 支持多版本与 dist-tags（至少 `latest`）
- Cloudflare 成本策略：R2 content-addressed（按 `integrity` key 去重）+ tarball 强缓存
- Auth 先做 skild 自有账号（email/handle/password）+ publish token（不依赖 GitHub）
- 安装目录名与显示名解耦：安装用 filesystem-safe（`publisher__skill`），展示/输入用 `@publisher/skill`

## 变更内容

### Registry（`workers/registry`）

- 新增 Cloudflare Worker registry（Hono）
- D1 schema + migrations：publisher/token/skill/version/dist-tags
- R2 artifact 存储：以 `sha256/<integrity>.tgz` 为 key（不可变 + 去重）
- API：
  - `POST /auth/signup`
  - `POST /auth/login`（返回 publish token）
  - `GET /auth/me`
  - `GET /skills`
  - `GET /skills/:scope/:skill`
  - `GET /skills/:scope/:skill/versions/:versionOrTag`
  - `GET /skills/:scope/:skill/versions/:version/tarball`
  - `POST /skills/:scope/:skill/publish`

### Core/CLI（`packages/core` + `packages/cli`）

- core 新增 registry 安装能力：`installRegistrySkill`（下载 tarball → 校验 integrity → 解压 → 原子安装）
- 安装记录新增 `canonicalName`（用于 list/info 的展示与 `@publisher/skill` 输入）
- CLI 新增：
  - `skild signup/login/logout/whoami`
  - `skild publish`
  - `skild install @publisher/skill[@version] --registry <url>`
  - 说明：`skild publish` 不使用 `--version`（会与 CLI 自身版本参数冲突），如需覆盖版本请用 `--skill-version`

## 验证（怎么确认符合预期）

代码级验证（必须）：

```bash
pnpm build
pnpm lint
pnpm typecheck
```

行为 smoke-check（本地跑 registry）：

```bash
# 1) 启动 registry（local dev：D1/R2 都走本地 .wrangler/state）
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --local
pnpm -C workers/registry exec wrangler dev src/index.ts --local --port 18787 --persist-to .wrangler/state

# 2) 创建账号并登录（获得 publish token）
pnpm -s cli signup --registry http://127.0.0.1:18787 --email you@example.com --handle acme --password '...'
pnpm -s cli login --registry http://127.0.0.1:18787 --handle-or-email acme --password '...'
pnpm -s cli whoami

# 3) 发布一个 Skill（要求 SKILL.md frontmatter.name 为 @acme/<skill>，且包含 version）
pnpm -s cli publish --registry http://127.0.0.1:18787 --dir ./examples/hello-skill --name @acme/hello-skill --skill-version 0.0.1

# 4) 从 registry 安装（latest / 指定版本）
pnpm -s cli install @acme/hello-skill --registry http://127.0.0.1:18787 -t codex --local
pnpm -s cli list -t codex --local
```

验收点：

- `publish` 成功返回 `version + integrity`
- `install @acme/hello-skill` 安装成功，`list` 显示 `@acme/hello-skill`（而非 `acme__hello-skill`）

## 发布 / 部署（Cloudflare）

前置条件：

- Cloudflare 账号 + wrangler 已登录（或使用 API token）
- 创建 D1 database + R2 bucket，并写入 `workers/registry/wrangler.toml`

步骤：

```bash
# 创建资源（示例，按你实际命名）
pnpm -C workers/registry exec wrangler d1 create skild-registry
pnpm -C workers/registry exec wrangler r2 bucket create skild-registry-artifacts

# 迁移
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry

# 部署
pnpm -C workers/registry exec wrangler deploy
```

备注：

- npm 包发布（CLI/core）沿用 `pnpm release`；registry/web 的部署不要混进 npm publish 流程
