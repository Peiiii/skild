# Skild：Agent Skills & Skillsets 的统一包管理（Claude/Codex/Copilot/Antigravity/...）

Skild 是一个开源的 CLI + registry，让不同 AI agent 平台的 skills 更容易被发现、安装和分享。

GitHub: https://github.com/Peiiii/skild  
Website: https://skild.sh  
Hub（搜索/浏览）: https://hub.skild.sh  

---

## 问题是什么

Skills 正在成为 AI agent/IDE 的基础能力，但生态仍然割裂：

- 每个平台的安装路径和约定都不一样。
- Skills 分散在多个地方（GitHub 仓库、子目录、 curated list、registry）。
- “安装”往往是手动复制粘贴，难以复现、难以维护。

Skild 把这些变成一个可脚本化、可分享、可重复的统一流程。

---

## Skild 能做什么

### 1) 从 GitHub、简写、registry 或本地目录安装

```bash
# GitHub URL
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 简写（degit 风格）
skild install anthropics/skills/skills/pdf

# Registry
skild install @publisher/skill

# 本地目录
skild install ./path/to/skill
```

### 2) 安装到多个平台（并保持一致）

Skild 支持：

- Claude: `~/.claude/skills`
- Codex: `~/.codex/skills`
- Copilot: `~/.github/skills`
- Antigravity: 项目内 `./.agent/skills` 或全局 `~/.gemini/antigravity/skills`

只安装到某一平台：

```bash
skild install anthropics/skills/skills/pdf -t codex
```

安装到所有支持的平台：

```bash
skild install anthropics/skills/skills/pdf --all
```

### 3) 通过 alias 快速安装

如果 skill/skillset 发布时提供全局唯一 alias，就能用短名称安装：

```bash
skild install superpowers
```

无需再记 `@publisher/name` 或长链接。

### 4) 多技能仓库：发现 + 一次性安装

许多仓库会在 `skills/*/SKILL.md` 下包含多个技能（例如 `anthropics/skills`）。

Skild 可以安装仓库根目录、自动发现所有技能，并让你确认：

```bash
skild install https://github.com/anthropics/skills
```

非交互模式（CI/脚本）：

```bash
skild install https://github.com/anthropics/skills --recursive
# 或跳过确认（默认 yes）
skild install https://github.com/anthropics/skills -y
```

### 5) Skillsets：组合并发布技能合集

“Skillset” 是一种声明依赖的技能，允许你用一次安装发布一个 curated skill pack。

适合：

- 团队标准化（“我们的默认工具箱”）
- 角色包（前端、SRE、PM、设计）
- 公共精选合集

---

## 快速开始

安装：

```bash
npm i -g skild
```

试用：

```bash
skild install anthropics/skills/skills/pdf
skild list
```

或无需安装直接运行：

```bash
npx skild@latest --help
```

---

## 更多资料

- 发布 Skills 指南：https://github.com/Peiiii/skild/blob/main/docs/publishing-skills.md
- 创建 Skills 指南：https://github.com/Peiiii/skild/blob/main/docs/creating-skills.md

---

## 为什么重要

当 skills 成为日常工作的一部分，“安装与生命周期管理”就是工程问题：

- 可复现性（装了什么？装到哪里？哪个版本？）
- 安全更新与干净卸载
- 团队共享与标准化
- 自动化（CI 初始化、模板仓库、入职脚本）

Skild 的目标是让这些流程像装一个包一样稳定可靠。

---

## 反馈与合作

如果你在构建 skills、维护 skill collection，或想在团队里标准化 skills，很欢迎交流：

- 你最关心的平台是什么
- “完美的安装体验”应该长什么样
- 还缺哪些原语（版本管理、锁定、lockfile、发现体验等）

GitHub: https://github.com/Peiiii/skild
