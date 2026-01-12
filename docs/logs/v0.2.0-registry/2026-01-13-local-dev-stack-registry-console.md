# 2026-01-13 DX：`pnpm dev` 一键启动 registry + console（本地联合调试）

## 目标

- `pnpm dev` 在根目录一键启动：
  - Registry Worker（wrangler local dev）
  - Publisher Console（Vite dev server）
- Console 默认指向本地 registry，便于端到端联合调试（signup/login/verify/publish/search）

## 变更

- 根脚本：
  - `pnpm dev`：自动选择可用端口并一键启动本地 registry + console（避免端口占用导致启动失败）
  - `pnpm dev:smoke`：启动并等待 `/health` 与页面就绪后自动退出（用于验证脚本可用）
  - `pnpm dev:registry`：固定端口 `18787` 启动本地 worker（适合手动调试）
  - `pnpm dev:console`：固定端口 `5173` 启动 Console（并默认指向 `http://127.0.0.1:18787`）
- 本地联调时，wrangler 通过 `--var` 注入变量（不再依赖 `wrangler.toml` 的 env 继承）：
  - `EMAIL_MODE=log`（本地不发真实邮件，只在日志里输出验证链接）
  - `CONSOLE_PUBLIC_URL=http://localhost:<port>`（验证链接回到本地 Console）
  - `REGISTRY_PUBLIC_URL=http://127.0.0.1:<port>`

## 验证

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck

# 启动联调（会打印实际端口）
pnpm dev

# 或快速 smoke（启动就绪后自动退出）
pnpm dev:smoke
```

手动验收（本地）：

1) `pnpm dev`
2) 打开 `http://localhost:5173`
3) Signup → Verify Email（查看 worker 日志中的链接）→ Token → Publish

可选：固定端口（当你希望 console 的 URL 固定在 5173，或希望 registry 固定在 18787）：

```bash
SKILD_CONSOLE_PORT=5173 SKILD_REGISTRY_PORT=18787 pnpm dev
```
