## 迭代：v0.5.2-alias-spec-sanitize

### 改了什么
- registry alias 返回的 spec 若带引号，客户端自动去除，避免解析异常。
- 保持 alias 解析展示不透出分支/commit（之前约定）。

### 验证/验收
- `pnpm release:check`（内部执行 `build`/`lint`/`typecheck`）
- 冒烟：`SKILD_HOME=/tmp/skild-smoke pnpm -s cli -- install ralph --yes --target claude`
- 线上验收（发布后）：
  - `npm view skild version --registry=https://registry.npmjs.org/` 输出 `0.5.2`
  - `npm view @skild/core version --registry=https://registry.npmjs.org/` 输出 `0.5.2`

### 发布/部署
- 按 `docs/processes/npm-release-process.md` 执行 changeset -> version -> publish。
- 发布范围：`@skild/core`、`skild`。
- 本次无 migrations，发布后以 npm 线上查询完成闭环。
- 已完成：changeset、`pnpm release:version`、`pnpm release:publish`。
