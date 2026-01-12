# 2026-01-12 Registry：Worker 目录调整 + 线上部署修复

## 背景 / 问题

- registry 是 Cloudflare Worker，放在 `apps/` 会让语义混乱（`apps/` 更适合前端/产品应用）
- 线上部署后 `POST /auth/signup` 失败：Workers WebCrypto PBKDF2 存在 iteration 上限，原配置 `120000` 导致报错

## 决策

- 将 registry 从 `apps/registry` 挪到 `workers/registry`（后续 registry 的前端页面再放到 `apps/`）
- PBKDF2 iterations 采用 Workers 支持的上限：`100000`

## 变更内容

- 目录结构：
  - `apps/registry` → `workers/registry`
- Workspace 配置：
  - `pnpm-workspace.yaml` 新增 `workers/*`
  - 根 `package.json` 的 `build/clean` 覆盖 `workers/*`
- 线上可用性修复：
  - `workers/registry/wrangler.toml`：`PBKDF2_ITERATIONS=100000`
  - `workers/registry/src/index.ts`、`workers/registry/src/auth.ts`：默认 iterations 改为 `100000`
- Cloudflare：
  - 已创建并绑定 D1：`skild-registry`
  - 已创建并绑定 R2：`skild-registry-artifacts`

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

BASE="https://skild-registry.15353764479037.workers.dev"
curl -fsS "$BASE/health"

HANDLE="acme$(date +%s)"
EMAIL="$HANDLE@example.com"
PASSWORD="pass1234!"

curl -fsS -X POST "$BASE/auth/signup" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"handle\":\"$HANDLE\",\"password\":\"$PASSWORD\"}"

TOKEN_JSON=$(curl -fsS -X POST "$BASE/auth/login" \
  -H "content-type: application/json" \
  -d "{\"handleOrEmail\":\"$HANDLE\",\"password\":\"$PASSWORD\"}")
TOKEN=$(node -p "JSON.parse(process.argv[1]).token" "$TOKEN_JSON")

curl -fsS "$BASE/auth/me" -H "authorization: Bearer $TOKEN"
```

验收点：

- `POST /auth/signup` 不再返回 PBKDF2 iterations 上限错误
- `POST /auth/login` 返回 `token`，`GET /auth/me` 返回当前 publisher

## 发布 / 部署（Cloudflare Workers + D1 + R2）

```bash
# 迁移（远端 D1）
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote

# 部署 Worker
pnpm -C workers/registry exec wrangler deploy
```

备注：

- 自定义域名（推荐，对外入口）：`https://registry.skild.sh`
- Worker URL（Cloudflare 默认域名，可能关闭）：`https://skild-registry.15353764479037.workers.dev`
- 若要自定义域名/路由，再追加 `wrangler.toml` 的 routes 配置即可

快速验证：

```bash
curl -fsS https://registry.skild.sh/health
```
