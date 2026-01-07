# 2026-01-08 Release：用 `NPM_TOKEN` 彻底消除 OTP/浏览器交互

## 背景

使用 Changesets 后，`pnpm release` 底层会调用 `changeset publish` → `npm publish`。

当 npm 账号开启 2FA 且模式为 “Authorization and writes” 时，`npm publish` 默认会弹出 OTP 输入提示（TOTP）。
在非交互/无 TTY 环境下，这会直接卡住发布流程。

## 目标

- 发布必须是无交互的（本地/CI 都可）
- 不依赖浏览器打开链接或 OTP 输入
- Token 不落库、不进 git（只走环境变量）

## 方案

1) 新增 `.npmrc.publish`（专用于发布）从环境变量读取 token：

- `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`

2) 将 `pnpm release` 改为脚本驱动，并加入发布前置校验（fail-fast）：

- `scripts/release/ensure-npm-auth.mjs`：
  - 有 `NPM_TOKEN` 则直接放行
  - 没 token 时检查 `npm whoami` 与 2FA 模式，避免发布时卡在 OTP prompt
- `scripts/release/publish.mjs`：
  - 先跑 `release:check`（build + lint + typecheck）
  - 再执行 `changeset publish`，并支持透传 `--otp`
  - 当存在 `NPM_TOKEN` 时，自动设置 `NPM_CONFIG_USERCONFIG=.npmrc.publish`（避免 pnpm 在日常命令中读取 `${NPM_TOKEN}` 产生噪音）

## 使用方式

推荐：npm 网站创建 **Automation Token**，本地仅需：

```bash
export NPM_TOKEN="..."
pnpm release
```

如果你确实有 OTP（不推荐依赖）：也可以透传：

```bash
pnpm release -- --otp=123456
```

## 备注

- 如果 token 曾经泄漏/发到聊天里：请立刻在 npm 上 revoke 并重建。
