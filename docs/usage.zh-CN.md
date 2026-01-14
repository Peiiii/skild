# 使用文档

这是 **skild** 面向用户的端到端使用说明（CLI + registry + Skild Hub）。

## 安装 skild

```bash
npm i -g skild
# 或者（免安装）
npx skild@latest --help
```

可选（macOS/Linux）：使用官网脚本安装：

```bash
curl -fsSL https://skild.sh/install | sh
```

要求：Node.js `>=18`。

## 核心概念

- **Skill**：一个包含 `SKILL.md`（以及可选脚本/资源）的文件夹
- **Target 平台**：Skill 安装到哪里：
  - `claude` → `~/.claude/skills` 或 `./.claude/skills`
  - `codex` → `~/.codex/skills` 或 `./.codex/skills`
  - `copilot` → `~/.github/skills` 或 `./.github/skills`
  - `antigravity` → `~/.gemini/antigravity/skills` 或 `./.agent/skills`
- **Scope**：`global`（默认） vs `project`（`--local`）
- **Registry 身份**：`@publisher/skill[@version|tag]`（例如 `@peiiii/pdf@latest`）

## 常用工作流（本地优先）

### 从 GitHub / 本地目录安装

```bash
# GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 本地目录
skild install ./path/to/your-skill

# 指定平台 + 安装到当前项目（project-level）
skild install https://github.com/anthropics/skills/tree/main/skills/pdf -t codex --local
```

### list / info / validate

```bash
skild list
skild info pdf -t codex --local
skild validate pdf -t codex --local
```

### update / uninstall

```bash
skild update
skild update pdf -t codex --local
skild uninstall pdf -t codex --local
```

### 创建一个新的 Skill 项目

```bash
skild init my-skill
cd my-skill
skild validate .
```

## Registry 工作流（搜索 + 发布）

### 默认 registry

默认使用：

- `https://registry.skild.sh`

覆盖方式：

- 命令行：`--registry <url>`（适用于 registry 相关命令）
- 环境变量：`SKILD_REGISTRY_URL`

### Signup（创建发布者账号）

推荐：使用 **Skild Hub（Web）** 完成注册与 Token 管理。

CLI（无头）：

```bash
skild signup
```

邮箱验证：

- 发布（publish）可能要求邮箱已验证（取决于服务端策略）。
- 注册后检查邮箱的验证邮件（Skild Hub 也提供重发流程）。
- 本地联调说明：当 registry 以 `EMAIL_MODE=log` 运行时，不会真正发邮件，而是把验证链接打印在 registry 的 dev 日志里。

### login / whoami / logout

登录后 token 会保存到本地：

- `~/.skild/registry-auth.json`

```bash
skild login
skild whoami
skild logout
```

### 搜索 Skills

```bash
skild search pdf
```

### 从 registry 安装

当 install 的 source 形如 `@publisher/skill` 时，skild 会走 registry 安装：

```bash
skild install @peiiii/hello-skill
skild install @peiiii/hello-skill@latest
skild install @peiiii/hello-skill@1.2.3

# 指定平台 + project-level
skild install @peiiii/hello-skill -t codex --local
```

### 发布到 registry

1) 确保 Skill 目录里有有效的 `SKILL.md` frontmatter：

```md
---
name: hello-skill
description: ...
version: 0.1.0
---
```

2) 登录后发布：

```bash
skild login
skild publish --dir ./path/to/skill
```

说明：

- 用 `--skill-version` 覆盖版本（不使用 `--version`，因为会和 CLI 自己的 `--version` 冲突）。
- 如果 name 是未带 scope 的（例如 `hello-skill`），`skild publish` 会从 registry 推断 scope，并发布为 `@<你的-handle>/hello-skill`。
- 如果 publish 返回 `Email not verified`（HTTP 403），需要先在 Skild Hub（`/verify-email`）完成邮箱验证。

## Skild Hub（Web）

Skild Hub 是一个最小可用的 Web 界面，用于：

- 注册（Signup）
- 邮箱验证（可能是发布前置条件，取决于服务端策略）
- 创建 access token（只展示一次）
- 搜索与查看 Skill 详情
- 发布指引

如果你配置了自定义域名，通常会是：

- `https://hub.skild.sh`

## skild 会写入哪些文件

- 全局配置：`~/.skild/config.json`
- Registry 登录信息：`~/.skild/registry-auth.json`
- 全局 lock：`~/.skild/lock.json`
- 项目级 lock：`./.skild/lock.json`
- 每个 Skill 的安装元数据：`<skill-dir>/.skild/install.json`

## 排错

- **“没有 skild login”**：确认你安装的是最新版本：
  - `npm view skild@latest version`
  - `npx skild@latest -- --help` 应该能看到 `login`。
- **registry 不通 / 卡住**：请求有超时机制；可尝试：
  - `--registry https://registry.skild.sh`
  - 或设置 `SKILD_REGISTRY_URL`。
