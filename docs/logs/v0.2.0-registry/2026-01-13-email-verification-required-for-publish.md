# 2026-01-13 Email Verification：发布前置门槛（仅影响发布者）

## 目标

- 防滥用、可找回账号：发布者必须验证邮箱才能发布 Skills
- 不影响普通用户：搜索/安装/查看详情等读接口保持不需要登录/验证
- 体验对齐 npm 心智：账号 → 验证邮箱 → 生成 token → CLI publish

## 变更

### Registry（Worker）

- 数据库新增邮箱验证字段与 token：
  - `publishers.email_verified` / `publishers.email_verified_at`
  - `email_verification_tokens` 表（一次性 token，过期时间）
- 新增 API：
  - `POST /auth/verify-email`（消费 token，完成验证）
  - `POST /auth/verify-email/request`（基于账号密码重发验证邮件）
- `POST /skills/:scope/:skill/publish` 增加门槛：
  - 未验证邮箱直接 `403`，错误信息指向 Console 的验证入口

### Publisher Console（Web）

- 新增页面：
  - `/verify-email`：点击邮件链接自动验证；也支持手动粘贴 token
  - `/verify-email/request`：输入账号 + 密码重发验证邮件
- Signup/Token/Publish 页增加提示：发布需要邮箱验证

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

# 本地迁移（可选，用于验证 SQL）
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --local
```

手动验收（建议在 prod 环境走一遍）：

1) Console 注册账号 → 收到验证邮件 → 点击链接完成验证
2) Console 创建 token
3) CLI `skild login` 后 `skild publish ...`：
   - 未验证时应 `403 Email not verified`
   - 验证后应能发布成功

## 部署 / 发布

```bash
# 1) 先迁移 D1（remote）
pnpm -C workers/registry exec wrangler d1 migrations apply skild-registry --remote

# 2) 部署 Worker
pnpm -C workers/registry exec wrangler deploy

# 3) Console 如需更新
pnpm deploy:console
```

