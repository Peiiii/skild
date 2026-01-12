# 2026-01-13 PRD：Skild Registry — Publisher Console MVP（对标 npm 的平台形态）

## 1. 背景

当前 registry 已具备：

- CLI 安装/发布的最小闭环（registry 托管 tarball、版本不可变、integrity 校验）
- 官方域名：`https://registry.skild.sh`（Worker API）

但从用户视角仍存在关键阻力：

- **注册/创建 publisher 的入口不符合习惯**：仅靠 CLI `signup` 不符合 npm 等平台的使用预期
- “平台”不应只是一组 auth endpoint：需要一个清晰的 Web 控制台入口，完成 onboarding、token 获取、发布指引、基础 discover

## 2. 一句话定义（对外）

Skild Registry 是“面向 Agent Skills 的 npm-like 分发平台”：可注册发布者、可签发发布 token、可发布版本、可搜索发现、可一键安装。

## 3. 目标（MVP）

### 3.1 业务目标

- 让新用户 **在浏览器完成注册**，并顺利走通：获得 token → CLI login → publish → install → search
- 减少 CLI 端输入敏感信息与复杂参数（对齐 npm 心智）

### 3.2 产品目标

- 提供一个“Publisher Console MVP”，覆盖：
  - 注册（Signup）
  - 获取/创建 token（Create Token）
  - 发布指引（How to publish）
  - 基础 discover（Search + Skill 详情页）

### 3.3 工程目标

- Web 只做 UI/交互，不承载业务规则（业务规则在 `workers/registry`）
- 不引入复杂会话系统：MVP 允许“无持久登录态”的 stateless console（每次操作可要求输入凭证）

## 4. 非目标（MVP 明确不做）

对标 npm，但明确不在 MVP 做：

- 不做 org/team/权限体系（npm 有，MVP 不做）：冷启动阶段先服务个人发布者；设计上预留 `publisherId` 扩展即可
- 不做 2FA/Authenticator（npm 有，MVP 不做）：先做 token 生命周期与撤销能力；2FA 作为后续增强
- 不做复杂依赖图/semver range（npm 有，MVP 不做）：skills 的核心是“单包能力分发”，先把单包可复现做到极致
- 不做 private/付费/企业镜像（npm 有，MVP 不做）：先闭环公域生态与内容质量
- 不做 device authorization flow（更先进但更复杂）：先用最小方案达成“浏览器注册 + token + CLI login”

## 5. 用户与场景

### 5.1 Persona

- Publisher（发布者）：想把自己的 skill 分发给别人，并持续迭代更新
- User（使用者）：想快速找到并安装一个可信的 skill

### 5.2 核心使用链路（MVP 必须跑通）

1) 浏览器注册 publisher（拿到 `@handle/*` scope）
2) 浏览器创建 token（显示一次，用户复制）
3) CLI `skild login`（粘贴/输入 token，或继续保留 password 登录作为 fallback）
4) CLI `skild publish`
5) 使用者通过 Web 搜索/详情页复制 `skild install @handle/skill`

## 6. 信息架构（IA）

### 6.1 域名职责（推荐）

- `registry.skild.sh`：Registry API（Worker）
- `skild.sh`：对外 Web（Marketing）
- `console.skild.sh`：Publisher Console（React SPA，MVP）

### 6.2 页面（MVP）

Public（所有人可访问）：

- `/`：介绍 + 搜索入口（可先弱化）
- `/skills`：搜索结果列表（query、platform filter 可后置）
- `/skills/@scope/name`：Skill 详情页（版本列表/最新版本、安装命令、一键复制）

Publisher Console（无需长期登录态，MVP 允许每次输入凭证）：

- `/signup`：注册页（email、handle、password）
- `/token/new`：创建 token（handle/email、password、tokenName）
  - 成功后展示 token（只显示一次）+ 复制按钮
- `/publish`：发布指引（copy commands、常见错误）

## 7. 功能需求（MVP）

### 7.1 注册（Web Signup）

输入：

- Email
- Handle（即 scope：`@handle/*`）
- Password

输出：

- 注册成功提示（拥有 `@handle/*`）
- 明确下一步：
  - 去 `/token/new` 创建 token
  - 复制 `skild login` / `skild publish` 命令

约束：

- handle 规则：小写字母/数字/短横线（与 registry 校验一致）

### 7.2 创建 Token（Web Create Token）

输入：

- Handle 或 Email
- Password
- Token Name（可选，默认 `default`）

输出：

- Token 明文（仅显示一次）
- 提示用户保存（丢失需重新创建）

实现策略（MVP 省成本）：

- 直接复用 registry 现有 `POST /auth/login` 返回的 token（等价于“创建 token”）
- 不做 token 列表页/撤销页（后续迭代补）

### 7.3 Discover（Web Search + Detail）

Search：

- 输入关键字 `q`，展示 name/description/updatedAt

Detail：

- 展示：name、description、dist-tags、最近版本
- 提供可复制安装命令：`skild install @handle/skill`

### 7.4 CLI 对接（MVP）

MVP 不强制改 CLI（但推荐增强，提升闭环成功率）：

- `skild login` 支持从 stdin 读取 token（避免命令行参数泄露）
- 或提供 `skild login --token`（可选）

备注：

- 当前 CLI 仍支持 password 直登（对齐 npm 最小范式），但对外推荐 Web 创建 token

## 8. API 需求（MVP）

目标：尽量复用现有 endpoint，只补齐 Web 所需的 CORS。

必须复用：

- `POST https://registry.skild.sh/auth/signup`
- `POST https://registry.skild.sh/auth/login`（用于 token 创建）
- `GET  https://registry.skild.sh/skills`
- `GET  https://registry.skild.sh/skills/:scope/:skill`

必须新增/调整：

- CORS：
  - 允许 Origin：`https://skild.sh`
  - 允许方法：`POST, GET, OPTIONS`
  - 允许 headers：`content-type, authorization`
  - 支持 `OPTIONS` 预检

## 9. 安全与风控（MVP 最小集）

- 注册与 login 相关 endpoint：
  - 基础限流（按 IP）
  - 错误信息不要暴露敏感细节（避免枚举）
- token：
  - Web 只显示一次
  - 不写入 URL，不写入 localStorage（MVP 可以只显示在页面内存）
- 审计：
  - token 签发事件（至少保留 publisherId、tokenId、createdAt、lastUsedAt）

## 10. 验收标准（可验证）

功能验收：

- 能通过 `skild.sh/signup` 完成注册，随后在 `skild.sh/token/new` 拿到 token
- 能用 token 在 CLI 完成 login（或 password fallback），再 publish 一个 skill
- 能在 `skild.sh/skills?q=...` 搜到该 skill，详情页能复制正确安装命令

工程验收：

- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`

## 11. 部署与发布（MVP）

- Web Console（`apps/console`）：部署到 `console.skild.sh`（静态站点/CDN）
- Registry（`workers/registry`）：`wrangler deploy`
