# 2026-02-04 Hub Core Default Route

## 背景 / 问题

- Hub 默认入口仍指向 Skills 列表，核心领域入口不够显眼

## 决策

- 将 Hub 默认路由重定向到 `/core`

## 变更内容

- 更新首页跳转默认目标为 Core Domains

## 功能说明

- **目标**：进入 hub.skild.sh 时直接看到核心领域页面
- **输入**：访问 `/`
- **输出**：自动重定向到 `/core`
- **默认策略与边界**：
  - 仅变更默认跳转路径

## 使用方式

```bash
# 示例 1：访问默认入口
open https://hub.skild.sh

# 示例 2：直接访问 core
open https://hub.skild.sh/core
```

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# smoke-check（非仓库目录）
tmpdir=$(mktemp -d) \
  && cp -R /Users/peiwang/Projects/skild/apps/console/dist "$tmpdir/dist" \
  && python3 -m http.server --directory "$tmpdir/dist" 8184 >/dev/null 2>&1 & pid=$! \
  && sleep 1 \
  && curl -fsS http://127.0.0.1:8184/ | rg -n "core" \
  && kill "$pid" \
  && rm -rf "$tmpdir"
```

验收点：

- 访问根路径后落到 `/core`

## 发布 / 部署

- Migrations（remote）：
  - `pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（✅ No migrations to apply）
- Deploy：
  - `pnpm deploy:pages`
  - Console: `https://a9a62399.skild-console.pages.dev`
  - Web: `https://29a44fcc.skild.pages.dev`
  - Web (re-deploy): `pnpm -C workers/registry exec wrangler --cwd $(pwd) pages deploy apps/web/dist --project-name=skild --branch main --commit-dirty=true`
  - Web (latest): `https://01be4088.skild.pages.dev`
- 线上冒烟：
  - `curl -fsS https://hub.skild.sh/core` → 返回 HTML（包含 `#root`）
  - `curl -fsS https://hub.skild.sh/data/skills-core-domains.json` → 包含 `Agent Discovery & Automation`
  - `curl -fsS https://skild.sh/` → 返回 HTML
  - `curl -fsS https://skild.sh/data/skills-core-domains.json` → 包含 `Agent Discovery & Automation`

## 影响范围 / 风险

- Breaking change? 否
- 风险：无
- 回滚方式：恢复默认跳转到 `/skills`
