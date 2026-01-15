<div align="center">

# 🛡️ skild

**Get your agents skilled.**

*Agent Skills 的包管理器 — 轻松发现、安装、管理和发布 AI Agent Skills*

[![npm version](https://img.shields.io/npm/v/skild.svg)](https://www.npmjs.com/package/skild)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[官网](https://skild.sh) · [文档](./docs/README.md) · [Skild Hub](https://hub.skild.sh)

**[English](./README.md)** | 简体中文

</div>

---

## 🚀 快速开始

```bash
# 安装 skild
npm i -g skild

# 安装一个 Skill
skild install anthropics/skills/skills/pdf

# 列出已安装的 Skills
skild list
```

搞定！你的 Agent 现在拥有了 `pdf` 技能。

## 📖 什么是 Agent Skills？

[Agent Skills](https://agentskills.io) 是 Anthropic 发布的开放标准，用于为 AI Agent 扩展专业知识和工作流。**skild** 是这些 Skills 的包管理器 — 可以理解为 AI Agent 的 npm。

## 📦 安装 Skills

```bash
# 从 GitHub 安装（degit 简写）
skild install anthropics/skills/skills/pdf

# 从完整 GitHub URL 安装
skild install https://github.com/anthropics/skills/tree/main/skills/pdf

# 从本地目录安装
skild install ./my-skill

# 强制重新安装
skild install anthropics/skills/skills/pdf --force
```

## 🎯 多平台支持

默认安装到 Claude（`~/.claude/skills`），也支持 Codex、Copilot 和 Antigravity：

```bash
# 安装到 Codex（全局）
skild install anthropics/skills/skills/pdf -t codex

# 安装到 Antigravity（全局）
skild install anthropics/skills/skills/pdf -t antigravity

# 安装到 Codex（项目级别）
skild install anthropics/skills/skills/pdf -t codex --local

# 安装到 Antigravity（项目级别，./.agent/skills）
skild install anthropics/skills/skills/pdf -t antigravity --local
```

## 🔧 管理 Skills

```bash
skild list                 # 列出已安装的 Skills
skild info pdf             # 查看 Skill 详情
skild validate pdf         # 校验 Skill 结构
skild update pdf           # 更新 Skill
skild uninstall pdf        # 卸载 Skill
```

## ✨ 创建 Skills

```bash
skild init my-skill        # 创建新的 Skill 项目
cd my-skill
skild validate .           # 校验结构
```

准备分享了？请参考 **[发布 Skills](./docs/publishing.zh-CN.md)** 完整指南。

## 🛠️ 所有命令

| 命令 | 描述 |
|------|------|
| `skild install <source>` | 安装 Skill（Git URL / degit 简写 / 本地目录） |
| `skild list` | 列出已安装的 Skills |
| `skild info <skill>` | 查看已安装 Skill 详情 |
| `skild validate [path|skill]` | 校验 Skill 目录或已安装 Skill |
| `skild uninstall <skill>` | 卸载 Skill |
| `skild update [skill]` | 更新单个或全部已安装 Skill |
| `skild init <name>` | 创建新的 Skill 项目 |
| `skild signup` | 创建 registry 发布者账号 |
| `skild login` | 登录 registry（把 token 保存到本地） |
| `skild whoami` | 查看当前 registry 身份 |
| `skild logout` | 清除本地登录信息 |
| `skild search <query>` | 在 registry 搜索 Skills |
| `skild publish` | 发布 Skill 目录到 registry |

提示：可以用 `skild <命令> --help` 查看完整参数。

## 📚 文档

- **[快速上手](./docs/getting-started.zh-CN.md)** — 2 分钟入门
- **[安装 Skills](./docs/installing-skills.zh-CN.md)** — 各种安装方式
- **[创建 Skills](./docs/creating-skills.md)** — 构建你自己的 Skills
- **[发布 Skills](./docs/publishing.zh-CN.md)** — 分享给社区
- **[从 GitHub 提交](./docs/submit-from-github.zh-CN.md)** — 收录 GitHub Skills
- **[Skild Hub 指南](./docs/hub.zh-CN.md)** — Web 界面使用
- **[FAQ](./docs/faq.md)** — 常见问题

## ⭐ Star 趋势

<a href="https://star-history.com/#peiiii/skild&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=peiiii/skild&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=peiiii/skild&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=peiiii/skild&type=Date" />
 </picture>
</a>

## 🤝 参与贡献

欢迎贡献！详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 开源许可

MIT © [Peiiii](https://github.com/Peiiii)

---

<div align="center">

**🛡️ [skild.sh](https://skild.sh)**

*Get your agents skilled.*

</div>
