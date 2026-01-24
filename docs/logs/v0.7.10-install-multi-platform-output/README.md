## 迭代：v0.7.10-install-multi-platform-output

### 改了什么
- CLI 安装单技能但多平台时，输出改为平台汇总并列出每个平台安装路径，避免误判只安装到单个平台。
- 被跳过的平台（已安装）在单技能多平台场景下显示平台列表。

### 验证/验收
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- 冒烟：`tmpdir=$(mktemp -d) && SKILD_HOME="$tmpdir" pnpm --filter ./packages/cli start -- install peiiii/skild --skill project-os --all --yes --force && rm -rf "$tmpdir"`  
  观察点：输出包含“Installed project-os → all platforms”以及逐平台路径列表（示例路径前缀：`/var/folders/hr/g7fkvnfx277dtmj2ycn6_gm80000gn/T/tmp.9iervAjP`）。

### 发布/部署
- 组件：`workers/registry`、`apps/console`、`apps/web`、`packages/cli`。
- 迁移：`pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（无迁移变更）。
- 部署：
  - `pnpm deploy:workers` → `registry.skild.sh`（Version ID: `d96bc5bb-e29a-4954-8736-9190d0abb265`）
  - `pnpm deploy:pages` → `https://83ccdfc8.skild-console.pages.dev`、`https://8471e3b1.skild.pages.dev`
- NPM：`pnpm release:version && pnpm release:publish` → `skild@0.10.20`（`@skild/core` 无变更）
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health` → `{ "ok": true }`
  - `curl -fsS "https://registry.skild.sh/discover?limit=1"` → `ok: true` 且有 items
  - `curl -fsS https://hub.skild.sh | head -n 2` → HTML 返回
  - `curl -fsS https://skild.sh | head -n 2` → HTML 返回
  - `npm view skild version` → `0.10.20`
