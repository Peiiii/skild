# 2026-01-13 Console：根目录一键启动与 Cloudflare Pages 部署

## 背景 / 问题

- Console 需要像 npmjs.com 一样成为平台入口，必须可从根目录一键启动与部署
- 部署目标：Cloudflare Pages（后续手动绑定 `skild.sh` 子域名）

## 变更内容

- 根目录新增脚本：
  - `pnpm dev:console`：启动 `apps/console`
  - `pnpm build:console`：构建 `apps/console`
  - `pnpm preview:console`：本地预览
  - `pnpm deploy:console`：构建并部署到 Cloudflare Pages（自动尝试创建 Pages project）
- 部署脚本：
  - `scripts/deploy/console-pages.mjs`
- registry CORS 允许 Pages 域名（用于未绑定自定义域名前的访问）：
  - `https://skild-console.pages.dev`

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

pnpm dev:console
pnpm build:console
```

验收点：

- 根目录运行 `pnpm dev:console` 能启动 console
- `pnpm build:console` 成功产出 `apps/console/dist`

## 部署 / 发布（Cloudflare Pages）

```bash
pnpm deploy:console
```

可选环境变量：

- `SKILD_CONSOLE_PAGES_PROJECT`（默认：`skild-console`）
- `SKILD_CONSOLE_PAGES_BRANCH`（默认：`main`）

验收点：

- Pages 上出现 project：`skild-console`
- 访问 `https://skild-console.pages.dev` 能打开页面（之后你再绑定 `console.skild.sh`）
