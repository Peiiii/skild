# 2026-01-12 Registry Auth：对齐 npm 心智的 Web 登录方案（规划）

## 背景 / 问题

- 目前 `skild signup/login` 走“命令行输入 email/handle/password”，这不符合 npm 用户的既有心智（npm 的核心体验是：CLI 触发 → 浏览器完成授权 → CLI 获得 token）
- npm 的范式天然依赖前端页面（账号体系/验证/同意授权/2FA/设备登录），我们也需要
- 我们要先做“性价比最高”的部分：**默认、顺滑、安全、可扩展**，但不一次性做复杂 SSO/2FA/组织体系

## 目标（本阶段）

- `skild login` 默认走“打开浏览器授权”的路径（与 npm 心智对齐）
- CLI 可以在 headless 环境工作（无法自动打开浏览器时，也能复制链接完成）
- token 的签发/撤销/生命周期可控（为后续风控、2FA、组织 scope 打基础）
- 不引入用户配置文件（仍使用既有本地凭证存储：`~/.skild/registry-auth.json`）

## 非目标（本阶段明确不做）

- 不做 GitHub 绑定/SSO（后续迭代再上）
- 不做 2FA/Authenticator（先留接口与数据模型）
- 不做组织/团队/付费/私有包
- 不做“复杂多 token 管理 UI”（只做最小可用）

## UX 规范（对齐 npm）

### 1) `skild login`（默认）

- CLI 输出：
  - 一次性 `user_code`
  - `verification_uri`（例如：`https://skild.sh/login` 或 `https://registry.skild.sh/login`）
  - 进度提示：等待用户在浏览器完成确认
- CLI 行为：
  - 尝试自动打开浏览器（失败则只提示复制链接）
  - 轮询 token endpoint（带超时与清晰错误）
- 成功后：
  - 本地保存 token（`~/.skild/registry-auth.json`）
  - 输出：`Logged in as <handle>`

### 2) `skild logout`

- 清理本地 token（保持现有行为）
- 可选增强：支持 `--revoke` 远端吊销（后续可加）

### 3) `skild whoami`

- 已完成：未登录/不可达快速失败（避免卡住）
- 后续可增强：打印当前 registry、handle、token 名称/创建时间（不泄露敏感 token）

### 4) `skild signup`

两条路径都保留（以 web 为主）：
- 推荐：浏览器注册（与 npm 更一致）
- CLI 保留：仅作为 dev/CI/自托管便利入口（文档降级为“高级用法”）

## 架构决策

### 域名与职责

- **Registry API**：`https://registry.skild.sh`（Worker）
- **Auth Web UI**：`https://skild.sh/login`（现有首页域名，便于品牌与 SEO）
  - UI 只做展示与交互，所有业务规则归属 registry API（符合“UI 组件禁止依赖业务逻辑”）

### 登录协议：Device Authorization Flow（设备码模式）

原因：
- 与 npm/各类现代 CLI（GitHub CLI、Cloudflare wrangler 等）体验一致
- 不要求 CLI 开本地回调端口，兼容 headless
- 能逐步扩展到 2FA / SSO，不会推翻

## API 设计（最小闭环）

以 `registry.skild.sh` 为例：

- `POST /auth/device/start`
  - 入参：`{ clientName?: string }`
  - 返回：`{ userCode, deviceCode, verificationUri, expiresIn, interval }`
- `POST /auth/device/poll`
  - 入参：`{ deviceCode }`
  - 返回：
    - pending：`{ ok: true, status: "pending" }`
    - approved：`{ ok: true, status: "approved", token, publisher }`
    - expired/denied：明确错误码
- `POST /auth/device/approve`
  - 由 Web UI 调用
  - 入参：`{ userCode, handleOrEmail, password, tokenName? }`
  - 返回：`{ ok: true }`（token 通过 poll 下发给 CLI；避免 token 直接暴露给浏览器页面/日志）

保留现有 endpoint（兼容 CI/自托管），但文档上降级：
- `POST /auth/signup`
- `POST /auth/login`（password 直登）

## 数据模型（增量）

在现有 D1 基础上新增最小表：

- `device_codes`
  - `id`, `user_code_hash`, `device_code_hash`
  - `publisher_id (nullable)`, `status(pending/approved/denied/expired)`
  - `created_at`, `expires_at`, `approved_at`
  - `client_name`, `ip`, `user_agent`（可选，用于风控与审计）

安全性：
- 只存 hash（user_code/device_code），避免明文泄露
- device_code 仅用于短时轮询，过期自动失效

## 生产可用性（低优先级但建议做的“最小集”）

- 基础限流：`/auth/device/start`、`/auth/device/poll` 按 IP 频率限制
- 审计日志（最小）：token 签发事件（publisherId、tokenId、createdAt、clientName）

## 验证（怎么确认符合预期）

保持轻量（3～6 条命令 + 明确验收点）：

```bash
pnpm build
pnpm lint
pnpm typecheck

curl -fsS https://registry.skild.sh/health

# 期望：输出一个 verification URL + code，并在未完成授权前不阻塞/可超时退出
pnpm -s cli login
pnpm -s cli whoami
```

验收点：

- `skild login` 会给出可点击的 URL + code（符合 npm 心智）
- 通过浏览器完成授权后，CLI 自动拿到 token 并保存
- 未完成授权时 CLI 不会无限卡住（有明确超时/取消提示）

