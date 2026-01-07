# 2026-01-08 Release 流程升级：Changesets

## 背景

项目进入多包（`@skild/core` + `skild`）阶段后，发布需要：

- 版本一致/可追溯（避免手动改版本遗漏）
- 按依赖顺序发布（先 core 后 cli）
- 一键发布（根目录 `pnpm release:*`）

## 方案

采用 Changesets（monorepo 版本管理与发布最佳实践）：

- `.changeset/`：变更集（每次变更写一条），用于自动生成版本与 changelog
- 根目录提供稳定脚本：`release:check / release:version / release / release:dry`
- 删除“按版本加命令”的做法（例如 `release:v0.1`）

## 新增/变更内容

- 新增 `@changesets/cli`（root devDependency）
- 新增 `.changeset/config.json`（linked packages：`@skild/core` 与 `skild` 同步版本）
- 更新根 `package.json` scripts：
  - `pnpm release:check`：build + lint + typecheck
  - `pnpm release:version`：`changeset version`
  - `pnpm release`：`release:check` 后 `changeset publish`
  - `pnpm release:dry`：发布演练（npm dry-run，不触发真实 publish）
- 文档：新增 `docs/release.md`

## 2FA / OTP 说明

如果 npm 账号开启了 “Authorization and writes”，发布时（`changeset publish` / `npm publish`）会要求输入一次性验证码（OTP）。

- 本地发布：按提示输入 OTP，或执行 `pnpm release -- --otp=123456`
- CI 发布：建议把 npm 2FA 调整为 “Authorization only”，并使用 automation token（`NPM_TOKEN`）

## 验证

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm release:dry
```
