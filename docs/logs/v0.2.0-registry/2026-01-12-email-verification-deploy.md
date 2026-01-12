# 2026-01-12 部署：Email Verification + publish gate（registry + console）

## 本次变更上线范围

- Registry（Cloudflare Workers）：邮箱验证接口 + `publish` 前置校验（未验证邮箱直接 403）
- Console（Cloudflare Pages）：新增 `/verify-email` 与 `/verify-email/request` 页面

## 部署步骤（实际执行）

```bash
# 1) D1 远端迁移（必须先做）
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote

# 2) 部署 Worker
pnpm -C workers/registry exec wrangler deploy

# 3) 部署 Console（Pages）
pnpm deploy:console
```

本次 Pages 部署输出：

- `https://bdcbe49d.skild-console.pages.dev`

## 关键修复：Pages 预览域名 CORS

Cloudflare Pages 每次部署会生成一个带 hash 的预览域名（例如 `https://bdcbe49d.skild-console.pages.dev`）。

如果 registry 只允许 `https://skild-console.pages.dev`，那么在预览域名上会触发 CORS 预检失败。

本次已在 registry CORS 中允许：

- `https://skild-console.pages.dev`
- `https://*.skild-console.pages.dev`

## 验证（线上 smoke check）

```bash
curl -fsS https://registry.skild.sh/health

# CORS preflight should return allow-origin for the Pages preview domain
curl -sS -X OPTIONS https://registry.skild.sh/auth/signup \
  -H 'Origin: https://bdcbe49d.skild-console.pages.dev' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type, authorization' \
  -D - -o /dev/null
```

## 注意事项

- 邮箱发送目前走 MailChannels（`EMAIL_MODE=mailchannels`）。如遇发送失败，需要在 Cloudflare/域名侧完成对应的发信配置后才会 “sent=true”。

