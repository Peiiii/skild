# 2026-01-13 DX：`pnpm dev` 一键启动 registry + console（本地联合调试）

## 目标

- `pnpm dev` 在根目录一键启动：
  - Registry Worker（wrangler local dev）
  - Publisher Console（Vite dev server）
- Console 默认指向本地 registry，便于端到端联合调试（signup/login/verify/publish/search）

## 变更

- 根脚本：
  - `pnpm dev`：并行启动 `dev:registry` + `dev:console`
  - `pnpm dev:registry`：`wrangler dev --env local --local --port 18787 --persist-to .wrangler/state`
  - `pnpm dev:console`：自动注入 `VITE_REGISTRY_URL=http://127.0.0.1:18787`
- `workers/registry/wrangler.toml` 增加 `env.local`：
  - `EMAIL_MODE=log`（本地不发真实邮件，只在日志里输出验证链接）
  - `CONSOLE_PUBLIC_URL=http://localhost:5173`（验证链接回到本地 Console）
  - `REGISTRY_PUBLIC_URL=http://127.0.0.1:18787`

## 验证

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
```

手动验收（本地）：

1) `pnpm dev`
2) 打开 `http://localhost:5173`
3) Signup → Verify Email（查看 worker 日志中的链接）→ Token → Publish
