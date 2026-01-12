# 2026-01-13 Web Signup：最小可用注册页（先解决“注册入口”，不做复杂登录流）

## 背景 / 问题

- 仅靠 `skild signup`（CLI 注册）不符合大多数用户习惯；注册本身应该有 Web 入口
- 我们当前阶段的目标是“最简单化体验”：先把注册入口打通，避免引入 device flow / OAuth / 2FA 等复杂系统
- 但一旦上 Web 注册，就会遇到浏览器跨域（CORS）与安全策略的问题，需要最小闭环方案

## 目标（本阶段）

- 用户打开 `skild.sh` 就能注册 publisher（获得 `@handle/*` scope）
- 注册成功后能明确引导用户下一步：`skild login` → `skild publish`
- 仅做 UI + 调用 API：Web 不承载业务规则（符合“UI 组件禁止依赖业务逻辑”）

## 非目标（本阶段明确不做）

- 不做 device authorization flow（CLI 打开浏览器 + code + poll）
- 不做 Web 登录/会话/管理后台
- 不做 2FA/Authenticator
- 不做 GitHub/Google 登录
- 不做组织/团队/付费/私有包

## 用户流程（对齐直觉）

1) 用户访问：`https://skild.sh/signup`
2) 输入：email / handle / password
3) 点击注册 → 调用 `https://registry.skild.sh/auth/signup`
4) 成功页展示：
   - “注册成功：你拥有 `@handle/*`”
   - 一键复制命令：
     - `skild login`
     - `skild publish --dir <path> --name <skill> --skill-version <ver>`
   - 如果用户未安装 skild，给 `npm/pnpm` 安装指引（与项目整体发布策略一致）

## 系统设计（最小闭环）

### 1) Web Console（`apps/console`）

- 技术栈：React + Vite + TypeScript + TailwindCSS + shadcn/ui
- 路由：`react-router-dom`
- 新增页面：`/signup`（以及后续 `token/new` 等）
  - 纯表单 + client-side fetch
  - 错误提示（handle 已存在 / 格式不合法 / 密码过短等）由后端返回并展示
- 不保存任何 token、不持久化密码、不做登录态

### 2) Registry API（`workers/registry`）

- 继续复用现有 `POST /auth/signup`
- 增加 CORS（必须，否则浏览器无法调用）：
  - 允许 Origin：`https://skild.sh`（必要时再加 `https://www.skild.sh`）
  - 允许方法：`POST, GET, OPTIONS`
  - 允许 Header：`content-type, authorization`
  - `OPTIONS` 预检快速返回

## 安全与滥用控制（最小集）

- Web 侧：
  - 不在 URL/日志里携带密码
  - 表单提交按钮防重复点击（避免误触发多次）
- API 侧（最低限度）：
  - 注册限流（按 IP + 简单阈值）
  - 错误信息避免泄露敏感细节（例如不要区分“邮箱存在/不存在”到过细）

## 验证（怎么确认符合预期）

```bash
pnpm build
pnpm lint
pnpm typecheck

curl -fsS https://registry.skild.sh/health
curl -fsS -X POST https://registry.skild.sh/auth/signup \
  -H "content-type: application/json" \
  -d '{"email":"you@example.com","handle":"acme123","password":"pass1234!"}'
```

验收点：

- 浏览器访问 `https://skild.sh/signup` 能完成注册
- Network 面板无 CORS 报错（说明 CORS 配对成功）
- 注册成功后页面能给出明确下一步命令（`skild login`）

## 部署 / 发布

- Web（`apps/console`）：部署到 `skild.sh` 的子路径或独立子域（推荐 `console.skild.sh`）
- Registry（`workers/registry`）：`pnpm -C workers/registry exec wrangler deploy`
