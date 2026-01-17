## 迭代：v0.5.1-install-source-fallback

### 改了什么
- 安装别名解析输出默认不展示分支/commit 引用，避免误导。
- 远程安装遇到缺失 ref（could not find commit hash）时自动回退到默认分支拉取。
- 安装记录仍保留原始 source，回退仅影响拉取流程。

### 验证/验收
- `pnpm release:check`（内部执行 `build`/`lint`/`typecheck`）
- 线上验收（发布后）：
  - `npm view skild version --registry=https://registry.npmjs.org/` 输出 `0.5.1`
  - `npm view @skild/core version --registry=https://registry.npmjs.org/` 输出 `0.5.1`

### 发布/部署
- 按 `docs/processes/npm-release-process.md` 执行 changeset -> version -> publish。
- 发布范围：`@skild/core`、`skild`。
- 本次无 migrations，发布后以 npm 线上查询完成闭环。
- 已完成：changeset、`pnpm release:version`、`pnpm release:publish`。

### 影响范围 / 风险
- Breaking change：否。
- 风险：回退后可能使用默认分支而非指定 ref；作为兜底仅在 ref 缺失时触发。
