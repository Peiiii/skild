# 2026-01-13 修复：npm 上 `skild@latest` 缺少 `login` / registry 命令

## 问题

用户安装 `skild@latest` 后，发现 CLI 没有 `skild login`（`pnpm dlx skild@latest -- --help` 也只展示 install/list 等早期命令）。

## 根因

- npm 已发布版本 `0.1.3` 的 `dist/index.js` 不包含 registry 相关子命令（属于“发布内容落后于 repo 代码”的问题）。

## 变更

- 为 `packages/cli` / `packages/core` 增加 `prepack` 与 `prepublishOnly`，确保无论是 `npm publish` 还是 Changesets publish 都会先构建最新 `dist/`：
  - `packages/cli/package.json`
  - `packages/core/package.json`
- 新增 changeset，发布一个 patch 版本，确保 npm `latest` 带上 `login/signup/logout/whoami/publish/search`。

## 验证（发布前）

```bash
pnpm build
pnpm lint
pnpm typecheck

# 本地 CLI 应该包含 login
pnpm -s cli -- --help | rg -n "login|signup|publish|search"

# 预检查发布内容（不会真的发布）
pnpm release:dry
```

## 发布（走流程）

```bash
pnpm release:status
pnpm release:version
pnpm release
```

## 验证（发布后）

```bash
npm view skild@latest version
pnpm -s dlx skild@latest -- --help | rg -n "login|signup|publish|search"
pnpm -s dlx skild@latest -- login --help
```

