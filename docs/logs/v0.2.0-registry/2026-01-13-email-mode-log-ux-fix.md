# 2026-01-13 修复：本地 `EMAIL_MODE=log` 误导为“已发送邮件”

## 问题

在本地联调（`pnpm dev`）时，registry 使用 `EMAIL_MODE=log`：

- 不会真实发送邮件
- 只会在 worker 日志中输出验证链接

但 Console/CLI 之前会提示 “We sent you a verification email / Verification email sent”，导致用户以为收不到邮件是 bug。

## 变更

- Registry API 的 `verification.sent` 语义调整为：**是否真实向邮件服务投递**（`EMAIL_MODE=log` 时为 `false`）
- Console/CLI 根据 `verification.mode` 做文案区分：
  - `mode=log` → 明确提示去看 registry dev 日志

## 验证

```bash
pnpm build
pnpm lint
pnpm typecheck

# 启动联调后，在 Console Signup 会看到 dev-mode 提示
pnpm dev
```

