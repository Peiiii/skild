# v0.7.21-release-0.11.0

## 迭代完成说明
- 发布 CLI/Core：update/uninstall 平台+作用域交互、Git 拉取路径与 add-skill 对齐并保留 fallback
- 补齐“完成所有/完成全部”发布闭环的强制规则

## 测试/验证/验收方式
- pnpm release:check（结果：通过）
- 冒烟（/tmp，GitHub 公共 repo install）：
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install https://github.com/anthropics/skills/tree/main/skills/pdf --target claude --yes`

## 发布/部署方式
- NPM：
  - `pnpm changeset version`
  - `pnpm release:publish`
  - 结果：`skild@0.11.0`、`@skild/core@0.11.0`
- Migrations（remote）：
  - `pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（✅ No migrations to apply）
- Deploy：
  - `pnpm deploy:registry` → `registry.skild.sh`（Version ID: `2ea836a0-cb8c-4b0f-91ba-57d7d4c2e475`）
  - `pnpm deploy:pages` → `https://2dca9d84.skild-console.pages.dev`、`https://5a561585.skild.pages.dev`
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health` → `{ "ok": true }`
  - `curl -fsS "https://registry.skild.sh/discover?limit=1"` → `ok: true` 且有 items
  - `curl -fsS https://2dca9d84.skild-console.pages.dev` → 返回 HTML
  - `curl -fsS https://5a561585.skild.pages.dev` → 返回 HTML
  - `npm view skild version` → `0.11.0`
  - `npm view @skild/core version` → `0.11.0`
