# 2026-01-13 线上策略调整：暂时关闭“发布必须邮箱验证”

## 背景

目前线上真实发信链路（MailChannels + DNS 认证）尚未配置完善，导致用户注册后无法可靠收到验证邮件，进而阻塞发布体验。

## 决策

- 保留邮箱验证能力（可选完成），但 **线上暂时不强制**。
- 通过 feature flag 控制，后续发信链路稳定后再逐步开启强制策略。

## 实现

- Registry Worker：
  - `REQUIRE_EMAIL_VERIFICATION_FOR_PUBLISH=false`
  - 未验证邮箱的 publisher 仍可 `publish`，但响应会带 `warnings`
- CLI：
  - `skild publish` 成功后会打印服务端返回的 warnings（如未验证邮箱）
- Console：
  - 文案从“required”调整为“recommended / may be required（取决于服务端策略）”

## 验证

```bash
pnpm build
pnpm lint
pnpm typecheck
```

线上手动验收：

- 未验证邮箱的 publisher `publish` 成功，但能看到 warning
- 若未来打开强制策略，未验证时应返回 `403 Email not verified`

