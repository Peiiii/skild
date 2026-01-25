# v0.7.23-release-0.11.1

## 迭代完成说明
- 发布 CLI：update/uninstall 仅展示已安装的平台，scope 选择移到最后一步并只显示可用 scope
- 对不存在的目标自动跳过，避免误报错误

## 测试/验证/验收方式
- pnpm release:check（结果：通过）
- 冒烟（/tmp，非仓库目录）：
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js install <tmp-skill> --target claude --yes`
  - `SKILD_HOME=<tmp>/home node /Users/tongwenwen/Projects/Peiiii/skild/packages/cli/dist/index.js update smoke-skill --json`

## 发布/部署方式
- NPM：
  - `pnpm changeset version`
  - `pnpm release:publish`
  - 结果：`skild@0.11.1`（`@skild/core` 保持 `0.11.0`）
- Migrations（remote）：
  - `pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote`（✅ No migrations to apply）
- Deploy：
  - `pnpm deploy:registry` → `registry.skild.sh`（Version ID: `362d19ec-1172-4d05-a9db-fed19e7ff066`）
  - `pnpm deploy:pages` → `https://4783edf7.skild-console.pages.dev`、`https://228bbaf6.skild.pages.dev`
- 线上冒烟：
  - `curl -fsS https://registry.skild.sh/health` → `{ "ok": true }`
  - `curl -fsS "https://registry.skild.sh/discover?limit=1"` → `ok: true` 且有 items
  - `curl -fsS https://4783edf7.skild-console.pages.dev` → 返回 HTML
  - `curl -fsS https://228bbaf6.skild.pages.dev` → 返回 HTML
  - `npm view skild version` → `0.11.1`
  - `npm view @skild/core version` → `0.11.0`
