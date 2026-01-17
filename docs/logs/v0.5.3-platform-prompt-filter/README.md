## 迭代：v0.5.3-platform-prompt-filter

### 改了什么
- `skild install` 平台选择仅展示本地已有安装的平台；若本地无任何安装平台，回退展示全部平台。
- 平台选择 UI 仍保持通用，仅接收上层传入的平台列表。

### 验证/验收
- `pnpm release:check`（内部执行 `build`/`lint`/`typecheck`）
- 冒烟：`SKILD_HOME=/tmp/skild-smoke pnpm -s cli -- install ralph --yes --target claude`
- 线上验收（发布后）：
  - `npm view skild version --registry=https://registry.npmjs.org/` 输出 `0.5.3`
  - `npm view @skild/core version --registry=https://registry.npmjs.org/` 输出 `0.5.3`

### 发布/部署
- 按 `docs/processes/npm-release-process.md` 执行 changeset -> version -> publish。
- 发布范围：`skild`（`@skild/core` 本次无变更，未发布）。
- 本次无 migrations，发布后以 npm 线上查询完成闭环。
- 已完成：changeset、`pnpm release:version`、`pnpm release:publish`。
