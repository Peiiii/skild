# 2026-01-13 Publisher Console MVP：端到端实现（React + Vite + TS + Tailwind + shadcn/ui）

## 背景 / 目标

- 对标 npm 的平台形态：注册/发 token/发现/详情/发布指引需要 Web Console 承载
- 先做“能用”的框架与端到端闭环，UI 细节后续再由其它 AI 优化

## 变更内容

### Web Console（`apps/console`）

- 技术栈：React + Vite + TypeScript + TailwindCSS + shadcn/ui
- 路由：`react-router-dom`
- 页面（MVP）：
  - `/signup`：注册 publisher
  - `/token/new`：创建 token（复用 `POST /auth/login`）
  - `/skills`：搜索列表（复用 `GET /skills`）
  - `/skills/:scope/:skill`：详情页（复用 `GET /skills/:scope/:skill`）
  - `/publish`：发布指引页
- 约束：
  - 不新增登录态/会话系统（token 仅页面内显示一次）
  - Web 不承载业务规则，只调用 registry API
  - TypeScript `strict`，不使用 `any`

### Registry API（`workers/registry`）

- 增加最小 CORS：
  - 允许 `https://skild.sh` / `https://www.skild.sh` / `https://console.skild.sh`
  - 允许本地开发：`http://localhost:5173`
  - 支持 `OPTIONS` 预检

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# 1) 启动 Console（默认走 https://registry.skild.sh）
pnpm dev:console

# 可选：本地 registry dev（如需）
# pnpm -C workers/registry wrangler dev src/index.ts --local --port 18787 --persist-to .wrangler/state
# 然后在 console 里用：VITE_REGISTRY_URL=http://127.0.0.1:18787
```

验收点：

- 浏览器打开 `http://localhost:5173` 能看到页面，并能完成：
  - Signup → Token → Skills Search → Skill Detail
- 浏览器 Network 面板无 CORS 报错

## 部署 / 发布

```bash
# 1) 部署 registry（CORS 生效）
pnpm -C workers/registry wrangler deploy

# 2) 部署 console 到 Cloudflare Pages
pnpm deploy:console
```

域名（你后续手动配置）：

- Pages project（默认）：`skild-console`
- 绑定：`console.skild.sh`
- registry CORS 已允许：
  - `https://console.skild.sh`
  - `https://skild-console.pages.dev`
